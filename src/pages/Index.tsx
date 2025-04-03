
import React, { useEffect } from 'react';
import { GameProvider, useGame } from '@/context/GameContext';
import Lobby from '@/components/Lobby';
import GameRoom from '@/components/GameRoom';
import MobileGameView from '@/components/MobileGameView';
import LoadingSpinner from '@/components/LoadingSpinner';
import { useIsMobile } from '@/hooks/use-mobile';
import { useLocation, useNavigate } from 'react-router-dom';

const GameComponent: React.FC = () => {
  const { gameState, isLoading } = useGame();
  const isMobile = useIsMobile();
  const location = useLocation();
  const navigate = useNavigate();
  const isSinglePlayer = location.pathname === '/singleplayer';
  
  // Redirect back to home if accessed directly
  useEffect(() => {
    if (location.pathname !== '/multiplayer' && location.pathname !== '/singleplayer') {
      navigate('/');
    }
  }, [location.pathname, navigate]);
  
  if (isLoading) {
    return (
      <div className="h-screen flex flex-col items-center justify-center">
        <LoadingSpinner size="lg" />
        <p className="mt-4 text-lg">Connecting to game server...</p>
      </div>
    );
  }
  
  // Show lobby if not in a room
  if (!gameState.room) {
    return <Lobby isSinglePlayer={isSinglePlayer} />;
  }
  
  // Show game room or mobile view based on screen size
  return isMobile ? <MobileGameView /> : <GameRoom />;
};

const Index: React.FC = () => {
  return (
    <GameProvider>
      <div className="min-h-screen overflow-hidden">
        <GameComponent />
      </div>
    </GameProvider>
  );
};

export default Index;
