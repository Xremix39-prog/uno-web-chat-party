
import React, { createContext, useState, useEffect, useContext } from 'react';
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
  playCard: (cardId: string, chosenColor?: CardColor) => void;
  drawCard: () => void;
  sendChatMessage: (message: string) => void;
}

const initialGameState: GameState = {
  room: null,
  player: null,
  chatMessages: []
};

const GameContext = createContext<GameContextProps | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(initialGameState);
  const [availableRooms, setAvailableRooms] = useState<Room[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);

  // Initialize socket connection
  useEffect(() => {
    const initializeSocket = async () => {
      try {
        await socketService.connect();
        setIsConnected(true);
        
        // Get available rooms
        socketService.getRooms();
      } catch (error) {
        console.error('Socket connection error:', error);
        toast.error('Failed to connect to game server');
      } finally {
        setIsLoading(false);
      }
    };

    initializeSocket();

    return () => {
      socketService.disconnect();
    };
  }, []);

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
      
      toast.success('Room created successfully');
    });

    // Room joined event
    socketService.on('roomJoined', ({ room, player }: { room: Room; player: Player }) => {
      setGameState(prev => ({
        ...prev,
        room,
        player
      }));
      
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

    // Chat message event
    socketService.on('chatMessage', (message: ChatMessage) => {
      setGameState(prev => {
        if (prev.room?.id === message.id.split('_')[0]) {
          return {
            ...prev,
            chatMessages: [...prev.chatMessages, message]
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
    }
  };

  const startGame = () => {
    if (gameState.room) {
      socketService.startGame(gameState.room.id);
    }
  };

  const playCard = (cardId: string, chosenColor?: CardColor) => {
    if (gameState.room && gameState.player) {
      const payload: PlayCardPayload = {
        roomId: gameState.room.id,
        playerId: gameState.player.id,
        cardId,
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
        sendChatMessage
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
