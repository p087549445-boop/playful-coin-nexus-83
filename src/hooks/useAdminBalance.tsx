import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

export const useAdminBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_balance')
        .select('balance')
        .single();

      if (error) {
        console.error('Error fetching admin balance:', error);
        return;
      }

      setBalance(data?.balance || 0);
    } catch (error) {
      console.error('Error fetching admin balance:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchBalance();
      
      // Set up real-time subscription
      const channel = supabase
        .channel('admin_balance_changes')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'admin_balance'
          },
          () => fetchBalance()
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  return { balance, loading, refetch: fetchBalance };
};