
import React, { createContext, useState, useEffect, useContext, useCallback } from 'react';
import socketService from '../services/socket';
import { toast } from 'sonner';
import {
  GameState,
  Room,
  Player,
  Card,
  ChatMessage,
  CardColor,
  CreateRoomPayload,
  JoinRoomPayload,
  PlayCardPayload,
  ChatMessagePayload
} from '../types/uno';

interface GameContextProps {
  gameState: GameState;
  availableRooms: Room[];
  isConnected: boolean;
  isLoading: boolean;
  createRoom: (payload: CreateRoomPayload) => void;
  joinRoom: (payload: JoinRoomPayload) => void;
  leaveRoom: () => void;
  startGame: () => void;
  playCard: (cardIds: string | string[], chosenColor?: CardColor) => void;
  drawCard: () => void;
  sendChatMessage: (message: string) => void;
  markChatMessagesAsRead: () => void;
  toggleLeaderboard: () => void;
}

const initialGameState: GameState = {
  room: null,
  player: null,
  chatMessages: [],
  showLeaderboard: false
};

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [connectionAttempts, setConnectionAttempts] = useState<number>(0);
  const [playerId, setPlayerId] = useState<string | null>(null);

  // Function to mark all chat messages as read
  const markChatMessagesAsRead = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      chatMessages: prev.chatMessages.map(msg => ({ ...msg, isRead: true }))
    }));
  }, []);

  // Toggle leaderboard visibility
  const toggleLeaderboard = useCallback(() => {
    setGameState(prev => ({
      ...prev,
      showLeaderboard: !prev.showLeaderboard
    }));
  }, []);

  // Store player ID in localStorage for reconnection
  useEffect(() => {
    const storedPlayerId = localStorage.getItem('unoPlayerId');
    if (storedPlayerId) {
      setPlayerId(storedPlayerId);
    }
  }, []);

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connect();
        setIsConnected(true);
        
        // Get available rooms
        socketService.getRooms();
        
        // Try to reconnect if playerId exists
        if (playerId) {
          socketService.reconnect(playerId);
        }
      } catch (error) {
        console.error('Socket connection error:', error);
        
        // Retry connection up to 3 times
        if (connectionAttempts < 3) {
          setConnectionAttempts(prev => prev + 1);
          
          setTimeout(() => {
            initializeSocket();
          }, 2000);
        } else {
          toast.error('Failed to connect to game server');
          setIsLoading(false);
        }
      } finally {
        if (connectionAttempts >= 3) {
          setIsLoading(false);
        }
      }
    };

    initializeSocket();

    return () => {
      socketService.disconnect();
    };
  }, [connectionAttempts, playerId]);

  // Socket event listeners
  useEffect(() => {
    if (!isConnected) return;

    // Listen for available rooms
    socketService.on('rooms', (rooms: Room[]) => {
      setAvailableRooms(rooms);
    });

    // Room created event
    socketService.on('roomCreated', ({ room, player }: { room: Room; player: Player }) => {
      setGameState(prev => ({
        ...prev,
        room,
        player
      }));
      
      // Store player ID for potential reconnection
      localStorage.setItem('unoPlayerId', player.id);
      setPlayerId(player.id);
      
      toast.success('Room created successfully');
    });

    // Room joined event
    socketService.on('roomJoined', ({ room, player }: { room: Room; player: Player }) => {
      setGameState(prev => ({
        ...prev,
        room,
        player
      }));
      
      // Store player ID for potential reconnection
      localStorage.setItem('unoPlayerId', player.id);
      setPlayerId(player.id);
      
      toast.success('Joined room successfully');
    });

    // Room updated event
    socketService.on('roomUpdated', (room: Room) => {
      setGameState(prev => {
        // Only update if we're in this room
        if (prev.room?.id === room.id) {
          // Update player if it exists
          const updatedPlayer = room.players.find(p => p.id === prev.player?.id);
          
          return {
            ...prev,
            room,
            player: updatedPlayer || prev.player
          };
        }
        
        return prev;
      });
    });

    // Game started event
    socketService.on('gameStarted', (room: Room) => {
      setGameState(prev => {
        if (prev.room?.id === room.id) {
          // Find updated player
          const updatedPlayer = room.players.find(p => p.id === prev.player?.id);
          
          return {
            ...prev,
            room,
            player: updatedPlayer || prev.player
          };
        }
        
        return prev;
      });
      
      toast.success('Game started');
    });

    // Card played event
    socketService.on('cardPlayed', ({ roomId, playerId, card }: { roomId: string, playerId: string, card: Card }) => {
      // Just update the room through roomUpdated event
      // This is just for special notifications
      if (gameState.player && playerId !== gameState.player.id) {
        const playerName = gameState.room?.players.find(p => p.id === playerId)?.name || 'Someone';
        toast(`${playerName} played a card`);
      }
    });

    // Card drawn event
    socketService.on('cardDrawn', ({ roomId, playerId }: { roomId: string, playerId: string }) => {
      // Just update the room through roomUpdated event
      // This is just for special notifications
      if (gameState.player && playerId !== gameState.player.id) {
        const playerName = gameState.room?.players.find(p => p.id === playerId)?.name || 'Someone';
        toast(`${playerName} drew a card`);
      }
    });

    // Game over event
    socketService.on('gameOver', ({ roomId, winnerName }: { roomId: string, winnerName: string }) => {
      toast.success(`Game over! ${winnerName} wins!`);
    });

    // Room left event
    socketService.on('roomLeft', ({ roomId, playerId }: { roomId: string, playerId: string }) => {
      // If we're the one who left, reset game state
      if (gameState.player?.id === playerId) {
        setGameState(initialGameState);
        toast.info('You left the room');
      } else if (gameState.room?.id === roomId) {
        // If someone else left, they'll be removed in roomUpdated event
        const playerName = gameState.room?.players.find(p => p.id === playerId)?.name || 'Someone';
        toast.info(`${playerName} left the room`);
      }
    });

    // Reconnection event
    socketService.on('reconnected', ({ room, player }: { room: Room; player: Player }) => {
      if (room && player) {
        setGameState(prev => ({
          ...prev,
          room,
          player
        }));
        toast.success('Reconnected to game!');
      }
    });

    // Chat message event
    socketService.on('chatMessage', (message: ChatMessage) => {
      setGameState(prev => {
        if (prev.room?.id === message.id.split('_')[0]) {
          // Mark message as unread if it's not from current player
          const isFromCurrentPlayer = message.senderId === prev.player?.id;
          
          return {
            ...prev,
            chatMessages: [
              ...prev.chatMessages, 
              { ...message, isRead: isFromCurrentPlayer }
            ]
          };
        }
        
        return prev;
      });
    });

    // Error event
    socketService.on('error', ({ message }: { message: string }) => {
      toast.error(message);
    });

    return () => {
      // No cleanup needed, socket disconnection is handled in parent useEffect
    };
  }, [isConnected, gameState.player, gameState.room]);

  // Game actions
  const createRoom = (payload: CreateRoomPayload) => {
    socketService.createRoom(payload);
  };

  const joinRoom = (payload: JoinRoomPayload) => {
    socketService.joinRoom(payload);
  };

  const leaveRoom = () => {
    if (gameState.room && gameState.player) {
      socketService.leaveRoom(gameState.room.id, gameState.player.id);
      // Clear stored player ID
      localStorage.removeItem('unoPlayerId');
      setPlayerId(null);
    }
  };

  const startGame = () => {
    if (gameState.room) {
      socketService.startGame(gameState.room.id);
    }
  };

  const playCard = (cardIds: string | string[], chosenColor?: CardColor) => {
    if (gameState.room && gameState.player) {
      // Convert single cardId to array
      const cardIdsArray = Array.isArray(cardIds) ? cardIds : [cardIds];
      
      const payload: PlayCardPayload = {
        roomId: gameState.room.id,
        playerId: gameState.player.id,
        cardIds: cardIdsArray,
        chosenColor
      };
      
      socketService.playCard(payload);
    }
  };

  const drawCard = () => {
    if (gameState.room && gameState.player) {
      socketService.drawCard(gameState.room.id, gameState.player.id);
    }
  };

  const sendChatMessage = (message: string) => {
    if (gameState.room) {
      const payload: ChatMessagePayload = {
        roomId: gameState.room.id,
        message
      };
      
      socketService.sendChatMessage(payload);
    }
  };

  return (
    <GameContext.Provider
      value={{
        gameState,
        availableRooms,
        isConnected,
        isLoading,
        createRoom,
        joinRoom,
        leaveRoom,
        startGame,
        playCard,
        drawCard,
        sendChatMessage,
        markChatMessagesAsRead,
        toggleLeaderboard
      }}
    >
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  
  if (context === undefined) {
    throw new Error('useGame must be used within a GameProvider');
  }
  
  return context;
};
