import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, ArrowLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GameCoinFlip() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gameLoading, setGameLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);

  const playGame = async (choice: string) => {
    if (!user || !profile) return;
    
    const betAmount = 100;
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
      const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
      const isWin = flipResult === choice;
      const coinsWon = isWin ? betAmount * 2 : 0;
      const result = `Choice: ${choice}, Result: ${flipResult} - ${isWin ? 'Win' : 'Lose'}`;

      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'coinflip',
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
        title: isWin ? "Menang! 🎉" : "Kalah! 😔",
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
          <h1 className="text-3xl font-bold text-foreground">Coin Flip</h1>
          <p className="text-muted-foreground">Pilih kepala atau ekor dan menangkan!</p>
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
            <Coins className="h-6 w-6" />
            Coin Flip Game
          </CardTitle>
          <CardDescription>
            Pilih kepala atau ekor, kemenangan memberikan 2x lipat!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Image */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 overflow-hidden rounded-lg">
              <img
                src="https://picsum.photos/400/300?random=2"
                alt="Coin Flip Game"
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

          {/* Betting Options */}
          <div className="space-y-4">
            <h3 className="text-lg font-semibold">Pilih Sisi Koin (100 coins)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Card className="bg-card border-2 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">🟡</div>
                    <p className="text-xl font-bold">Kepala</p>
                    <p className="text-sm text-muted-foreground">Menang: 200 coins</p>
                    <Button
                      className="w-full"
                      onClick={() => playGame('heads')}
                      disabled={gameLoading || (profile?.coin_balance || 0) < 100}
                    >
                      {gameLoading ? "Melempar..." : "Pilih Kepala"}
                    </Button>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-card border-2 hover:border-primary transition-colors cursor-pointer">
                <CardContent className="p-6">
                  <div className="text-center space-y-4">
                    <div className="text-6xl">⚪</div>
                    <p className="text-xl font-bold">Ekor</p>
                    <p className="text-sm text-muted-foreground">Menang: 200 coins</p>
                    <Button
                      className="w-full"
                      onClick={() => playGame('tails')}
                      disabled={gameLoading || (profile?.coin_balance || 0) < 100}
                    >
                      {gameLoading ? "Melempar..." : "Pilih Ekor"}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Game Rules */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-lg">Aturan Permainan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">• Pilih antara kepala atau ekor</p>
              <p className="text-sm text-muted-foreground">• Taruhan tetap 100 coins per permainan</p>
              <p className="text-sm text-muted-foreground">• Tebakan benar memberikan 200 coins (2x lipat)</p>
              <p className="text-sm text-muted-foreground">• Hasil lemparan bersifat acak 50:50</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}