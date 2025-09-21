-- Add admin balance tracking
CREATE TABLE public.admin_balance (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  balance BIGINT NOT NULL DEFAULT 1000000000,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.admin_balance ENABLE ROW LEVEL SECURITY;

-- Admin balance policies
CREATE POLICY "Admins can view admin balance" 
ON public.admin_balance 
FOR SELECT 
USING (is_admin(auth.uid()));

CREATE POLICY "Admins can update admin balance" 
ON public.admin_balance 
FOR UPDATE 
USING (is_admin(auth.uid()));

-- Insert initial admin balance
INSERT INTO public.admin_balance (balance) VALUES (1000000000);

-- Add trigger for admin balance updated_at
CREATE TRIGGER update_admin_balance_updated_at
BEFORE UPDATE ON public.admin_balance
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add transaction history table
CREATE TABLE public.transactions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  transaction_type TEXT NOT NULL CHECK (transaction_type IN ('topup', 'game_win', 'game_loss', 'admin_transfer')),
  amount INTEGER NOT NULL,
  description TEXT,
  topup_request_id UUID,
  game_session_id UUID,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS for transactions
ALTER TABLE public.transactions ENABLE ROW LEVEL SECURITY;

-- Transaction policies
CREATE POLICY "Users can view their own transactions" 
ON public.transactions 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own transactions" 
ON public.transactions 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Admins can view all transactions" 
ON public.transactions 
FOR ALL 
USING (is_admin(auth.uid()));

-- Function to handle topup approval
CREATE OR REPLACE FUNCTION public.approve_topup_request(
  request_id UUID,
  admin_id UUID,
  notes TEXT DEFAULT NULL
)
RETURNS BOOLEAN AS $$
DECLARE
  request_amount INTEGER;
  request_user_id UUID;
  current_admin_balance BIGINT;
BEGIN
  -- Get topup request details
  SELECT amount, user_id INTO request_amount, request_user_id
  FROM public.topup_requests
  WHERE id = request_id AND status = 'pending';
  
  IF NOT FOUND THEN
    RETURN FALSE;
  END IF;
  
  -- Get current admin balance
  SELECT balance INTO current_admin_balance
  FROM public.admin_balance
  LIMIT 1;
  
  -- Check if admin has enough balance
  IF current_admin_balance < request_amount THEN
    RETURN FALSE;
  END IF;
  
  -- Update topup request
  UPDATE public.topup_requests
  SET 
    status = 'approved',
    approved_by = admin_id,
    admin_notes = notes,
    updated_at = now()
  WHERE id = request_id;
  
  -- Update user coin balance
  UPDATE public.profiles
  SET 
    coin_balance = coin_balance + request_amount,
    updated_at = now()
  WHERE user_id = request_user_id;
  
  -- Decrease admin balance
  UPDATE public.admin_balance
  SET 
    balance = balance - request_amount,
    updated_at = now();
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, transaction_type, amount, description, topup_request_id)
  VALUES (request_user_id, 'topup', request_amount, 'Top-up approved by admin', request_id);
  
  RETURN TRUE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Function to handle game results
CREATE OR REPLACE FUNCTION public.process_game_result(
  p_user_id UUID,
  p_game_type TEXT,
  p_result TEXT,
  p_coins_spent INTEGER,
  p_coins_won INTEGER
)
RETURNS UUID AS $$
DECLARE
  session_id UUID;
  current_balance INTEGER;
BEGIN
  -- Get current user balance
  SELECT coin_balance INTO current_balance
  FROM public.profiles
  WHERE user_id = p_user_id;
  
  -- Check if user has enough coins
  IF current_balance < p_coins_spent THEN
    RAISE EXCEPTION 'Insufficient coins';
  END IF;
  
  -- Create game session
  INSERT INTO public.game_sessions (user_id, game_type, result, coins_spent, coins_won)
  VALUES (p_user_id, p_game_type, p_result, p_coins_spent, p_coins_won)
  RETURNING id INTO session_id;
  
  -- Update user balance
  UPDATE public.profiles
  SET 
    coin_balance = coin_balance - p_coins_spent + p_coins_won,
    updated_at = now()
  WHERE user_id = p_user_id;
  
  -- Create transaction records
  IF p_coins_spent > 0 THEN
    INSERT INTO public.transactions (user_id, transaction_type, amount, description, game_session_id)
    VALUES (p_user_id, 'game_loss', -p_coins_spent, p_game_type || ' - Coins spent', session_id);
  END IF;
  
  IF p_coins_won > 0 THEN
    INSERT INTO public.transactions (user_id, transaction_type, amount, description, game_session_id)
    VALUES (p_user_id, 'game_win', p_coins_won, p_game_type || ' - Coins won', session_id);
  END IF;
  
  RETURN session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;