import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from '@/hooks/useAuth';
import { useProfile } from '@/hooks/useProfile';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { Dice1, Dice2, Dice3, Dice4, Dice5, Dice6, Coins, Trophy } from 'lucide-react';

const Games = () => {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  
  // Dice Game State
  const [diceRoll, setDiceRoll] = useState<number | null>(null);
  const [diceBet, setDiceBet] = useState<number>(10);
  const [diceGuess, setDiceGuess] = useState<number>(1);
  
  // Coin Flip State
  const [coinResult, setCoinResult] = useState<string | null>(null);
  const [coinBet, setCoinBet] = useState<number>(10);
  const [coinGuess, setCoinGuess] = useState<string>('heads');

  const getDiceIcon = (number: number) => {
    const icons = [Dice1, Dice2, Dice3, Dice4, Dice5, Dice6];
    const Icon = icons[number - 1];
    return <Icon className="w-16 h-16" />;
  };

  const playDiceGame = async () => {
    if (!user || !profile) return;
    
    if (profile.coin_balance < diceBet) {
      toast({
        title: "Insufficient Coins",
        description: "Anda tidak memiliki cukup coin untuk bermain",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const roll = Math.floor(Math.random() * 6) + 1;
      setDiceRoll(roll);
      
      const isWin = roll === diceGuess;
      const coinsWon = isWin ? diceBet * 2 : 0;
      
      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'Dice Roll',
        p_result: isWin ? 'win' : 'lose',
        p_coins_spent: diceBet,
        p_coins_won: coinsWon
      });

      if (error) {
        throw error;
      }

      toast({
        title: isWin ? "Congratulations!" : "Better luck next time!",
        description: isWin 
          ? `Anda menang ${coinsWon} coins! Tebakan Anda benar: ${roll}`
          : `Anda kalah ${diceBet} coins. Hasilnya: ${roll}, tebakan Anda: ${diceGuess}`,
        variant: isWin ? "default" : "destructive"
      });

      refetch();
    } catch (error) {
      console.error('Error playing dice game:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat bermain game",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const playCoinFlip = async () => {
    if (!user || !profile) return;
    
    if (profile.coin_balance < coinBet) {
      toast({
        title: "Insufficient Coins",
        description: "Anda tidak memiliki cukup coin untuk bermain",
        variant: "destructive"
      });
      return;
    }

    setLoading(true);
    try {
      const result = Math.random() < 0.5 ? 'heads' : 'tails';
      setCoinResult(result);
      
      const isWin = result === coinGuess;
      const coinsWon = isWin ? coinBet * 2 : 0;
      
      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'Coin Flip',
        p_result: isWin ? 'win' : 'lose',
        p_coins_spent: coinBet,
        p_coins_won: coinsWon
      });

      if (error) {
        throw error;
      }

      toast({
        title: isWin ? "Congratulations!" : "Better luck next time!",
        description: isWin 
          ? `Anda menang ${coinsWon} coins! Tebakan Anda benar: ${result}`
          : `Anda kalah ${coinBet} coins. Hasilnya: ${result}, tebakan Anda: ${coinGuess}`,
        variant: isWin ? "default" : "destructive"
      });

      refetch();
    } catch (error) {
      console.error('Error playing coin flip:', error);
      toast({
        title: "Error",
        description: "Terjadi kesalahan saat bermain game",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  if (!profile) {
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
        <h1 className="text-3xl font-bold text-foreground">Game Center</h1>
        <p className="text-muted-foreground">
          Mainkan game dan menangkan coins!
        </p>
        <div className="flex items-center space-x-2 text-lg font-semibold">
          <Coins className="h-5 w-5 text-primary" />
          <span>Balance: {profile.coin_balance.toLocaleString()} coins</span>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Dice Game */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Trophy className="h-5 w-5" />
              <span>Dice Roll Game</span>
            </CardTitle>
            <CardDescription>
              Tebak angka yang akan keluar pada dadu (1-6). Menang 2x lipat!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              {diceRoll ? (
                <div className="text-center">
                  {getDiceIcon(diceRoll)}
                  <p className="mt-2 text-lg font-bold">Hasil: {diceRoll}</p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <Dice1 className="w-16 h-16 mx-auto opacity-50" />
                  <p className="mt-2">Belum bermain</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="dice-bet">Jumlah Bet</Label>
                <Input
                  id="dice-bet"
                  type="number"
                  min="1"
                  max={profile.coin_balance}
                  value={diceBet}
                  onChange={(e) => setDiceBet(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="dice-guess">Tebakan (1-6)</Label>
                <Input
                  id="dice-guess"
                  type="number"
                  min="1"
                  max="6"
                  value={diceGuess}
                  onChange={(e) => setDiceGuess(Number(e.target.value))}
                />
              </div>
            </div>
            
            <Button 
              onClick={playDiceGame} 
              disabled={loading || profile.coin_balance < diceBet}
              className="w-full"
            >
              {loading ? "Rolling..." : `Play (${diceBet} coins)`}
            </Button>
          </CardContent>
        </Card>

        {/* Coin Flip Game */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Coins className="h-5 w-5" />
              <span>Coin Flip Game</span>
            </CardTitle>
            <CardDescription>
              Tebak sisi koin (heads/tails). Menang 2x lipat!
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-center py-8">
              {coinResult ? (
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto bg-primary rounded-full flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {coinResult === 'heads' ? 'H' : 'T'}
                  </div>
                  <p className="mt-2 text-lg font-bold capitalize">
                    Hasil: {coinResult === 'heads' ? 'Heads' : 'Tails'}
                  </p>
                </div>
              ) : (
                <div className="text-center text-muted-foreground">
                  <div className="w-16 h-16 mx-auto bg-muted rounded-full flex items-center justify-center">
                    <Coins className="w-8 h-8" />
                  </div>
                  <p className="mt-2">Belum bermain</p>
                </div>
              )}
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="coin-bet">Jumlah Bet</Label>
                <Input
                  id="coin-bet"
                  type="number"
                  min="1"
                  max={profile.coin_balance}
                  value={coinBet}
                  onChange={(e) => setCoinBet(Number(e.target.value))}
                />
              </div>
              <div>
                <Label htmlFor="coin-guess">Tebakan</Label>
                <select
                  id="coin-guess"
                  value={coinGuess}
                  onChange={(e) => setCoinGuess(e.target.value)}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                >
                  <option value="heads">Heads</option>
                  <option value="tails">Tails</option>
                </select>
              </div>
            </div>
            
            <Button 
              onClick={playCoinFlip} 
              disabled={loading || profile.coin_balance < coinBet}
              className="w-full"
            >
              {loading ? "Flipping..." : `Play (${coinBet} coins)`}
            </Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Games;