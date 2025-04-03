
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import UnoCard from './UnoCard';
import ColorPicker from './ColorPicker';
import GameChat from './GameChat';
import { Button } from '@/components/ui/button';
import { Card, CardColor } from '@/types/uno';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, RotateCcw, Users, Play } from 'lucide-react';

const GameRoom: React.FC = () => {
  const { gameState, leaveRoom, startGame, playCard, drawCard } = useGame();
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { room, player } = gameState;
  
  if (!room || !player) return null;
  
  const isHost = player.isHost;
  const isMyTurn = player.isCurrentTurn;
  const canStartGame = isHost && room.status === 'waiting' && room.players.length >= 2;
  
  const handleCardClick = (card: Card) => {
    if (!isMyTurn || room.status !== 'playing') return;
    
    // Check if card can be played
    const currentCard = room.currentCard;
    if (!currentCard) return;
    
    const canPlay = 
      card.color === currentCard.color || 
      card.value === currentCard.value ||
      card.color === 'wild';
    
    if (!canPlay) {
      return; // Can't play this card
    }
    
    // If it's a wild card, open color picker
    if (card.type === 'wild' || card.type === 'wild4') {
      setSelectedCard(card);
      setIsColorPickerOpen(true);
    } else {
      playCard(card.id);
    }
  };
  
  const handleColorSelected = (color: CardColor) => {
    if (selectedCard) {
      playCard(selectedCard.id, color);
      setSelectedCard(null);
    }
    setIsColorPickerOpen(false);
  };
  
  const handleDrawCard = () => {
    if (isMyTurn && room.status === 'playing') {
      drawCard();
    }
  };
  
  // Organize players: current player, then others in order
  const organizedPlayers = [...room.players].sort((a, b) => {
    if (a.id === player.id) return -1;
    if (b.id === player.id) return 1;
    return 0;
  });
  
  return (
    <div className="h-full w-full flex flex-col">
      {/* Header */}
      <div className="bg-white/70 backdrop-blur-sm shadow-sm p-3 flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={leaveRoom}
            className="rounded-full"
          >
            <ArrowLeft size={18} />
          </Button>
          <h1 className="font-semibold">{room.name}</h1>
        </div>
        
        <div className="flex items-center gap-1">
          <Users size={16} />
          <span>{room.players.length}/4</span>
        </div>
      </div>
      
      {/* Game Area */}
      <div className="flex-1 flex flex-col md:flex-row p-2 md:p-4 gap-4">
        {/* Main Game */}
        <div className="flex-1 flex flex-col">
          {/* Game Status */}
          {room.status === 'waiting' ? (
            <div className="flex-1 flex flex-col items-center justify-center gap-4 p-6 bg-white/30 backdrop-blur-sm rounded-lg shadow-sm">
              <h2 className="text-xl font-semibold">Waiting for players...</h2>
              <div className="flex flex-wrap gap-3 justify-center">
                {room.players.map(p => (
                  <div 
                    key={p.id} 
                    className={`p-2 rounded-full px-4 ${p.id === player.id ? 'bg-primary text-white' : 'bg-gray-100'}`}
                  >
                    {p.name} {p.isHost && '(Host)'}
                  </div>
                ))}
              </div>
              
              {canStartGame && (
                <Button className="mt-4" onClick={startGame}>
                  <Play size={16} className="mr-2" /> Start Game
                </Button>
              )}
              
              {!canStartGame && room.players.length < 2 && (
                <div className="text-sm text-gray-500 mt-4">
                  Waiting for at least 2 players to start...
                </div>
              )}
            </div>
          ) : room.status === 'playing' ? (
            <>
              {/* Opponents */}
              <div className="mb-4 grid grid-cols-3 gap-2">
                {organizedPlayers.slice(1).map(p => (
                  <div key={p.id} className="bg-white/30 backdrop-blur-sm rounded-lg p-3 text-center relative">
                    <div className="font-medium text-sm mb-1">{p.name}</div>
                    <div className="text-xs mb-2">{p.cards.length} cards</div>
                    <div className="flex justify-center">
                      <UnoCard 
                        isBack
                        size="sm"
                        className={p.isCurrentTurn ? 'current-turn-pulse' : ''}
                      />
                    </div>
                  </div>
                ))}
              </div>
              
              {/* Current Card & Draw Pile */}
              <div className="flex justify-center gap-8 mb-8 mt-4">
                {room.currentCard && (
                  <div className="text-center">
                    <div className="mb-1 text-sm">Current Card</div>
                    <UnoCard card={room.currentCard} />
                  </div>
                )}
                
                <div className="text-center">
                  <div className="mb-1 text-sm">Draw Pile ({room.drawPile.length})</div>
                  <div className="relative card-stack-container cursor-pointer" onClick={handleDrawCard}>
                    {/* Generate stacked cards effect */}
                    {[...Array(Math.min(5, room.drawPile.length))].map((_, index) => (
                      <UnoCard 
                        key={index}
                        isBack
                        stackIndex={4 - index}
                        className={isMyTurn ? 'hover:scale-105 transition-transform' : ''}
                      />
                    ))}
                    {isMyTurn && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs z-20">
                        +
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              {/* Player's Hand */}
              <div className="mt-auto">
                <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <div className="font-medium">Your Cards</div>
                    {isMyTurn && (
                      <div className="text-sm bg-green-500 text-white px-2 py-1 rounded current-turn-pulse">
                        Your Turn
                      </div>
                    )}
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {player.cards.map(card => (
                      <UnoCard 
                        key={card.id} 
                        card={card} 
                        isPlayable={isMyTurn}
                        onClick={() => handleCardClick(card)}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/30 backdrop-blur-sm rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl">{room.winnerName} wins!</p>
              
              {isHost && (
                <Button className="mt-6" onClick={() => window.location.reload()}>
                  <RotateCcw size={16} className="mr-2" /> Play Again
                </Button>
              )}
            </div>
          )}
        </div>
        
        {/* Chat (hidden on mobile, shown in a tab) */}
        {!isMobile && (
          <div className="w-80">
            <GameChat className="h-full" />
          </div>
        )}
      </div>
      
      {/* Color Picker Dialog */}
      <ColorPicker
        isOpen={isColorPickerOpen}
        onClose={() => setIsColorPickerOpen(false)}
        onColorSelected={handleColorSelected}
      />
    </div>
  );
};

export default GameRoom;
