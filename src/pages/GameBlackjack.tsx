import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, ArrowLeft, Spade } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GameBlackjack() {
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
      const playerCard1 = Math.floor(Math.random() * 10) + 1;
      const playerCard2 = Math.floor(Math.random() * 10) + 1;
      const dealerCard = Math.floor(Math.random() * 10) + 1;
      const playerTotal = playerCard1 + playerCard2;
      const isWin = playerTotal === 21 || (playerTotal > dealerCard && playerTotal <= 21);
      const coinsWon = isWin ? betAmount * 3 : 0;
      const result = `Your cards: ${playerCard1}+${playerCard2}=${playerTotal}, Dealer: ${dealerCard} - ${isWin ? 'Win' : 'Lose'}`;

      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'blackjack',
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
        title: isWin ? "Menang! 🃏" : "Kalah! 😔",
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
          <h1 className="text-3xl font-bold text-foreground">Blackjack</h1>
          <p className="text-muted-foreground">Dapatkan 21 untuk menang!</p>
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
            <Spade className="h-6 w-6" />
            Blackjack Game
          </CardTitle>
          <CardDescription>
            Dapatkan kartu total 21 atau kalahkan dealer untuk menang 3x lipat!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Image */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 overflow-hidden rounded-lg">
              <img
                src="https://picsum.photos/400/300?random=5"
                alt="Blackjack Game"
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
            <h3 className="text-lg font-semibold">Pilih Taruhan</h3>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {[200, 400, 800].map(amount => (
                <Card key={amount} className="bg-card border-2 hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <div className="text-4xl">🃏</div>
                      <p className="text-2xl font-bold text-primary">{amount}</p>
                      <p className="text-sm text-muted-foreground">coins</p>
                      <p className="text-xs text-muted-foreground">Menang: {amount * 3} coins</p>
                      <Button
                        className="w-full"
                        onClick={() => playGame(amount)}
                        disabled={gameLoading || (profile?.coin_balance || 0) < amount}
                      >
                        {gameLoading ? "Bermain..." : "Mainkan"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Game Rules */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-lg">Aturan Permainan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">• Anda mendapat 2 kartu, dealer mendapat 1 kartu</p>
              <p className="text-sm text-muted-foreground">• Nilai kartu: 1-10 (sesuai angka)</p>
              <p className="text-sm text-muted-foreground">• Menang jika total kartu = 21</p>
              <p className="text-sm text-muted-foreground">• Menang jika total &gt; dealer dan ≤ 21</p>
              <p className="text-sm text-muted-foreground">• Kemenangan memberikan 3x lipat taruhan</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}