-- Fix the approve_topup_request function - add WHERE clause to admin_balance update
DROP FUNCTION IF EXISTS public.approve_topup_request(uuid, uuid, text);

CREATE OR REPLACE FUNCTION public.approve_topup_request(request_id uuid, admin_id uuid, notes text DEFAULT NULL::text)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path TO 'public'
AS $$
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
    RAISE EXCEPTION 'Request not found or already processed';
  END IF;
  
  -- Get current admin balance
  SELECT balance INTO current_admin_balance
  FROM public.admin_balance
  LIMIT 1;
  
  -- Check if admin has enough balance
  IF current_admin_balance < request_amount THEN
    RAISE EXCEPTION 'Insufficient admin balance. Required: %, Available: %', request_amount, current_admin_balance;
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
  
  -- Decrease admin balance (fixed with WHERE clause)
  UPDATE public.admin_balance
  SET 
    balance = balance - request_amount,
    updated_at = now()
  WHERE id IS NOT NULL;
  
  -- Create transaction record
  INSERT INTO public.transactions (user_id, transaction_type, amount, description, topup_request_id)
  VALUES (request_user_id, 'topup', request_amount, 'Top-up approved by admin', request_id);
  
  RETURN TRUE;
EXCEPTION
  WHEN OTHERS THEN
    RAISE;
END;
$$;