
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

class SocketService {
  private socket: Socket | null = null;
  private initialized: boolean = false;
  
  // Get the backend URL from environment or use a default
  private getBackendUrl(): string {
    // For development, default to localhost:3000 if not specified
    return import.meta.env.VITE_BACKEND_URL || 'http://localhost:3000';
  }
  
  public async connect(): Promise<void> {
    return new Promise((resolve, reject) => {
      try {
        const backendUrl = this.getBackendUrl();
        
        this.socket = io(backendUrl, {
          transports: ['websocket'],
          reconnection: true,
          reconnectionAttempts: 5,
          reconnectionDelay: 1000,
        });
        
        this.socket.on('connect', () => {
          console.log('Connected to real socket server');
          this.initialized = true;
          resolve();
        });
        
        this.socket.on('connect_error', (error) => {
          console.error('Connection error:', error);
          reject(error);
        });
        
      } catch (error) {
        console.error('Socket initialization error:', error);
        reject(error);
      }
    });
  }
  
  public isConnected(): boolean {
    return this.initialized && this.socket?.connected || false;
  }
  
  public disconnect(): void {
    if (this.socket) {
      this.socket.disconnect();
      this.initialized = false;
    }
  }
  
  public on(event: string, callback: (...args: any[]) => void): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.on(event, callback);
  }
  
  // Game-related methods
  
  public getRooms(): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.emit('getRooms');
  }
  
  public createRoom(payload: CreateRoomPayload): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.emit('createRoom', payload);
  }
  
  public joinRoom(payload: JoinRoomPayload): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.emit('joinRoom', payload);
  }
  
  public leaveRoom(roomId: string, playerId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.emit('leaveRoom', { roomId, playerId });
  }
  
  public startGame(roomId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.emit('startGame', { roomId });
  }
  
  public playCard(payload: PlayCardPayload): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.emit('playCard', payload);
  }
  
  public drawCard(roomId: string, playerId: string): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.emit('drawCard', { roomId, playerId });
  }
  
  public sendChatMessage(payload: ChatMessagePayload): void {
    if (!this.socket) {
      throw new Error('Socket not initialized. Call connect() first.');
    }
    this.socket.emit('chatMessage', payload);
  }
}

// Export a singleton instance
const socketService = new SocketService();
export default socketService;
