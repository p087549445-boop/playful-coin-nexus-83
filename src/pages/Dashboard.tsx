import { useProfile } from '@/hooks/useProfile';
import { useAuth } from '@/hooks/useAuth';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { 
  Coins, 
  Clock, 
  MapPin, 
  Smartphone, 
  Home, 
  Dices, 
  Gamepad2, 
  Trophy,
  Zap,
  Target,
  Calendar,
  TrendingUp,
  Users,
  Book,
  CreditCard,
  ArrowUpCircle,
  MessageCircle,
  Phone
} from 'lucide-react';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

const Dashboard = () => {
  const { user } = useAuth();
  const { profile, loading } = useProfile();
  const navigate = useNavigate();
  const [userInfo, setUserInfo] = useState({
    ip: '',
    loginTime: '',
    device: '',
    location: 'Indonesia'
  });

  const gameCategories = [
    { name: 'Home', icon: Home, path: '/' },
    { name: 'Togel', icon: Target, path: '/games' },
    { name: 'Slot', icon: Zap, path: '/game/slots' },
    { name: 'Casino', icon: Dices, path: '/game/dice' },
    { name: 'Sport', icon: Trophy, path: '/games' },
    { name: 'Arcade', icon: Gamepad2, path: '/games' },
  ];

  const lotteryGames = [
    { name: 'OTTAWA LOTTERY', time: '00:30', close: '01:00', status: 'active' },
    { name: 'MEXICO LOTTERY', time: '07:30', close: '08:00', status: 'active' },
    { name: 'MLDEWA LOTTERY', time: '09:00', close: '09:30', status: 'active' },
    { name: 'TOTO WUHAN', time: 'Tiap 3 jam', close: 'Tiap 3 jam', status: 'active' },
    { name: 'HK SIANG', time: '10:30', close: '11:00', status: 'active' },
    { name: 'MALAYSIA', time: '18:30', close: '19:00', status: 'active' },
    { name: 'SYDNEY', time: '13:00', close: '14:00', status: 'active' },
  ];

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
    <div className="min-h-screen bg-gaming-dark text-white">
      {/* Header Navigation */}
      <div className="bg-gaming-card border-b border-gaming-border">
        <div className="px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="text-lg font-bold text-gaming-gold">
              QUIZ4D
            </div>
            <div className="text-sm text-gray-400">
              {profile?.username} | {user?.email}
            </div>
          </div>
        </div>
        
        {/* Tab Navigation */}
        <div className="flex bg-gaming-dark px-4">
          <div className="bg-gaming-gold text-black px-4 py-2 text-sm font-medium">
            USER AREA
          </div>
          <div className="px-4 py-2 text-sm text-gray-400 hover:text-white cursor-pointer">
            Deposit
          </div>
          <div className="px-4 py-2 text-sm text-gray-400 hover:text-white cursor-pointer">
            Withdraw
          </div>
          <div className="px-4 py-2 text-sm text-gray-400 hover:text-white cursor-pointer">
            History
          </div>
          <div className="px-4 py-2 text-sm text-gray-400 hover:text-white cursor-pointer">
            Memo
          </div>
        </div>
      </div>

      <div className="p-4 space-y-4">
        {/* User Data and Last Bet/Win Report */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* User Data */}
          <Card className="bg-gaming-card border-gaming-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-300 text-sm">User Data</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Balance:</span>
                <span className="text-gaming-gold font-bold">Rp {profile?.coin_balance.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Last Login:</span>
                <span className="text-xs text-gray-300">{userInfo.loginTime.split(',')[0]}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-400">Last IP:</span>
                <span className="text-xs text-gray-300">{userInfo.ip}</span>
              </div>
            </CardContent>
          </Card>

          {/* Last Bet/Win Report */}
          <Card className="bg-gaming-card border-gaming-border">
            <CardHeader className="pb-3">
              <CardTitle className="text-gray-300 text-sm">Last Bet/Win Report</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-xs text-gray-400">
                16 Aug 20:33 [HK-701] Bet: 4D/3D/2D ( Bolak Balik 3093 )
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Game Categories */}
        <div className="grid grid-cols-6 gap-4">
          {gameCategories.map((category) => (
            <button
              key={category.name}
              onClick={() => navigate(category.path)}
              className="flex flex-col items-center p-4 bg-gaming-card border border-gaming-border rounded-lg hover:bg-gaming-border transition-colors"
            >
              <category.icon className="h-6 w-6 text-gaming-gold mb-2" />
              <span className="text-xs text-gray-300">{category.name}</span>
            </button>
          ))}
        </div>

        {/* Action Buttons */}
        <div className="grid grid-cols-3 gap-4">
          <Button className="bg-gaming-card border border-gaming-border text-gray-300 hover:bg-gaming-border">
            <Calendar className="h-4 w-4 mr-2" />
            Pasaran
          </Button>
          <Button className="bg-gaming-card border border-gaming-border text-gray-300 hover:bg-gaming-border">
            <TrendingUp className="h-4 w-4 mr-2" />
            Keluaran
          </Button>
          <Button className="bg-gaming-card border border-gaming-border text-gray-300 hover:bg-gaming-border">
            <Book className="h-4 w-4 mr-2" />
            Buku Mimpi
          </Button>
        </div>

        {/* Lottery Games */}
        <div className="space-y-2">
          {lotteryGames.map((game, index) => (
            <div
              key={index}
              className="bg-gradient-to-r from-gaming-gold to-gaming-gold-dark text-black px-4 py-3 rounded-lg flex justify-between items-center"
            >
              <div className="flex items-center">
                <Target className="h-4 w-4 mr-2" />
                <span className="font-medium">{game.name}</span>
              </div>
              <div className="text-sm">
                Tutup: {game.time} WIB - Diundi: {game.close} WIB
              </div>
            </div>
          ))}
        </div>

        {/* Provider Status */}
        <Card className="bg-gaming-card border-gaming-border">
          <CardContent className="p-4">
            <div className="text-xs text-gray-400 mb-2">
              Slot Gacor Togel bola dan Casino Terbesar | Harap Perhatikan Rekening Tujuan Deposit
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              <div>BCA: <span className="text-green-400">ONLINE</span></div>
              <div>Mandiri: <span className="text-green-400">ONLINE</span></div>
              <div>BNI: <span className="text-green-400">ONLINE</span></div>
              <div>BRI: <span className="text-green-400">ONLINE</span></div>
              <div>CIMB: <span className="text-green-400">ONLINE</span></div>
              <div>Danamon: <span className="text-red-400">OFFLINE</span></div>
              <div>JAGO: <span className="text-green-400">ONLINE</span></div>
              <div>DANA: <span className="text-green-400">ONLINE</span></div>
              <div>OVO: <span className="text-green-400">ONLINE</span></div>
              <div>GOPAY: <span className="text-green-400">ONLINE</span></div>
              <div>LinkAja: <span className="text-green-400">ONLINE</span></div>
            </div>
          </CardContent>
        </Card>

        {/* Bottom Actions */}
        <div className="grid grid-cols-4 gap-2 mt-6">
          <Button 
            onClick={() => navigate('/topup')}
            className="bg-gaming-gold hover:bg-gaming-gold-dark text-black font-medium py-3 flex flex-col items-center"
          >
            <CreditCard className="h-5 w-5 mb-1" />
            DEPOSIT
          </Button>
          <Button className="bg-gaming-card border border-gaming-border text-gray-300 hover:bg-gaming-border py-3 flex flex-col items-center">
            <ArrowUpCircle className="h-5 w-5 mb-1" />
            WITHDRAW
          </Button>
          <Button className="bg-gaming-card border border-gaming-border text-gray-300 hover:bg-gaming-border py-3 flex flex-col items-center">
            <MessageCircle className="h-5 w-5 mb-1" />
            CHAT
          </Button>
          <Button className="bg-gaming-card border border-gaming-border text-gray-300 hover:bg-gaming-border py-3 flex flex-col items-center">
            <Phone className="h-5 w-5 mb-1" />
            LIVECHAT
          </Button>
        </div>

        {/* Footer */}
        <div className="text-center text-xs text-gray-500 mt-6 pb-4">
          © 2018 - 2025 Copyright QUIZ4D. All Rights Reserved.
        </div>
      </div>
    </div>
  );
};

export default Dashboard;