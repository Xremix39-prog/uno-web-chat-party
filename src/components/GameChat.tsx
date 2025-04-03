
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types/uno';
import { Send } from 'lucide-react';

interface GameChatProps {
  className?: string;
}

const GameChat: React.FC<GameChatProps> = ({ className }) => {
  const { gameState, sendChatMessage } = useGame();
  const [message, setMessage] = useState('');
  const [lastSentMessage, setLastSentMessage] = useState('');
  const [lastSentTime, setLastSentTime] = useState(0);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedMessage = message.trim();
    
    // Prevent empty messages
    if (!trimmedMessage) return;
    
    // Prevent duplicate messages within 3 seconds
    const currentTime = Date.now();
    if (trimmedMessage === lastSentMessage && currentTime - lastSentTime < 3000) {
      return;
    }
    
    sendChatMessage(trimmedMessage);
    setLastSentMessage(trimmedMessage);
    setLastSentTime(currentTime);
    setMessage('');
  };

  // Scroll to bottom whenever messages change
  useEffect(() => {
    if (scrollAreaRef.current) {
      const scrollContainer = scrollAreaRef.current.querySelector('[data-radix-scroll-area-viewport]');
      if (scrollContainer) {
        scrollContainer.scrollTop = scrollContainer.scrollHeight;
      }
    }
  }, [gameState.chatMessages]);

  const formatTime = (timestamp: number) => {
    const date = new Date(timestamp);
    return `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`;
  };

  return (
    <div className={`flex flex-col h-full bg-white/70 backdrop-blur-sm rounded-md shadow-md ${className}`}>
      <div className="p-3 border-b font-semibold text-lg bg-primary text-white rounded-t-md">
        Chat
      </div>
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
        {gameState.chatMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          <div className="space-y-3">
            {gameState.chatMessages.map((msg: ChatMessage) => (
              <div 
                key={msg.id} 
                className={`p-2 rounded-lg max-w-[80%] ${
                  msg.senderId === gameState.player?.id 
                    ? 'ml-auto bg-blue-500 text-white' 
                    : 'bg-gray-200'
                } animate-fade-in`}
              >
                <div className="text-xs font-semibold mb-1">
                  {msg.senderId === gameState.player?.id ? 'You' : msg.senderName}
                </div>
                <div>{msg.message}</div>
                <div className="text-xs opacity-70 text-right mt-1">
                  {formatTime(msg.timestamp)}
                </div>
              </div>
            ))}
          </div>
        )}
      </ScrollArea>
      
      <form onSubmit={handleSendMessage} className="p-3 border-t flex gap-2 bg-white/50">
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button type="submit" size="icon" disabled={!message.trim()}>
          <Send size={18} />
        </Button>
      </form>
    </div>
  );
};

export default GameChat;
