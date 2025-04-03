
import React, { useState, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import UnoCard from './UnoCard';
import ColorPicker from './ColorPicker';
import GameChat from './GameChat';
import Leaderboard from './Leaderboard';
import { Button } from '@/components/ui/button';
import { Card, CardColor } from '@/types/uno';
import { useIsMobile } from '@/hooks/use-mobile';
import { ArrowLeft, RotateCcw, Users, Play, Send } from 'lucide-react';

const GameRoom: React.FC = () => {
  const { gameState, leaveRoom, startGame, playCard, drawCard, toggleLeaderboard } = useGame();
  const [selectedCards, setSelectedCards] = useState<Card[]>([]);
  const [isColorPickerOpen, setIsColorPickerOpen] = useState(false);
  const isMobile = useIsMobile();
  
  const { room, player, showLeaderboard } = gameState;
  
  if (!room || !player) return null;
  
  const isHost = player.isHost;
  const isMyTurn = player.isCurrentTurn;
  const canStartGame = isHost && room.status === 'waiting' && room.players.length >= 2;

  useEffect(() => {
    // Reset selected cards when it's not player's turn
    if (!isMyTurn) {
      setSelectedCards([]);
    }
  }, [isMyTurn]);
  
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
    
    // Toggle card selection
    if (selectedCards.some(c => c.id === card.id)) {
      setSelectedCards(prev => prev.filter(c => c.id !== card.id));
    } else {
      setSelectedCards(prev => [...prev, card]);
    }
  };
  
  const handleCardDoubleClick = (card: Card) => {
    if (!isMyTurn || room.status !== 'playing' || selectedCards.length === 0) return;
    
    // If it's a wild card, open color picker
    if (selectedCards.some(c => c.type === 'wild' || c.type === 'wild4')) {
      setIsColorPickerOpen(true);
    } else {
      playSelectedCards();
    }
  };
  
  const playSelectedCards = (chosenColor?: CardColor) => {
    if (selectedCards.length > 0) {
      const cardIds = selectedCards.map(card => card.id);
      playCard(cardIds, chosenColor);
      setSelectedCards([]);
    }
  };
  
  const handleColorSelected = (color: CardColor) => {
    playSelectedCards(color);
    setIsColorPickerOpen(false);
  };
  
  const handleDrawCard = () => {
    if (isMyTurn && room.status === 'playing') {
      drawCard();
      setSelectedCards([]);
    }
  };
  
  // Calculate game time
  const getGameTime = () => {
    if (!room.startTime) return '0:00';
    const seconds = Math.floor((Date.now() - room.startTime) / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };
  
  // Organize players: current player, then others in order
  const organizedPlayers = [...room.players].sort((a, b) => {
    if (a.id === player.id) return -1;
    if (b.id === player.id) return 1;
    return 0;
  });
  
  // Calculate player stats for leaderboard
  const getPlayerStats = () => {
    return room.players.map((p, index) => ({
      ...p,
      wins: p.id === room.winnerName ? 1 : 0,
      gamesPlayed: 1,
      cardsInHand: p.cards.length,
      rank: p.id === room.winnerName ? 1 : index + 2,
      turnCount: room.turnCount,
      playTime: room.startTime ? Math.floor((Date.now() - room.startTime) / 1000) : 0
    }));
  };
  
  // Show leaderboard if game is finished
  if (room.status === 'finished' && showLeaderboard) {
    return (
      <div className="h-full flex flex-col">
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
        
        <div className="flex-1 p-4 flex flex-col">
          <Leaderboard 
            isVisible={true} 
            players={getPlayerStats()} 
            className="mb-6"
          />
          
          <div className="text-center mt-4">
            <h2 className="text-2xl font-bold mb-2">Game Statistics</h2>
            <div className="grid grid-cols-2 gap-4 max-w-md mx-auto">
              <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
                <div className="text-lg font-medium">Deck Shuffles</div>
                <div className="text-3xl">{room.deckShuffleCount}</div>
              </div>
              <div className="bg-white/30 backdrop-blur-sm rounded-lg p-4">
                <div className="text-lg font-medium">Total Time</div>
                <div className="text-3xl">{getGameTime()}</div>
              </div>
            </div>
          </div>
          
          {isHost && (
            <Button className="mt-6 mx-auto" onClick={() => window.location.reload()}>
              <RotateCcw size={16} className="mr-2" /> Play Again
            </Button>
          )}
        </div>
      </div>
    );
  }
  
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
          {room.isPrivate && (
            <span className="text-xs bg-amber-100 px-2 py-1 rounded">
              Code: {room.code}
            </span>
          )}
        </div>
        
        <div className="flex items-center gap-3">
          {room.status === 'playing' && (
            <span className="text-sm">{getGameTime()}</span>
          )}
          <div className="flex items-center gap-1">
            <Users size={16} />
            <span>{room.players.length}/4</span>
          </div>
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
                        className={p.isCurrentTurn ? 'ring-2 ring-yellow-400 animate-pulse' : ''}
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
                  <div 
                    className="relative cursor-pointer" 
                    onClick={handleDrawCard}
                  >
                    <div className="relative">
                      {/* Stacked cards effect */}
                      {[...Array(Math.min(5, room.drawPile.length))].map((_, i) => (
                        <div 
                          key={i} 
                          className="absolute" 
                          style={{ 
                            top: `${-i * 2}px`, 
                            left: `${-i * 2}px`, 
                            zIndex: 5 - i 
                          }}
                        >
                          <UnoCard 
                            isBack 
                            className={isMyTurn ? 'hover:scale-110 transition-transform' : ''}
                          />
                        </div>
                      ))}
                      {/* Main card */}
                      <UnoCard 
                        isBack
                        className={isMyTurn ? 'hover:scale-110 transition-transform' : ''}
                      />
                    </div>
                    {isMyTurn && (
                      <div className="absolute -top-2 -right-2 bg-primary text-white rounded-full w-6 h-6 flex items-center justify-center text-xs">
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
                    <div className="flex gap-2">
                      {selectedCards.length > 0 && (
                        <Button 
                          size="sm" 
                          onClick={() => handleCardDoubleClick(selectedCards[0])}
                          variant="outline"
                        >
                          <Send size={14} className="mr-1" />
                          Play {selectedCards.length} cards
                        </Button>
                      )}
                      {isMyTurn && (
                        <div className="text-sm bg-green-500 text-white px-2 py-1 rounded animate-pulse">
                          Your Turn
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 justify-center">
                    {player.cards.map(card => {
                      // Check if card is selected
                      const isSelected = selectedCards.some(c => c.id === card.id);
                      
                      return (
                        <UnoCard 
                          key={card.id} 
                          card={card} 
                          isPlayable={isMyTurn}
                          isSelected={isSelected}
                          onClick={() => handleCardClick(card)}
                          onDoubleClick={() => handleCardDoubleClick(card)}
                        />
                      );
                    })}
                  </div>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center p-6 bg-white/30 backdrop-blur-sm rounded-lg shadow-sm">
              <h2 className="text-2xl font-bold mb-4">Game Over!</h2>
              <p className="text-xl">{room.winnerName} wins!</p>
              
              <Button 
                className="mt-6" 
                onClick={toggleLeaderboard}
              >
                <Trophy size={16} className="mr-2" /> View Leaderboard
              </Button>
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
