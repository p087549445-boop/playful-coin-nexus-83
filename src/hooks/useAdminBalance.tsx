import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useAdminBalance = () => {
  const [balance, setBalance] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    fetchBalance();
    
    // Set up real-time subscription
    const channel = supabase
      .channel('admin-balance-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'admin_balance'
        },
        (payload) => {
          if (payload.eventType === 'UPDATE' && payload.new) {
            setBalance(payload.new.balance);
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchBalance = async () => {
    try {
      const { data, error } = await supabase
        .from('admin_balance')
        .select('balance')
        .single();

      if (error) {
        console.error('Error fetching admin balance:', error);
        toast({
          title: "Error",
          description: "Gagal mengambil data balance admin",
          variant: "destructive"
        });
      } else {
        setBalance(data.balance);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  return {
    balance,
    loading,
    refetch: fetchBalance
  };
};