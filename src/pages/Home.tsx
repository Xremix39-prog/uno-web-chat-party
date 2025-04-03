
import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, Users, User, Medal } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import Leaderboard from '@/components/Leaderboard';

const Home: React.FC = () => {
  const navigate = useNavigate();
  const isMobile = useIsMobile();
  
  return (
    <div className="min-h-screen bg-gradient-to-b from-uno-background to-white p-4 flex flex-col items-center">
      <div className="text-center mb-8 mt-8">
        <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-uno-red via-uno-blue to-uno-green bg-clip-text text-transparent">
          UNO Online
        </h1>
        <p className="text-lg text-gray-600 mt-2">
          Choose your game mode and start playing!
        </p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl mb-8">
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
          <CardHeader className="bg-gradient-to-r from-uno-blue to-uno-green bg-opacity-10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <User size={24} />
              <span>Single Player</span>
            </CardTitle>
            <CardDescription>
              Play against AI opponents
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p>Practice your UNO skills against computer opponents. Perfect for learning strategies or just having fun!</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">AI Opponents</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Practice Mode</span>
              <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">Offline Play</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/singleplayer')} 
              className="w-full bg-uno-blue hover:bg-blue-700"
            >
              Play Single Player
            </Button>
          </CardFooter>
        </Card>
        
        <Card className="shadow-lg hover:shadow-xl transition-shadow duration-300 transform hover:-translate-y-1">
          <CardHeader className="bg-gradient-to-r from-uno-red to-uno-yellow bg-opacity-10 rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <Users size={24} />
              <span>Multiplayer</span>
            </CardTitle>
            <CardDescription>
              Play with friends online
            </CardDescription>
          </CardHeader>
          <CardContent className="pt-6">
            <p>Join or create rooms to play UNO with friends and other players online. Compete for the leaderboard rankings!</p>
            <div className="mt-4 flex flex-wrap gap-2">
              <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full">Online Rooms</span>
              <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">Live Players</span>
              <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">Leaderboards</span>
            </div>
          </CardContent>
          <CardFooter>
            <Button 
              onClick={() => navigate('/multiplayer')} 
              className="w-full bg-uno-red hover:bg-red-700"
            >
              Play Multiplayer
            </Button>
          </CardFooter>
        </Card>
      </div>
      
      <div className="w-full max-w-4xl">
        <Leaderboard />
      </div>
    </div>
  );
};

export default Home;
