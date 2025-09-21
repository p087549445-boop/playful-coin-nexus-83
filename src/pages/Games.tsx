import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/hooks/useAuth";
import { useProfile } from "@/hooks/useProfile";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Dice1, Dice6, Coins, Trophy, Play } from "lucide-react";

export default function Games() {
  const { user } = useAuth();
  const { profile, refetch } = useProfile();
  const { toast } = useToast();
  const [gameLoading, setGameLoading] = useState<string | null>(null);
  const [selectedGame, setSelectedGame] = useState<string | null>(null);

  // Game definitions with placeholder images
  const games = [
    {
      id: 'dice',
      title: 'Dice Game',
      description: 'Lempar dadu dan menang!',
      image: 'https://picsum.photos/400/300?random=1',
      minBet: 50
    },
    {
      id: 'coinflip',
      title: 'Coin Flip',
      description: 'Pilih kepala atau ekor!',
      image: 'https://picsum.photos/400/300?random=2',
      minBet: 100
    },
    {
      id: 'slots',
      title: 'Slot Machine',
      description: 'Putar dan menangkan jackpot!',
      image: 'https://picsum.photos/400/300?random=3',
      minBet: 75
    },
    {
      id: 'roulette',
      title: 'Roulette',
      description: 'Tebak angka beruntung Anda!',
      image: 'https://picsum.photos/400/300?random=4',
      minBet: 150
    },
    {
      id: 'blackjack',
      title: 'Blackjack',
      description: 'Dapatkan 21 untuk menang!',
      image: 'https://picsum.photos/400/300?random=5',
      minBet: 200
    },
    {
      id: 'lottery',
      title: 'Lottery',
      description: 'Pilih nomor keberuntungan!',
      image: 'https://picsum.photos/400/300?random=6',
      minBet: 25
    }
  ];

  const playGame = async (gameType: string, betAmount: number, choice?: string) => {
    if (!user || !profile) return;
    
    if (profile.coin_balance < betAmount) {
      toast({
        title: "Insufficient Coins",
        description: "Anda tidak memiliki cukup coins untuk bermain",
        variant: "destructive"
      });
      return;
    }

    setGameLoading(gameType);
    
    try {
      let result = '';
      let isWin = false;
      let coinsWon = 0;

      switch (gameType) {
        case 'dice':
          const diceResult = Math.floor(Math.random() * 6) + 1;
          isWin = diceResult >= 4;
          coinsWon = isWin ? betAmount * 2 : 0;
          result = `Dice: ${diceResult} - ${isWin ? 'Win' : 'Lose'}`;
          break;
          
        case 'coinflip':
          const flipResult = Math.random() < 0.5 ? 'heads' : 'tails';
          isWin = flipResult === choice;
          coinsWon = isWin ? betAmount * 2 : 0;
          result = `Choice: ${choice}, Result: ${flipResult} - ${isWin ? 'Win' : 'Lose'}`;
          break;
          
        case 'slots':
          const symbols = ['🍒', '🍋', '🔔', '⭐', '💎'];
          const slot1 = symbols[Math.floor(Math.random() * symbols.length)];
          const slot2 = symbols[Math.floor(Math.random() * symbols.length)];
          const slot3 = symbols[Math.floor(Math.random() * symbols.length)];
          isWin = slot1 === slot2 && slot2 === slot3;
          coinsWon = isWin ? betAmount * 5 : 0;
          result = `${slot1}${slot2}${slot3} - ${isWin ? 'JACKPOT!' : 'Lose'}`;
          break;
          
        case 'roulette':
          const rouletteNumber = Math.floor(Math.random() * 37); // 0-36
          const chosenNumber = parseInt(choice || '0');
          isWin = rouletteNumber === chosenNumber;
          coinsWon = isWin ? betAmount * 10 : 0;
          result = `Number: ${rouletteNumber}, Your choice: ${chosenNumber} - ${isWin ? 'Win' : 'Lose'}`;
          break;
          
        case 'blackjack':
          const playerCard1 = Math.floor(Math.random() * 10) + 1;
          const playerCard2 = Math.floor(Math.random() * 10) + 1;
          const dealerCard = Math.floor(Math.random() * 10) + 1;
          const playerTotal = playerCard1 + playerCard2;
          isWin = playerTotal === 21 || (playerTotal > dealerCard && playerTotal <= 21);
          coinsWon = isWin ? betAmount * 3 : 0;
          result = `Your cards: ${playerCard1}+${playerCard2}=${playerTotal}, Dealer: ${dealerCard} - ${isWin ? 'Win' : 'Lose'}`;
          break;
          
        case 'lottery':
          const winningNumbers = Array.from({length: 3}, () => Math.floor(Math.random() * 9) + 1);
          const playerNumbers = [Math.floor(Math.random() * 9) + 1, Math.floor(Math.random() * 9) + 1, Math.floor(Math.random() * 9) + 1];
          const matches = winningNumbers.filter((num, idx) => num === playerNumbers[idx]).length;
          isWin = matches >= 2;
          coinsWon = isWin ? betAmount * (matches === 3 ? 8 : 3) : 0;
          result = `Winning: ${winningNumbers.join('')}, Your: ${playerNumbers.join('')} - ${matches} matches - ${isWin ? 'Win' : 'Lose'}`;
          break;
          
        default:
          throw new Error('Unknown game type');
      }

      const { error } = await supabase.rpc('process_game_result', {
        p_user_id: user.id,
        p_game_type: gameType,
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

      toast({
        title: isWin ? "Menang! 🎉" : "Kalah! 😔",
        description: `${result} - ${isWin ? `Anda memenangkan ${coinsWon} coins!` : `Anda kehilangan ${betAmount} coins`}`,
        variant: isWin ? "default" : "destructive"
      });

      refetch();
      setSelectedGame(null);
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

  const handleGameClick = (gameId: string) => {
    setSelectedGame(gameId);
  };

  const renderGameInterface = (game: any) => {
    if (!selectedGame || selectedGame !== game.id) return null;

    switch (game.id) {
      case 'dice':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Menang jika dadu menunjukkan 4, 5, atau 6</p>
            <div className="grid grid-cols-3 gap-2">
              {[50, 100, 200].map(amount => (
                <Button
                  key={amount}
                  variant="outline"
                  onClick={() => playGame('dice', amount)}
                  disabled={gameLoading === 'dice' || (profile?.coin_balance || 0) < amount}
                >
                  {amount} coins
                </Button>
              ))}
            </div>
          </div>
        );
        
      case 'coinflip':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Pilih kepala atau ekor</p>
            <div className="grid grid-cols-2 gap-2">
              <Button
                variant="outline"
                onClick={() => playGame('coinflip', 100, 'heads')}
                disabled={gameLoading === 'coinflip' || (profile?.coin_balance || 0) < 100}
              >
                Kepala (100)
              </Button>
              <Button
                variant="outline"
                onClick={() => playGame('coinflip', 100, 'tails')}
                disabled={gameLoading === 'coinflip' || (profile?.coin_balance || 0) < 100}
              >
                Ekor (100)
              </Button>
            </div>
          </div>
        );
        
      case 'roulette':
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Pilih nomor 0-36</p>
            <div className="flex gap-2">
              <input
                type="number"
                min="0"
                max="36"
                placeholder="Nomor"
                className="flex-1 px-3 py-2 border rounded-md"
                id="roulette-number"
              />
              <Button
                onClick={() => {
                  const input = document.getElementById('roulette-number') as HTMLInputElement;
                  const number = input?.value || '0';
                  playGame('roulette', 150, number);
                }}
                disabled={gameLoading === 'roulette' || (profile?.coin_balance || 0) < 150}
              >
                Bet 150
              </Button>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">Klik untuk bermain {game.title}</p>
            <Button
              onClick={() => playGame(game.id, game.minBet)}
              disabled={gameLoading === game.id || (profile?.coin_balance || 0) < game.minBet}
              className="w-full"
            >
              Main ({game.minBet} coins)
            </Button>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col space-y-2">
        <h1 className="text-3xl font-bold text-foreground">Games</h1>
        <p className="text-muted-foreground">Pilih game favorit Anda dan menangkan coins!</p>
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

      {/* Games Grid - 3 columns on mobile, responsive */}
      <div className="grid grid-cols-3 gap-4 md:gap-6">
        {games.map((game) => (
          <Card 
            key={game.id} 
            className="bg-card cursor-pointer transition-transform hover:scale-105"
            onClick={() => handleGameClick(game.id)}
          >
            <CardContent className="p-3">
              {/* Game Image */}
              <div className="relative aspect-square mb-3 overflow-hidden rounded-lg">
                <img
                  src={game.image}
                  alt={game.title}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
                <div className="absolute inset-0 bg-black/20 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                  <Play className="h-8 w-8 text-white" />
                </div>
              </div>
              
              {/* Game Info */}
              <div className="space-y-1">
                <h3 className="font-semibold text-sm text-card-foreground truncate">
                  {game.title}
                </h3>
                <p className="text-xs text-muted-foreground truncate">
                  {game.description}
                </p>
                <div className="flex items-center justify-between">
                  <Badge variant="secondary" className="text-xs">
                    Min: {game.minBet}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Game Interface */}
      {selectedGame && (
        <Card className="bg-card">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-card-foreground">
                {games.find(g => g.id === selectedGame)?.title}
              </CardTitle>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setSelectedGame(null)}
              >
                Tutup
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {renderGameInterface(games.find(g => g.id === selectedGame))}
          </CardContent>
        </Card>
      )}
    </div>
  );
}