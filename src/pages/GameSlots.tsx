import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, ArrowLeft, Zap } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GameSlots() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gameLoading, setGameLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [currentSlots, setCurrentSlots] = useState(['🍒', '🍋', '🔔']);

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
      const symbols = ['🍒', '🍋', '🔔', '⭐', '💎'];
      const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
      const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
      const isWin = slot1 === slot2 && slot2 === slot3;
      const coinsWon = isWin ? betAmount * 5 : 0;
      const result = `${slot1}${slot2}${slot3} - ${isWin ? 'JACKPOT!' : 'Lose'}`;

      setCurrentSlots([slot1, slot2, slot3]);

      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'slots',
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
        title: isWin ? "JACKPOT! 🎰" : "Kalah! 😔",
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
          <h1 className="text-3xl font-bold text-foreground">Slot Machine</h1>
          <p className="text-muted-foreground">Putar dan menangkan jackpot!</p>
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
            <Zap className="h-6 w-6" />
            Slot Machine Game
          </CardTitle>
          <CardDescription>
            Dapatkan 3 simbol yang sama untuk memenangkan jackpot 5x lipat!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Image */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 overflow-hidden rounded-lg">
              <img
                src="https://picsum.photos/400/300?random=3"
                alt="Slot Machine Game"
                className="w-full h-full object-cover"
              />
            </div>
          </div>

          {/* Slot Display */}
          <Card className="bg-gradient-to-r from-primary/10 to-secondary/10 border-2">
            <CardContent className="p-6">
              <div className="flex justify-center items-center space-x-4">
                {currentSlots.map((symbol, index) => (
                  <div key={index} className="bg-background border-2 border-border rounded-lg p-4 w-20 h-20 flex items-center justify-center">
                    <span className="text-4xl">{symbol}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

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
              {[75, 150, 300].map(amount => (
                <Card key={amount} className="bg-card border-2 hover:border-primary transition-colors cursor-pointer">
                  <CardContent className="p-4">
                    <div className="text-center space-y-2">
                      <p className="text-2xl font-bold text-primary">{amount}</p>
                      <p className="text-sm text-muted-foreground">coins</p>
                      <p className="text-xs text-muted-foreground">Jackpot: {amount * 5} coins</p>
                      <Button
                        className="w-full"
                        onClick={() => playGame(amount)}
                        disabled={gameLoading || (profile?.coin_balance || 0) < amount}
                      >
                        {gameLoading ? "Memutar..." : "Putar Slot"}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </div>

          {/* Symbols Guide */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-lg">Simbol & Aturan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🍒</span>
                <span className="text-2xl">🍋</span>
                <span className="text-2xl">🔔</span>
                <span className="text-2xl">⭐</span>
                <span className="text-2xl">💎</span>
                <span className="text-sm text-muted-foreground ml-2">Simbol yang tersedia</span>
              </div>
              <p className="text-sm text-muted-foreground">• Dapatkan 3 simbol yang sama untuk menang</p>
              <p className="text-sm text-muted-foreground">• Jackpot memberikan 5x lipat dari taruhan</p>
              <p className="text-sm text-muted-foreground">• Semua simbol memiliki peluang yang sama</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}