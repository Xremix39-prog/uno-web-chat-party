
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Trophy, Award, Clock, RotateCcw } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Player } from '@/types/uno';

// Mock leaderboard data with extended properties
const mockLeaderboardData = [
  { id: '1', name: 'Alex', wins: 28, gamesPlayed: 42, cardsInHand: 0, rank: 1, cards: [], isHost: false, isCurrentTurn: false, turnCount: 35, playTime: 180 },
  { id: '2', name: 'Jamie', wins: 24, gamesPlayed: 39, cardsInHand: 0, rank: 2, cards: [], isHost: false, isCurrentTurn: false, turnCount: 30, playTime: 165 },
  { id: '3', name: 'Taylor', wins: 19, gamesPlayed: 35, cardsInHand: 1, rank: 3, cards: [], isHost: false, isCurrentTurn: false, turnCount: 28, playTime: 150 },
  { id: '4', name: 'Jordan', wins: 15, gamesPlayed: 30, cardsInHand: 2, rank: 4, cards: [], isHost: false, isCurrentTurn: false, turnCount: 25, playTime: 138 },
  { id: '5', name: 'Casey', wins: 12, gamesPlayed: 28, cardsInHand: 3, rank: 5, cards: [], isHost: false, isCurrentTurn: false, turnCount: 22, playTime: 120 },
];

interface LeaderboardProps {
  className?: string;
  isVisible?: boolean;
  players?: Array<Player & { 
    wins: number; 
    gamesPlayed: number; 
    cardsInHand: number; 
    rank: number;
    turnCount: number;
    playTime: number;
  }>;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ className, isVisible = false, players }) => {
  const [leaderboardData, setLeaderboardData] = useState<Array<Player & { 
    wins: number; 
    gamesPlayed: number; 
    cardsInHand: number; 
    rank: number;
    turnCount: number;
    playTime: number;
  }>>(mockLeaderboardData);
  const isMobile = useIsMobile();
  
  // Update leaderboard with provided players if available
  useEffect(() => {
    if (players && players.length > 0) {
      setLeaderboardData(players);
    }
  }, [players]);
  
  if (!isVisible) return null;
  
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
  
  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  return (
    <Card className={`shadow-lg ${className}`}>
      <CardHeader className="bg-gradient-to-r from-amber-100 to-amber-200 rounded-t-lg">
        <CardTitle className="flex items-center gap-2">
          <Trophy size={24} className="text-amber-500" />
          <span>Game Results</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-16">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Wins</TableHead>
              <TableHead className="text-right">Cards</TableHead>
              <TableHead className="text-right"><RotateCcw size={16} /></TableHead>
              <TableHead className="text-right"><Clock size={16} /></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboardData.map((player) => (
              <TableRow key={player.id} className="hover:bg-amber-50">
                <TableCell className="font-medium">
                  <div className="flex items-center gap-1" title={getRankTitle(player.rank)}>
                    {getRankIcon(player.rank)}
                    <span>{player.rank}</span>
                  </div>
                </TableCell>
                <TableCell className="font-medium">{player.name}</TableCell>
                <TableCell className="text-right">{player.wins}</TableCell>
                <TableCell className="text-right">{player.cardsInHand}</TableCell>
                <TableCell className="text-right">{player.turnCount}</TableCell>
                <TableCell className="text-right">{formatTime(player.playTime)}</TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};

export default Leaderboard;
