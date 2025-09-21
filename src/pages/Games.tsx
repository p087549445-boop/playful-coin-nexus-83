import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dice1, Dice6, Coins, Trophy } from "lucide-react";

export default function Games() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const [gameLoading, setGameLoading] = useState<string | null>(null);

  const playDiceGame = async (betAmount: number) => {
    if (!user || !profile) return;
    
    if (profile.coin_balance < betAmount) {
      toast({
        title: "Insufficient Coins",
        description: "Anda tidak memiliki cukup coins untuk bermain",
        variant: "destructive"
      });
      return;
    }

    setGameLoading('dice');
    
    try {
      // Generate random result (1-6)
      const diceResult = Math.floor(Math.random() * 6) + 1;
      const isWin = diceResult >= 4; // Win if dice shows 4, 5, or 6
      const coinsWon = isWin ? betAmount * 2 : 0;

      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'dice',
        p_result: `Dice: ${diceResult} - ${isWin ? 'Win' : 'Lose'}`,
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

      toast({
        title: isWin ? "Menang!" : "Kalah!",
        description: `Dadu: ${diceResult} - ${isWin ? `Anda memenangkan ${coinsWon} coins!` : `Anda kehilangan ${betAmount} coins`}`,
        variant: isWin ? "default" : "destructive"
      });

      // Refresh profile to update coin balance
      refetch();
    } catch (error) {
      console.error('Game error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat bermain",
        variant: "destructive"
      });
    } finally {
      setGameLoading(null);
    }
  };

  const playCoinFlip = async (betAmount: number, choice: 'heads' | 'tails') => {
    if (!user || !profile) return;
    
    if (profile.coin_balance < betAmount) {
      toast({
        title: "Insufficient Coins",
        description: "Anda tidak memiliki cukup coins untuk bermain",
        variant: "destructive"
      });
      return;
    }

    setGameLoading('coinflip');
    
    try {
      // Generate random result
      const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
      const isWin = flipResult === choice;
      const coinsWon = isWin ? betAmount * 2 : 0;

      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'coinflip',
        p_result: `Choice: ${choice}, Result: ${flipResult} - ${isWin ? 'Win' : 'Lose'}`,
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

      toast({
        title: isWin ? "Menang!" : "Kalah!",
        description: `Pilihan: ${choice}, Hasil: ${flipResult} - ${isWin ? `Anda memenangkan ${coinsWon} coins!` : `Anda kehilangan ${betAmount} coins`}`,
        variant: isWin ? "default" : "destructive"
      });

      // Refresh profile to update coin balance
      refetch();
    } catch (error) {
      console.error('Game error:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat bermain",
        variant: "destructive"
      });
    } finally {
      setGameLoading(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Games</h1>
        <p className="text-muted-foreground">Bermain dan menangkan coins!</p>
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
            <Badge variant="outline">
              <Trophy className="h-3 w-3 mr-1" />
              Level 1
            </Badge>
          </div>
        </CardContent>
      </Card>

      {/* Games Grid */}
      <div className="grid gap-6 md:grid-cols-2">
        {/* Dice Game */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dice6 className="h-6 w-6 text-primary" />
              <CardTitle className="text-card-foreground">Dice Game</CardTitle>
            </div>
            <CardDescription>
              Lempar dadu dan menang jika keluar 4, 5, atau 6!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                • Menang jika dadu menunjukkan 4, 5, atau 6
              </p>
              <p className="text-sm text-muted-foreground">
                • Hadiah: 2x lipat dari taruhan
              </p>
            </div>
            
            <div className="grid gap-2">
              <h4 className="font-medium text-card-foreground">Pilih Taruhan:</h4>
              <div className="grid grid-cols-3 gap-2">
                {[50, 100, 200].map(amount => (
                  <Button
                    key={amount}
                    variant="outline"
                    onClick={() => playDiceGame(amount)}
                    disabled={gameLoading === 'dice' || (profile?.coin_balance || 0) < amount}
                    className="flex flex-col gap-1"
                  >
                    <Coins className="h-4 w-4" />
                    {amount}
                  </Button>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Coin Flip Game */}
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center gap-2">
              <Dice1 className="h-6 w-6 text-primary" />
              <CardTitle className="text-card-foreground">Coin Flip</CardTitle>
            </div>
            <CardDescription>
              Pilih kepala atau ekor dan menangkan 2x lipat!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid gap-2">
              <p className="text-sm text-muted-foreground">
                • Pilih kepala (heads) atau ekor (tails)
              </p>
              <p className="text-sm text-muted-foreground">
                • Hadiah: 2x lipat dari taruhan
              </p>
            </div>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <h4 className="font-medium text-card-foreground">Taruhan 100 coins:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => playCoinFlip(100, 'heads')}
                    disabled={gameLoading === 'coinflip' || (profile?.coin_balance || 0) < 100}
                  >
                    Kepala
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => playCoinFlip(100, 'tails')}
                    disabled={gameLoading === 'coinflip' || (profile?.coin_balance || 0) < 100}
                  >
                    Ekor
                  </Button>
                </div>
              </div>
              
              <div className="grid gap-2">
                <h4 className="font-medium text-card-foreground">Taruhan 200 coins:</h4>
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={() => playCoinFlip(200, 'heads')}
                    disabled={gameLoading === 'coinflip' || (profile?.coin_balance || 0) < 200}
                  >
                    Kepala
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => playCoinFlip(200, 'tails')}
                    disabled={gameLoading === 'coinflip' || (profile?.coin_balance || 0) < 200}
                  >
                    Ekor
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}