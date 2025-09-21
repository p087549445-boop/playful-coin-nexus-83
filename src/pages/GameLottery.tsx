import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, ArrowLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GameLottery() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gameLoading, setGameLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const playGame = async (betAmount: number) => {
    if (!user || !profile) return;
    
    if (profile.coin_balance < betAmount) {
      toast({
        title: "Insufficient Coins",
        description: "Anda tidak memiliki cukup coins untuk bermain",
        variant: "destructive"
      });
      return;
    }

    setGameLoading(true);
    
    try {
      const winningNumbers = Array.from({length: 3}, () => Math.floor(Math.random() * 9) + 1);
      const playerNumbers = Array.from({length: 3}, () => Math.floor(Math.random() * 9) + 1);
      const matches = winningNumbers.filter((num, idx) => num === playerNumbers[idx]).length;
      const isWin = matches >= 2;
      const coinsWon = isWin ? betAmount * (matches === 3 ? 8 : 3) : 0;
      const result = `Winning: ${winningNumbers.join('')}, Your: ${playerNumbers.join('')} - ${matches} matches - ${isWin ? 'Win' : 'Lose'}`;

      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'lottery',
        p_result: result,
        p_coins_spent: betAmount,
        p_coins_won: coinsWon
      });

      if (error) {
        toast({
          title: "Game Error",
          description: "Terjadi kesalahan saat memproses permainan",
          variant: "destructive"
        });
        return;
      }

      setLastResult(result);
      toast({
        title: isWin ? (matches === 3 ? "JACKPOT! 🎰" : "Menang! ⭐") : "Kalah! 😔",
        description: `${result} - ${isWin ? `Anda memenangkan ${coinsWon} coins!` : `Anda kehilangan ${betAmount} coins`}`,
        variant: isWin ? "default" : "destructive"
      });

      refetch();
    } catch (error) {
      console.error('Game error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat bermain",
        variant: "destructive"
      });
    } finally {
      setGameLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" onClick={() => navigate('/games')}>
          <ArrowLeft className="h-4 w-4 mr-2" />
          Kembali
        </Button>
        <div>
          <h1 className="text-3xl font-bold text-foreground">Lottery</h1>
          <p className="text-muted-foreground">Pilih nomor keberuntungan!</p>
        </div>
      </div>

      {/* Current Balance */}
      <Card className="bg-card">
        <CardContent className="p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Coins className="h-5 w-5 text-primary" />
              <span className="text-lg font-semibold text-card-foreground">
                Saldo Anda: {profile?.coin_balance?.toLocaleString() || 0} coins
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Game Interface */}
      <Card className="bg-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Star className="h-6 w-6" />
            Lottery Game
          </CardTitle>
          <CardDescription>
            Nomor otomatis akan diundi! 2 match = 3x, 3 match = 8x lipat!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Image */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 overflow-hidden rounded-lg">
              <img
                src="https://picsum.photos/400/300?random=6"
                alt="Lottery Game"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Last Result */}
          {lastResult && (
            <Card className="bg-muted/50">
              <CardContent className="p-4">
                <div className="text-center">
                  <p className="text-sm text-muted-foreground">Hasil Terakhir:</p>
                  <p className="text-lg font-bold">{lastResult}</p>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Prize Information */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <Card className="bg-gradient-to-r from-yellow-500/10 to-yellow-600/10 border-yellow-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-yellow-600">3 Match</div>
                <div className="text-sm text-muted-foreground">8x Lipat Taruhan</div>
                <div className="text-lg font-bold">JACKPOT!</div>
              </CardContent>
            </Card>
            <Card className="bg-gradient-to-r from-blue-500/10 to-blue-600/10 border-blue-500/20">
              <CardContent className="p-4 text-center">
                <div className="text-2xl font-bold text-blue-600">2 Match</div>
                <div className="text-sm text-muted-foreground">3x Lipat Taruhan</div>
                <div className="text-lg font-bold">Menang!</div>
              </CardContent>
            </Card>
          </div>

          {/* Betting Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pilih Taruhan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[25, 50, 100].map(amount => (
                <Card key={amount} className="bg-card border-2 hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">🎫</div>
                      <p className="text-2xl font-bold text-primary">{amount}</p>
                      <p className="text-sm text-muted-foreground">coins</p>
                      <div className="text-xs space-y-1">
                        <p className="text-muted-foreground">2 match: {amount * 3} coins</p>
                        <p className="text-muted-foreground">3 match: {amount * 8} coins</p>
                      </div>
                      <Button
                        className="w-full"
                        onClick={() => playGame(amount)}
                        disabled={gameLoading || (profile?.coin_balance || 0) < amount}
                      >
                        {gameLoading ? "Mengundi..." : "Beli Tiket"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* How it Works */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-lg">Cara Bermain</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">• Sistem akan mengundi 3 nomor pemenang (1-9)</p>
              <p className="text-sm text-muted-foreground">• Sistem juga mengundi 3 nomor untuk Anda</p>
              <p className="text-sm text-muted-foreground">• 2 nomor cocok di posisi sama = 3x lipat</p>
              <p className="text-sm text-muted-foreground">• 3 nomor cocok di posisi sama = 8x lipat</p>
              <p className="text-sm text-muted-foreground">• Contoh: 123 vs 143 = 2 match (posisi 1&3)</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}