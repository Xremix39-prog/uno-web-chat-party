import { io, Socket } from 'socket.io-client';
import { 
  Room, 
  Player, 
  Card, 
  ChatMessage, 
  JoinRoomPayload, 
  CreateRoomPayload, 
  PlayCardPayload, 
  ChatMessagePayload,
  CardColor,
  CardType,
  CardValue
} from '../types/uno';

// For development, we'll use a mock socket implementation that simulates a backend
class MockSocket {
  private listeners: Record<string, Array<(...args: any[]) => void>> = {};
  private rooms: Room[] = [];
  private players: Player[] = [];
  private chatMessages: Record<string, ChatMessage[]> = {};
  
  constructor() {
    this.initializeMockData();
  }
  
  private initializeMockData() {
    // Create some sample rooms
    this.rooms = [
      {
        id: 'room1',
        name: 'Fun Room',
        players: [],
        status: 'waiting',
        currentPlayerId: null,
        currentCard: null,
        direction: 'clockwise',
        drawPile: [],
        discardPile: [],
        winnerName: null
      },
      {
        id: 'room2',
        name: 'Pro Players Only',
        players: [],
        status: 'waiting',
        currentPlayerId: null,
        currentCard: null,
        direction: 'clockwise',
        drawPile: [],
        discardPile: [],
        winnerName: null
      }
    ];
    
    // Initialize chat messages for each room
    this.rooms.forEach(room => {
      this.chatMessages[room.id] = [];
    });
  }
  
  public on(event: string, callback: (...args: any[]) => void) {
    if (!this.listeners[event]) {
      this.listeners[event] = [];
    }
    this.listeners[event].push(callback);
    
    // Immediately emit available rooms for the 'connect' event
    if (event === 'connect') {
      setTimeout(() => {
        callback();
        this.emit('rooms', this.rooms);
      }, 500);
    }
    
    return this;
  }
  
  public emit(event: string, ...args: any[]) {
    console.log(`MockSocket emitting: ${event}`, args);
    
    // Handle different events
    if (event === 'getRooms') {
      setTimeout(() => this.triggerEvent('rooms', this.rooms), 300);
    }
    else if (event === 'createRoom') {
      const payload = args[0] as CreateRoomPayload;
      this.handleCreateRoom(payload);
    }
    else if (event === 'joinRoom') {
      const payload = args[0] as JoinRoomPayload;
      this.handleJoinRoom(payload);
    }
    else if (event === 'leaveRoom') {
      const { roomId, playerId } = args[0];
      this.handleLeaveRoom(roomId, playerId);
    }
    else if (event === 'startGame') {
      const { roomId } = args[0];
      this.handleStartGame(roomId);
    }
    else if (event === 'playCard') {
      const payload = args[0] as PlayCardPayload;
      this.handlePlayCard(payload);
    }
    else if (event === 'drawCard') {
      const { roomId, playerId } = args[0];
      this.handleDrawCard(roomId, playerId);
    }
    else if (event === 'sendChatMessage') {
      const payload = args[0] as ChatMessagePayload;
      this.handleChatMessage(payload);
    }
    
    return this;
  }
  
  private triggerEvent(event: string, ...args: any[]) {
    if (this.listeners[event]) {
      this.listeners[event].forEach(callback => {
        callback(...args);
      });
    }
  }
  
  private handleCreateRoom(payload: CreateRoomPayload) {
    const roomId = `room${Date.now()}`;
    const playerId = `player${Date.now()}`;
    
    const player: Player = {
      id: playerId,
      name: payload.playerName,
      cards: [],
      isHost: true,
      isCurrentTurn: false
    };
    
    const room: Room = {
      id: roomId,
      name: payload.roomName,
      players: [player],
      status: 'waiting',
      currentPlayerId: null,
      currentCard: null,
      direction: 'clockwise',
      drawPile: [],
      discardPile: [],
      winnerName: null
    };
    
    this.rooms.push(room);
    this.players.push(player);
    this.chatMessages[roomId] = [];
    
    setTimeout(() => {
      this.triggerEvent('roomCreated', { room, player });
      this.triggerEvent('rooms', this.rooms);
    }, 500);
  }
  
  private handleJoinRoom(payload: JoinRoomPayload) {
    const room = this.rooms.find(r => r.id === payload.roomId);
    
    if (room && room.status === 'waiting' && room.players.length < 4) {
      const playerId = `player${Date.now()}`;
      
      const player: Player = {
        id: playerId,
        name: payload.playerName,
        cards: [],
        isHost: false,
        isCurrentTurn: false
      };
      
      room.players.push(player);
      this.players.push(player);
      
      setTimeout(() => {
        this.triggerEvent('roomJoined', { room, player });
        this.triggerEvent('roomUpdated', room);
        this.triggerEvent('rooms', this.rooms);
      }, 500);
    } else {
      setTimeout(() => {
        this.triggerEvent('error', { message: 'Cannot join room' });
      }, 500);
    }
  }
  
