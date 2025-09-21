import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { BarChart3, TrendingUp, Users, Gamepad2, CreditCard, Calendar } from 'lucide-react';
import { useAdminStats } from '@/hooks/useAdminStats';

interface AnalyticsData {
  totalUsers: number;
  totalGames: number;
  totalRevenue: number;
  avgSessionDuration: number;
  topGames: Array<{ game_type: string; count: number }>;
  revenueHistory: Array<{ date: string; amount: number }>;
}

export default function AdminAnalytics() {
  const [analytics, setAnalytics] = useState<AnalyticsData>({
    totalUsers: 0,
    totalGames: 0,
    totalRevenue: 0,
    avgSessionDuration: 0,
    topGames: [],
    revenueHistory: []
  });
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { stats } = useAdminStats();

  const fetchAnalytics = async () => {
    try {
      // Get total users
      const { data: usersData } = await supabase
        .from('profiles')
        .select('id');

      // Get top games by session count
      const { data: topGamesData } = await supabase
        .from('game_sessions')
        .select('game_type')
        .order('created_at', { ascending: false });

      // Calculate top games
      const gameCount: Record<string, number> = {};
      topGamesData?.forEach(session => {
        gameCount[session.game_type] = (gameCount[session.game_type] || 0) + 1;
      });

      const topGames = Object.entries(gameCount)
        .map(([game_type, count]) => ({ game_type, count }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5);

      // Get revenue history (last 7 days)
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const date = new Date();
        date.setDate(date.getDate() - i);
        return date.toISOString().split('T')[0];
      }).reverse();

      const revenueHistory = await Promise.all(
        last7Days.map(async (date) => {
          const nextDate = new Date(date);
          nextDate.setDate(nextDate.getDate() + 1);
          
          const { data } = await supabase
            .from('transactions')
            .select('amount')
            .eq('transaction_type', 'topup')
            .gte('created_at', date)
            .lt('created_at', nextDate.toISOString().split('T')[0]);

          const amount = data?.reduce((sum, t) => sum + t.amount, 0) || 0;
          return { date, amount };
        })
      );

      setAnalytics({
        totalUsers: usersData?.length || 0,
        totalGames: topGamesData?.length || 0,
        totalRevenue: stats.totalRevenue.amount,
        avgSessionDuration: 0, // You can calculate this based on your needs
        topGames,
        revenueHistory
      });
    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAnalytics();
    }
  }, [user, stats]);

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading analytics...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Analytics Dashboard
        </h1>
        <p className="text-muted-foreground">
          Analisis mendalam tentang performa platform gaming
        </p>
      </div>

      {/* Overview Stats */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalUsers.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              pengguna terdaftar
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Games</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalGames.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              game sessions dimainkan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{analytics.totalRevenue.toLocaleString()} coins</div>
            <p className="text-xs text-muted-foreground">
              total pendapatan
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Growth</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRevenue.growth}</div>
            <p className="text-xs text-muted-foreground">
              pertumbuhan bulan ini
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analytics */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Top Games */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Game Populer
            </CardTitle>
            <CardDescription>Game yang paling sering dimainkan</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.topGames.map((game, index) => (
                <div key={game.game_type} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
                      <span className="text-sm font-bold">#{index + 1}</span>
                    </div>
                    <span className="font-medium capitalize">{game.game_type}</span>
                  </div>
                  <span className="text-sm text-muted-foreground">
                    {game.count.toLocaleString()} sessions
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Revenue Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Revenue Harian
            </CardTitle>
            <CardDescription>Pendapatan 7 hari terakhir</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {analytics.revenueHistory.map((day) => (
                <div key={day.date} className="flex items-center justify-between">
                  <span className="text-sm">
                    {new Date(day.date).toLocaleDateString('id-ID', { 
                      weekday: 'short', 
                      month: 'short', 
                      day: 'numeric' 
                    })}
                  </span>
                  <span className="font-medium">
                    {day.amount.toLocaleString()} coins
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}