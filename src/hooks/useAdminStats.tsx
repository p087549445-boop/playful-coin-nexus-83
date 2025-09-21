import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from './useAuth';

interface AdminStats {
  gameSessions: {
    total: number;
    growth: string;
  };
  totalRevenue: {
    amount: number;
    growth: string;
  };
  activePlayers: {
    count: number;
    recentIncrease: number;
  };
}

export const useAdminStats = () => {
  const [stats, setStats] = useState<AdminStats>({
    gameSessions: { total: 0, growth: '0%' },
    totalRevenue: { amount: 0, growth: '0%' },
    activePlayers: { count: 0, recentIncrease: 0 }
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();

  const fetchStats = async () => {
    try {
      // Get current month and last month dates
      const now = new Date();
      const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);
      const lastMonthStart = new Date(now.getFullYear(), now.getMonth() - 1, 1);
      const lastMonthEnd = new Date(now.getFullYear(), now.getMonth(), 0);
      const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);

      // Fetch game sessions data
      const { data: currentGameSessions } = await supabase
        .from('game_sessions')
        .select('id')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: lastGameSessions } = await supabase
        .from('game_sessions')
        .select('id')
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      // Calculate game sessions growth
      const currentCount = currentGameSessions?.length || 0;
      const lastCount = lastGameSessions?.length || 0;
      const gameGrowth = lastCount > 0 ? ((currentCount - lastCount) / lastCount * 100).toFixed(1) : '0';

      // Fetch revenue data from transactions
      const { data: currentRevenue } = await supabase
        .from('transactions')
        .select('amount')
        .eq('transaction_type', 'topup')
        .gte('created_at', currentMonthStart.toISOString());

      const { data: lastRevenue } = await supabase
        .from('transactions')
        .select('amount')
        .eq('transaction_type', 'topup')
        .gte('created_at', lastMonthStart.toISOString())
        .lte('created_at', lastMonthEnd.toISOString());

      // Calculate revenue totals
      const currentRevenueTotal = currentRevenue?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const lastRevenueTotal = lastRevenue?.reduce((sum, t) => sum + t.amount, 0) || 0;
      const revenueGrowth = lastRevenueTotal > 0 ? ((currentRevenueTotal - lastRevenueTotal) / lastRevenueTotal * 100).toFixed(0) : '0';

      // Fetch active players (users who played in last 24 hours)
      const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
      const { data: activePlayers } = await supabase
        .from('game_sessions')
        .select('user_id')
        .gte('created_at', twentyFourHoursAgo.toISOString());

      // Get unique active players
      const uniqueActivePlayers = new Set(activePlayers?.map(p => p.user_id) || []).size;

      // Fetch recent players (last hour)
      const { data: recentPlayers } = await supabase
        .from('game_sessions')
        .select('user_id')
        .gte('created_at', oneHourAgo.toISOString());

      const uniqueRecentPlayers = new Set(recentPlayers?.map(p => p.user_id) || []).size;

      setStats({
        gameSessions: {
          total: currentCount,
          growth: `${gameGrowth}%`
        },
        totalRevenue: {
          amount: currentRevenueTotal,
          growth: `${revenueGrowth}%`
        },
        activePlayers: {
          count: uniqueActivePlayers,
          recentIncrease: uniqueRecentPlayers
        }
      });
    } catch (error) {
      console.error('Error fetching admin stats:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchStats();
      
      // Set up real-time subscriptions
      const gameSessionsChannel = supabase
        .channel('game_sessions_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'game_sessions' }, fetchStats)
        .subscribe();

      const transactionsChannel = supabase
        .channel('transactions_changes')
        .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions' }, fetchStats)
        .subscribe();

      return () => {
        supabase.removeChannel(gameSessionsChannel);
        supabase.removeChannel(transactionsChannel);
      };
    }
  }, [user]);

  return { stats, loading, refetch: fetchStats };
};