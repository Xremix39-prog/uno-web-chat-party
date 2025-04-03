
export type CardColor = 'red' | 'blue' | 'green' | 'yellow' | 'wild';
export type CardType = 'number' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';
export type CardValue = '0' | '1' | '2' | '3' | '4' | '5' | '6' | '7' | '8' | '9' | 'skip' | 'reverse' | 'draw2' | 'wild' | 'wild4';

export interface Card {
  id: string;
  color: CardColor;
  type: CardType;
  value: CardValue;
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
}

export interface ChatMessage {
  id: string;
  senderId: string;
  senderName: string;
  message: string;
  timestamp: number;
}

export interface GameState {
  room: Room | null;
  player: Player | null;
  chatMessages: ChatMessage[];
}

export interface JoinRoomPayload {
  roomId: string;
  playerName: string;
}

export interface CreateRoomPayload {
  roomName: string;
  playerName: string;
}

export interface PlayCardPayload {
  roomId: string;
  playerId: string;
  cardId: string;
  chosenColor?: CardColor;
}

export interface ChatMessagePayload {
  roomId: string;
  message: string;
}
