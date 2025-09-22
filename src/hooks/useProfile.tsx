import { useState, useEffect } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface Profile {
  id: string;
  user_id: string;
  username: string;
  full_name: string;
  role: string;
  coin_balance: number;
  created_at: string;
  updated_at: string;
  is_banned: boolean;
  banned_at: string | null;
  banned_by: string | null;
  ban_reason: string | null;
}

export const useProfile = () => {
  const { user } = useAuth();
  const [profile, setProfile] = useState<Profile | null>(null);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  useEffect(() => {
    if (user) {
      fetchProfile();
    } else {
      setProfile(null);
      setLoading(false);
    }
  }, [user]);

  const fetchProfile = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) {
        console.error('Error fetching profile:', error);
        toast({
          title: "Error",
          description: "Gagal mengambil data profil",
          variant: "destructive"
        });
      } else {
        setProfile(data);
      }
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateCoinBalance = async (newBalance: number) => {
    if (!user || !profile) return;

    try {
      const { error } = await supabase
        .from('profiles')
        .update({ coin_balance: newBalance })
        .eq('user_id', user.id);

      if (error) {
        toast({
          title: "Error",
          description: "Gagal mengupdate balance coin",
          variant: "destructive"
        });
      } else {
        setProfile(prev => prev ? { ...prev, coin_balance: newBalance } : null);
      }
    } catch (error) {
      console.error('Error updating balance:', error);
    }
  };

  return {
    profile,
    loading,
    refetch: fetchProfile,
    updateCoinBalance
  };
};