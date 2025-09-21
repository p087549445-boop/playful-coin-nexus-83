import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { useAdminBalance } from "@/hooks/useAdminBalance";
import { Users, Gamepad2, CreditCard, TrendingUp, Coins } from "lucide-react";

export default function AdminDashboard() {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const { balance } = useAdminBalance();

  if (loading) {
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
            <div className="text-2xl font-bold text-card-foreground">12,345</div>
            <p className="text-xs text-muted-foreground">+180.1% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Total Revenue</CardTitle>
            <CreditCard className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">Rp 45,231,890</div>
            <p className="text-xs text-muted-foreground">+19% dari bulan lalu</p>
          </CardContent>
        </Card>

        <Card className="bg-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-card-foreground">Active Players</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-card-foreground">573</div>
            <p className="text-xs text-muted-foreground">+201 sejak 1 jam lalu</p>
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
            <div className="grid gap-2">
              <div className="text-sm text-muted-foreground">• Kelola pengguna dan role</div>
              <div className="text-sm text-muted-foreground">• Pantau aktivitas gaming</div>
              <div className="text-sm text-muted-foreground">• Proses permintaan top-up</div>
              <div className="text-sm text-muted-foreground">• Lihat laporan keuangan</div>
              <div className="text-sm text-muted-foreground">• Atur konfigurasi sistem</div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}