  private handleLeaveRoom(roomId: string, playerId: string) {
    const room = this.rooms.find(r => r.id === roomId);
    
    if (room) {
      const playerIndex = room.players.findIndex(p => p.id === playerId);
      
      if (playerIndex !== -1) {
        const isHost = room.players[playerIndex].isHost;
        room.players.splice(playerIndex, 1);
        
        // If the host left, assign a new host if there are players remaining
        if (isHost && room.players.length > 0) {
          room.players[0].isHost = true;
        }
        
        // If no players left, remove the room
        if (room.players.length === 0) {
          const roomIndex = this.rooms.findIndex(r => r.id === roomId);
          if (roomIndex !== -1) {
            this.rooms.splice(roomIndex, 1);
            delete this.chatMessages[roomId];
          }
        }
        
        setTimeout(() => {
          this.triggerEvent('roomLeft', { roomId, playerId });
          this.triggerEvent('roomUpdated', room);
          this.triggerEvent('rooms', this.rooms);
        }, 500);
      }
    }
  }
  
  private handleStartGame(roomId: string) {
    const room = this.rooms.find(r => r.id === roomId);
    
    if (room && room.players.length >= 2 && room.players.length <= 4) {
      room.status = 'playing';
      
      // Generate deck
      const deck = this.generateDeck();
      
      // Shuffle deck
      this.shuffleDeck(deck);
      
      // Deal cards to players (7 cards each)
      room.players.forEach(player => {
        player.cards = deck.splice(0, 7);
      });
      
      // Set initial discard pile with one card
      const initialCard = deck.splice(0, 1)[0];
      
      // If the initial card is a special card, replace it with a number card
      if (initialCard.type !== 'number') {
        // Put it back in the deck
        deck.push(initialCard);
        this.shuffleDeck(deck);
        
        // Find first number card
        let numberCardIndex = deck.findIndex(card => card.type === 'number');
        if (numberCardIndex === -1) {
          // This shouldn't happen with a full deck, but just in case
          numberCardIndex = 0;
        }
        
        // Set it as the initial card
        const numberCard = deck.splice(numberCardIndex, 1)[0];
        room.currentCard = numberCard;
        room.discardPile = [numberCard];
      } else {
        room.currentCard = initialCard;
        room.discardPile = [initialCard];
      }
      
      // Set draw pile
      room.drawPile = deck;
      
      // Set first player
      const firstPlayerIndex = Math.floor(Math.random() * room.players.length);
      room.currentPlayerId = room.players[firstPlayerIndex].id;
      room.players[firstPlayerIndex].isCurrentTurn = true;
      
      setTimeout(() => {
        this.triggerEvent('gameStarted', room);
        this.triggerEvent('roomUpdated', room);
      }, 500);
    }
  }
  
