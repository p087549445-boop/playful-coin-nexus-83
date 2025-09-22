import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Coins, Clock, MapPin, Smartphone } from 'lucide-react';
import { useEffect, useState } from 'react';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const [userInfo, setUserInfo] = useState({
    ip: '',
    loginTime: '',
    device: '',
    location: 'Indonesia'
  });

  useEffect(() => {
    // Get user IP and device info
    const getUserInfo = async () => {
      try {
        // Get IP address
        const ipResponse = await fetch('https://api.ipify.org?format=json');
        const ipData = await ipResponse.json();
        
        // Get device info
        const userAgent = navigator.userAgent;
        let device = 'Unknown Device';
        
        if (/Mobile|Android|iPhone|iPad/.test(userAgent)) {
          if (/iPhone/.test(userAgent)) device = 'iPhone';
          else if (/iPad/.test(userAgent)) device = 'iPad';
          else if (/Android/.test(userAgent)) device = 'Android Phone';
          else device = 'Mobile Device';
        } else {
          device = 'Desktop';
        }

        // Get current time in Indonesia timezone
        const now = new Date();
        const indonesiaTime = new Intl.DateTimeFormat('id-ID', {
          timeZone: 'Asia/Jakarta',
          dateStyle: 'full',
          timeStyle: 'medium'
        }).format(now);

        setUserInfo({
          ip: ipData.ip,
          loginTime: indonesiaTime,
          device,
          location: 'Indonesia'
        });
      } catch (error) {
        console.error('Error getting user info:', error);
      }
    };

    getUserInfo();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">
          Selamat datang di Dashboard User
        </h1>
        <p className="text-muted-foreground">
          Nikmati pengalaman gaming terbaik Anda
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Coin Balance
            </CardTitle>
            <Coins className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{profile?.coin_balance.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">
              Available coins
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Status Login
            </CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">Online</div>
            <p className="text-xs text-muted-foreground">
              {userInfo.loginTime}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              IP Address
            </CardTitle>
            <MapPin className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userInfo.ip}</div>
            <p className="text-xs text-muted-foreground">
              {userInfo.location}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">
              Device
            </CardTitle>
            <Smartphone className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{userInfo.device}</div>
            <p className="text-xs text-muted-foreground">
              Current device
            </p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Informasi Akun</CardTitle>
            <CardDescription>Detail informasi akun Anda</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="flex justify-between">
              <span className="font-medium">Username:</span>
              <span>{profile?.username}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Nama Lengkap:</span>
              <span>{profile?.full_name}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Email:</span>
              <span>{user?.email}</span>
            </div>
            <div className="flex justify-between">
              <span className="font-medium">Role:</span>
              <Badge variant={profile?.role === 'admin' ? 'default' : 'secondary'}>
                {profile?.role}
              </Badge>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aktivitas Terbaru</CardTitle>
            <CardDescription>Aktivitas gaming Anda</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">
              Belum ada aktivitas game yang tercatat.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;