import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Coins, ArrowLeft, Target } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function GameRoulette() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [gameLoading, setGameLoading] = useState(false);
  const [lastResult, setLastResult] = useState<string | null>(null);
  const [selectedNumber, setSelectedNumber] = useState<string>('');

  const playGame = async () => {
    if (!user || !profile) return;
    
    const betAmount = 150;
    const chosenNumber = parseInt(selectedNumber);
    
    if (isNaN(chosenNumber) || chosenNumber < 0 || chosenNumber > 36) {
      toast({
        title: "Invalid Number",
        description: "Pilih nomor antara 0-36",
        variant: "destructive"
      });
      return;
    }

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
      const rouletteNumber = Math.floor(Math.random() * 37); // 0-36
      const isWin = rouletteNumber === chosenNumber;
      const coinsWon = isWin ? betAmount * 10 : 0;
      const result = `Number: ${rouletteNumber}, Your choice: ${chosenNumber} - ${isWin ? 'Win' : 'Lose'}`;

      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: 'roulette',
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
        title: isWin ? "Menang! 🎯" : "Kalah! 😔",
        description: `${result} - ${isWin ? `Anda memenangkan ${coinsWon} coins!` : `Anda kehilangan ${betAmount} coins`}`,
        variant: isWin ? "default" : "destructive"
      });

      refetch();
      setSelectedNumber('');
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
          <h1 className="text-3xl font-bold text-foreground">Roulette</h1>
          <p className="text-muted-foreground">Tebak angka beruntung Anda!</p>
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
            <Target className="h-6 w-6" />
            Roulette Game
          </CardTitle>
          <CardDescription>
            Pilih nomor 0-36 dan menangkan 10x lipat! (150 coins per bet)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Game Image */}
          <div className="flex justify-center">
            <div className="relative w-48 h-48 overflow-hidden rounded-lg">
              <img
                src="https://picsum.photos/400/300?random=4"
                alt="Roulette Game"
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

          {/* Number Selection */}
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="number-input">Pilih Nomor (0-36)</Label>
              <div className="flex gap-2">
                <Input
                  id="number-input"
                  type="number"
                  min="0"
                  max="36"
                  placeholder="Masukkan nomor"
                  value={selectedNumber}
                  onChange={(e) => setSelectedNumber(e.target.value)}
                  className="flex-1"
                />
                <Button
                  onClick={playGame}
                  disabled={gameLoading || (profile?.coin_balance || 0) < 150 || !selectedNumber}
                  className="min-w-[120px]"
                >
                  {gameLoading ? "Memutar..." : "Bet 150 Coins"}
                </Button>
              </div>
            </div>

            {/* Quick Number Selection */}
            <div className="space-y-2">
              <Label>Pilih Cepat:</Label>
              <div className="grid grid-cols-10 gap-2">
                {Array.from({length: 37}, (_, i) => i).map(num => (
                  <Button
                    key={num}
                    variant={selectedNumber === num.toString() ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedNumber(num.toString())}
                    className={`aspect-square p-0 ${
                      num === 0 ? 'bg-green-600 hover:bg-green-700 text-white' :
                      num <= 18 ? 'bg-red-600 hover:bg-red-700 text-white' :
                      'bg-black hover:bg-gray-800 text-white'
                    }`}
                  >
                    {num}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          {/* Game Info */}
          <Card className="bg-primary/5 border-primary/20">
            <CardContent className="p-4">
              <div className="text-center space-y-2">
                <p className="text-lg font-bold text-primary">Potential Win: 1,500 Coins</p>
                <p className="text-sm text-muted-foreground">Tebakan benar = 10x lipat taruhan</p>
              </div>
            </CardContent>
          </Card>

          {/* Game Rules */}
          <Card className="bg-muted/20">
            <CardHeader>
              <CardTitle className="text-lg">Aturan Permainan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              <p className="text-sm text-muted-foreground">• Pilih satu nomor antara 0-36</p>
              <p className="text-sm text-muted-foreground">• Taruhan tetap 150 coins per permainan</p>
              <p className="text-sm text-muted-foreground">• Tebakan benar memberikan 1,500 coins (10x lipat)</p>
              <p className="text-sm text-muted-foreground">• Peluang menang: 1 dari 37 (2.7%)</p>
              <p className="text-sm text-muted-foreground">• 0 = Hijau, 1-18 = Merah, 19-36 = Hitam</p>
            </CardContent>
          </Card>
        </CardContent>
      </Card>
    </div>
  );
}