  private handlePlayCard(payload: PlayCardPayload) {
    const { roomId, playerId, cardId, chosenColor } = payload;
    const room = this.rooms.find(r => r.id === roomId);
    
    if (room && room.status === 'playing' && room.currentPlayerId === playerId) {
      const player = room.players.find(p => p.id === playerId);
      
      if (player) {
        const cardIndex = player.cards.findIndex(c => c.id === cardId);
        
        if (cardIndex !== -1) {
          const card = player.cards[cardIndex];
          
          // Check if the card can be played
          if (this.canPlayCard(card, room.currentCard!)) {
            // Remove card from player's hand
            player.cards.splice(cardIndex, 1);
            
            // Add card to discard pile
            room.discardPile.unshift(card);
            room.currentCard = card;
            
            // Handle card effects
            if (card.type === 'skip') {
              this.skipNextPlayer(room);
            }
            else if (card.type === 'reverse') {
              room.direction = room.direction === 'clockwise' ? 'counter-clockwise' : 'clockwise';
            }
            else if (card.type === 'draw2') {
              const nextPlayerId = this.getNextPlayerId(room);
              const nextPlayer = room.players.find(p => p.id === nextPlayerId);
              
              if (nextPlayer) {
                // Draw 2 cards
                if (room.drawPile.length < 2) {
                  this.reshuffleDiscardPile(room);
                }
                
                nextPlayer.cards.push(...room.drawPile.splice(0, 2));
                
                // Skip next player
                this.skipNextPlayer(room);
              }
            }
            else if (card.type === 'wild' || card.type === 'wild4') {
              // Set chosen color
              if (chosenColor) {
                card.color = chosenColor;
              }
              
              // If wild4, next player draws 4 cards
              if (card.type === 'wild4') {
                const nextPlayerId = this.getNextPlayerId(room);
                const nextPlayer = room.players.find(p => p.id === nextPlayerId);
                
                if (nextPlayer) {
                  // Draw 4 cards
                  if (room.drawPile.length < 4) {
                    this.reshuffleDiscardPile(room);
                  }
                  
                  nextPlayer.cards.push(...room.drawPile.splice(0, 4));
                  
                  // Skip next player
                  this.skipNextPlayer(room);
                }
              }
            }
            
            // Check if player has no cards left (win condition)
            if (player.cards.length === 0) {
              room.status = 'finished';
              room.winnerName = player.name;
              
              setTimeout(() => {
                this.triggerEvent('gameOver', { 
                  roomId: room.id, 
                  winnerName: player.name 
                });
                this.triggerEvent('roomUpdated', room);
              }, 500);
              
              return;
            }
            
            // Move to next player if not already done by a special card
            if (card.type !== 'skip' && card.type !== 'draw2' && card.type !== 'wild4') {
              this.moveToNextPlayer(room);
            }
            
            setTimeout(() => {
              this.triggerEvent('cardPlayed', { 
                roomId: room.id, 
                playerId, 
                card 
              });
              this.triggerEvent('roomUpdated', room);
            }, 500);
          } else {
            setTimeout(() => {
              this.triggerEvent('error', { message: 'Cannot play this card' });
            }, 500);
          }
        }
      }
    }
  }
  
  private handleDrawCard(roomId: string, playerId: string) {
    const room = this.rooms.find(r => r.id === roomId);
    
    if (room && room.status === 'playing' && room.currentPlayerId === playerId) {
      const player = room.players.find(p => p.id === playerId);
      
      if (player) {
        // Check if deck needs to be reshuffled
        if (room.drawPile.length === 0) {
          this.reshuffleDiscardPile(room);
        }
        
        // Draw a card
        if (room.drawPile.length > 0) {
          const card = room.drawPile.shift()!;
          player.cards.push(card);
          
          // Move to next player
          this.moveToNextPlayer(room);
          
          setTimeout(() => {
            this.triggerEvent('cardDrawn', { 
              roomId: room.id, 
              playerId, 
              card 
            });
            this.triggerEvent('roomUpdated', room);
          }, 500);
        }
      }
    }
  }
  
  private handleChatMessage(payload: ChatMessagePayload) {
    const { roomId, message } = payload;
    const room = this.rooms.find(r => r.id === roomId);
    
    if (room) {
      const player = this.players.find(p => 
        room.players.some(rp => rp.id === p.id)
      );
      
      if (player) {
        const chatMessage: ChatMessage = {
          id: `msg${Date.now()}`,
          senderId: player.id,
          senderName: player.name,
          message,
          timestamp: Date.now()
        };
        
        this.chatMessages[roomId].push(chatMessage);
        
        setTimeout(() => {
          this.triggerEvent('chatMessage', chatMessage);
        }, 300);
      }
    }
  }
  
  private canPlayCard(card: Card, currentCard: Card): boolean {
    // Wild and Wild+4 can always be played
    if (card.type === 'wild' || card.type === 'wild4') {
      return true;
    }
    
    // Otherwise, match color or value
    return card.color === currentCard.color || card.value === currentCard.value;
  }
  
  private getNextPlayerId(room: Room): string {
    const currentPlayerIndex = room.players.findIndex(p => p.id === room.currentPlayerId);
    let nextPlayerIndex;
    
    if (room.direction === 'clockwise') {
      nextPlayerIndex = (currentPlayerIndex + 1) % room.players.length;
    } else {
      nextPlayerIndex = (currentPlayerIndex - 1 + room.players.length) % room.players.length;
    }
    
    return room.players[nextPlayerIndex].id;
  }
  
  private moveToNextPlayer(room: Room) {
    // Set current player's turn to false
    const currentPlayer = room.players.find(p => p.id === room.currentPlayerId);
    if (currentPlayer) {
      currentPlayer.isCurrentTurn = false;
    }
    
    // Get next player
    const nextPlayerId = this.getNextPlayerId(room);
    room.currentPlayerId = nextPlayerId;
    
    // Set next player's turn to true
    const nextPlayer = room.players.find(p => p.id === nextPlayerId);
    if (nextPlayer) {
      nextPlayer.isCurrentTurn = true;
    }
  }
  
