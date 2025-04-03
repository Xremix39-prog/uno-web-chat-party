
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Award } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Player } from '@/types/uno';

// Mock leaderboard data - in a real app, this would come from the backend
const mockLeaderboardData = [
  { id: '1', name: 'Alex', wins: 28, gamesPlayed: 42, cardsInHand: 0, rank: 1 },
  { id: '2', name: 'Jamie', wins: 24, gamesPlayed: 39, cardsInHand: 0, rank: 2 },
  { id: '3', name: 'Taylor', wins: 19, gamesPlayed: 35, cardsInHand: 1, rank: 3 },
  { id: '4', name: 'Jordan', wins: 15, gamesPlayed: 30, cardsInHand: 2, rank: 4 },
  { id: '5', name: 'Casey', wins: 12, gamesPlayed: 28, cardsInHand: 3, rank: 5 },
];

interface LeaderboardProps {
  className?: string;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ className }) => {
  const [players, setPlayers] = useState<Array<Player & { wins: number; gamesPlayed: number; cardsInHand: number; rank: number }>>(mockLeaderboardData);
  const isMobile = useIsMobile();
  
  // In a real implementation, fetch leaderboard data from the server
  useEffect(() => {
    // This would typically be a fetch call to your backend
    // For now, we're using the mock data
  }, []);
  
  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Trophy className="text-amber-500" size={isMobile ? 16 : 20} />;
      case 2:
        return <Award className="text-yellow-500" size={isMobile ? 16 : 20} />;
      case 3:
        return <Award className="text-amber-700" size={isMobile ? 16 : 20} />;
      case 4:
        return <Award className="text-gray-400" size={isMobile ? 16 : 20} />;
      default:
        return null;
    }
  };
  
  const getRankTitle = (rank: number) => {
    switch (rank) {
      case 1:
        return "Gold Trophy";
      case 2:
        return "Gold Medal";
      case 3:
        return "Bronze Medal";
      case 4:
        return "Silver Medal";
      default:
        return "";
    }
  };
  
  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Trophy size={24} className="text-amber-500" />
          <span>Leaderboard</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Wins</TableHead>
              <TableHead className="text-right">Games</TableHead>
              <TableHead className="text-right">Cards</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {players.map((player) => (
              <TableRow key={player.id} className="hover:bg-amber-50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1" title={getRankTitle(player.rank)}>
                    {getRankIcon(player.rank)}
                    <span>{player.rank}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell className="text-right">{player.wins}</TableCell>
                <TableCell className="text-right">{player.gamesPlayed}</TableCell>
                <TableCell className="text-right">{player.cardsInHand}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
