import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { User, Coins, History, Trophy } from 'lucide-react';

interface Transaction {
  id: string;
  transaction_type: string;
  amount: number;
  description: string;
  created_at: string;
}

interface GameSession {
  id: string;
  game_type: string;
  result: string;
  coins_spent: number;
  coins_won: number;
  created_at: string;
}

const Profile = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [gameSessions, setGameSessions] = useState<GameSession[]>([]);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    username: '',
    full_name: ''
  });

  useEffect(() => {
    if (profile) {
      setFormData({
        username: profile.username,
        full_name: profile.full_name
      });
    }
  }, [profile]);

  useEffect(() => {
    if (user) {
      fetchTransactions();
      fetchGameSessions();
    }
  }, [user]);

  const fetchTransactions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      setTransactions(data || []);
    } catch (error) {
      console.error('Error fetching transactions:', error);
    }
  };

  const fetchGameSessions = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('game_sessions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      setGameSessions(data || []);
    } catch (error) {
      console.error('Error fetching game sessions:', error);
    }
  };

  const updateProfile = async () => {
    if (!user || !profile) return;

    setLoading(true);
    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          username: formData.username,
          full_name: formData.full_name,
        })
        .eq('user_id', user.id);

      if (error) {
        throw error;
      }

      toast({
        title: "Success",
        description: "Profil berhasil diperbarui",
      });

      setIsEditing(false);
      refetch();
    } catch (error) {
      console.error('Error updating profile:', error);
      toast({
        title: "Error",
        description: "Gagal memperbarui profil",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'topup':
        return '💰';
      case 'game_win':
        return '🏆';
      case 'game_loss':
        return '🎲';
      default:
        return '💸';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'topup':
      case 'game_win':
        return 'text-green-600';
      case 'game_loss':
        return 'text-red-600';
      default:
        return 'text-muted-foreground';
    }
  };

  if (!profile) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Calculate stats
  const totalGamesPlayed = gameSessions.length;
  const totalWins = gameSessions.filter(session => session.result === 'win').length;
  const totalCoinsWon = gameSessions.reduce((sum, session) => sum + session.coins_won, 0);
  const totalCoinsSpent = gameSessions.reduce((sum, session) => sum + session.coins_spent, 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Profile</h1>
        <p className="text-muted-foreground">
          Kelola informasi dan lihat statistik gaming Anda
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Profile Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <User className="h-5 w-5" />
              <span>Informasi Profil</span>
            </CardTitle>
            <CardDescription>
              Data pribadi dan informasi akun
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {isEditing ? (
              <>
                <div>
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={formData.username}
                    onChange={(e) => setFormData(prev => ({ ...prev, username: e.target.value }))}
                  />
                </div>
                <div>
                  <Label htmlFor="full-name">Nama Lengkap</Label>
                  <Input
                    id="full-name"
                    value={formData.full_name}
                    onChange={(e) => setFormData(prev => ({ ...prev, full_name: e.target.value }))}
                  />
                </div>
                <div className="flex space-x-2">
                  <Button onClick={updateProfile} disabled={loading}>
                    {loading ? "Saving..." : "Save"}
                  </Button>
                  <Button variant="outline" onClick={() => setIsEditing(false)}>
                    Cancel
                  </Button>
                </div>
              </>
            ) : (
              <>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="font-medium">Username:</span>
                    <span>{profile.username}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Nama Lengkap:</span>
                    <span>{profile.full_name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Email:</span>
                    <span>{user?.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Role:</span>
                    <Badge variant={profile.role === 'admin' ? 'default' : 'secondary'}>
                      {profile.role}
                    </Badge>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-medium">Coin Balance:</span>
                    <span className="font-bold text-primary">
                      {profile.coin_balance.toLocaleString()} coins
                    </span>
                  </div>
                </div>
                <Button onClick={() => setIsEditing(true)} className="w-full">
                  Edit Profile
                </Button>
              </>
            )}
          </CardContent>
        </Card>

        {/* Gaming Statistics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Statistik Gaming</span>
            </CardTitle>
            <CardDescription>
              Performa dan aktivitas gaming Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{totalGamesPlayed}</div>
                <div className="text-sm text-muted-foreground">Games Played</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold">{totalWins}</div>
                <div className="text-sm text-muted-foreground">Games Won</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  +{totalCoinsWon.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Coins Won</div>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  -{totalCoinsSpent.toLocaleString()}
                </div>
                <div className="text-sm text-muted-foreground">Coins Spent</div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Recent Transactions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <History className="h-5 w-5" />
              <span>Transaksi Terbaru</span>
            </CardTitle>
            <CardDescription>
              10 transaksi terakhir Anda
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {transactions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Belum ada transaksi
                </p>
              ) : (
                transactions.map((transaction) => (
                  <div key={transaction.id} className="flex items-center justify-between py-2 border-b">
                    <div className="flex items-center space-x-3">
                      <span className="text-lg">
                        {getTransactionIcon(transaction.transaction_type)}
                      </span>
                      <div>
                        <p className="text-sm font-medium">
                          {transaction.description}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(transaction.created_at).toLocaleString('id-ID')}
                        </p>
                      </div>
                    </div>
                    <span className={`font-semibold ${getTransactionColor(transaction.transaction_type)}`}>
                      {transaction.amount > 0 ? '+' : ''}{transaction.amount.toLocaleString()}
                    </span>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* Recent Game Sessions */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Game Terbaru</span>
            </CardTitle>
            <CardDescription>
              10 game session terakhir
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-64 overflow-y-auto">
              {gameSessions.length === 0 ? (
                <p className="text-center text-muted-foreground py-4">
                  Belum ada game session
                </p>
              ) : (
                gameSessions.map((session) => (
                  <div key={session.id} className="flex items-center justify-between py-2 border-b">
                    <div>
                      <p className="text-sm font-medium">{session.game_type}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(session.created_at).toLocaleString('id-ID')}
                      </p>
                    </div>
                    <div className="text-right">
                      <Badge variant={session.result === 'win' ? 'default' : 'destructive'}>
                        {session.result === 'win' ? 'Win' : 'Lose'}
                      </Badge>
                      <p className="text-xs mt-1">
                        {session.result === 'win' ? '+' : '-'}{session.coins_spent} coins
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Profile;