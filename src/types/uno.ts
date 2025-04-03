
export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value: CardValue;
  selected?: boolean; // Added for card selection
}

export interface Player {
  id: string;
  name: string;
  cards: Card[];
  isHost: boolean;
  isCurrentTurn: boolean;
}

export interface Room {
  id: string;
  name: string;
  players: Player[];
  status: 'waiting' | 'playing' | 'finished';
  currentPlayerId: string | null;
  currentCard: Card | null;
  direction: 'clockwise' | 'counter-clockwise';
  drawPile: Card[];
  discardPile: Card[];
  winnerName: string | null;
  isPrivate: boolean; // Added for private rooms
  code?: string; // Added for joining private rooms
  turnCount: number; // Added for leaderboard
  startTime?: number; // Added for tracking game time
  deckShuffleCount: number; // Added for tracking deck shuffles
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
  isRead: boolean; // Added to track if message has been read
}

export interface GameState {
  room: Room | null;
  player: Player | null;
  chatMessages: ChatMessage[];
  showLeaderboard: boolean; // Added for leaderboard visibility
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
  code?: string; // Added for private rooms
}

export interface CreateRoomPayload {
  roomName: string;
  playerName: string;
  isPrivate?: boolean; // Added for private rooms
  isSinglePlayer?: boolean; // Added for single player mode
}

export interface PlayCardPayload {
  roomId: string;
  playerId: string;
  cardIds: string[]; // Changed to array for multiple card selection
  chosenColor?: CardColor;
}

export interface ChatMessagePayload {
  roomId: string;
  message: string;
}
