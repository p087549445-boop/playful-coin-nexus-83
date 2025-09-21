import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAdminBalance } from "@/hooks/useAdminBalance";
import { useAdminStats } from "@/hooks/useAdminStats";
import { Users, Gamepad2, CreditCard, TrendingUp, Coins, BarChart3 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const { balance } = useAdminBalance();
  const { stats, loading: statsLoading } = useAdminStats();
  const navigate = useNavigate();

  if (loading || statsLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Selamat datang di Dashboard Admin
        </h1>
        <p className="text-muted-foreground">
          Kelola platform gaming Anda dengan mudah
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Admin Balance</CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">coins tersedia</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Game Sessions</CardTitle>
            <Gamepad2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.gameSessions.total.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">{stats.gameSessions.growth.startsWith('-') ? '' : '+'}{stats.gameSessions.growth} dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.totalRevenue.amount.toLocaleString()} coins</div>
            <p className="text-xs text-muted-foreground">{stats.totalRevenue.growth.startsWith('-') ? '' : '+'}{stats.totalRevenue.growth} dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Active Players</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">{stats.activePlayers.count}</div>
            <p className="text-xs text-muted-foreground">+{stats.activePlayers.recentIncrease} sejak 1 jam lalu</p>
          </CardContent>
        </Card>
      </div>

      {/* Admin Info */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Informasi Admin</CardTitle>
            <CardDescription>Detail akun administrator</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Username:</span>
              <span className="font-medium text-card-foreground">{profile?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Email:</span>
              <span className="font-medium text-card-foreground">{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Role:</span>
              <span className="inline-flex items-center rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-medium text-primary">
                {profile?.role}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Coin Balance:</span>
              <span className="font-bold text-primary">{profile?.coin_balance?.toLocaleString() || 0} coins</span>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader>
            <CardTitle className="text-card-foreground">Quick Actions</CardTitle>
            <CardDescription>Aksi cepat untuk admin</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-3">
              <Button 
                variant="outline" 
                className="justify-start" 
                onClick={() => navigate('/admin/users')}
              >
                <Users className="mr-2 h-4 w-4" />
                Kelola Pengguna
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/admin/analytics')}
              >
                <BarChart3 className="mr-2 h-4 w-4" />
                Lihat Analytics
              </Button>
              <Button 
                variant="outline" 
                className="justify-start"
                onClick={() => navigate('/admin/topup')}
              >
                <CreditCard className="mr-2 h-4 w-4" />
                Kelola Top-Up
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}