  private skipNextPlayer(room: Room) {
    // Move to next player
    this.moveToNextPlayer(room);
    
    // Then move to next player again (skipping one)
    this.moveToNextPlayer(room);
  }
  
  private reshuffleDiscardPile(room: Room) {
    // Keep the current top card
    const topCard = room.discardPile.shift();
    
    // Add rest of discard pile to draw pile
    room.drawPile.push(...room.discardPile);
    
    // Clear discard pile
    room.discardPile = [];
    
    // Put the top card back
    if (topCard) {
      room.discardPile.push(topCard);
    }
    
    // Shuffle draw pile
    this.shuffleDeck(room.drawPile);
  }
  
  private generateDeck(): Card[] {
    const deck: Card[] = [];
    const colors: CardColor[] = ['red', 'blue', 'green', 'yellow'];
    
    // For each color, add number cards (0-9)
    colors.forEach(color => {
      // Add one 0 card
      deck.push({
        id: `${color}_0_${Date.now()}_${Math.random()}`,
        color,
        type: 'number',
        value: '0'
      });
      
      // Add two of each 1-9 card
      for (let i = 1; i <= 9; i++) {
        const value = i.toString() as CardValue;
        
        deck.push({
          id: `${color}_${value}_1_${Date.now()}_${Math.random()}`,
          color,
          type: 'number',
          value
        });
        
        deck.push({
          id: `${color}_${value}_2_${Date.now()}_${Math.random()}`,
          color,
          type: 'number',
          value
        });
      }
      
      // Add special cards (Skip, Reverse, Draw Two)
      // Two of each per color
      ['skip', 'reverse', 'draw2'].forEach(specialType => {
        const type = specialType as CardType;
        const value = specialType as CardValue;
        
        deck.push({
          id: `${color}_${specialType}_1_${Date.now()}_${Math.random()}`,
          color,
          type,
          value
        });
        
        deck.push({
          id: `${color}_${specialType}_2_${Date.now()}_${Math.random()}`,
          color,
          type,
          value
        });
      });
    });
    
    // Add wild cards
    for (let i = 0; i < 4; i++) {
      deck.push({
        id: `wild_${i}_${Date.now()}_${Math.random()}`,
        color: 'wild',
        type: 'wild',
        value: 'wild'
      });
      
      deck.push({
        id: `wild4_${i}_${Date.now()}_${Math.random()}`,
        color: 'wild',
        type: 'wild4',
        value: 'wild4'
      });
    }
    
    return deck;
  }
  
  private shuffleDeck(deck: Card[]) {
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
  }
  
  public disconnect() {
    console.log('MockSocket disconnected');
    this.listeners = {};
  }
}

// Socket service
class SocketService {
  private socket: Socket | MockSocket;
  private static instance: SocketService;
  
  private constructor() {
    // For development, we use a mock socket
    // In production, you'd replace this with actual socket.io connection
    this.socket = new MockSocket();
    
    // Example of real socket.io connection
    // this.socket = io('your-socket-server-url', {
    //   transports: ['websocket'],
    //   autoConnect: true
    // });
  }
  
  public static getInstance(): SocketService {
    if (!SocketService.instance) {
      SocketService.instance = new SocketService();
    }
    
    return SocketService.instance;
  }
  
  public connect(): Promise<void> {
    return new Promise((resolve) => {
      this.socket.on('connect', () => {
        console.log('Socket connected');
        resolve();
      });
    });
  }
  
  public disconnect(): void {
    this.socket.disconnect();
  }
  
  public on(event: string, callback: (...args: any[]) => void): void {
    this.socket.on(event, callback);
  }
  
  public emit(event: string, data: any): void {
    this.socket.emit(event, data);
  }
  
  // Game specific methods
  public getRooms(): void {
    this.socket.emit('getRooms');
  }
  
  public createRoom(payload: CreateRoomPayload): void {
    this.socket.emit('createRoom', payload);
  }
  
  public joinRoom(payload: JoinRoomPayload): void {
    this.socket.emit('joinRoom', payload);
  }
  
  public leaveRoom(roomId: string, playerId: string): void {
    this.socket.emit('leaveRoom', { roomId, playerId });
  }
  
  public startGame(roomId: string): void {
    this.socket.emit('startGame', { roomId });
  }
  
  public playCard(payload: PlayCardPayload): void {
    this.socket.emit('playCard', payload);
  }
  
  public drawCard(roomId: string, playerId: string): void {
    this.socket.emit('drawCard', { roomId, playerId });
  }
  
  public sendChatMessage(payload: ChatMessagePayload): void {
    this.socket.emit('sendChatMessage', payload);
  }
}

export default SocketService.getInstance();
