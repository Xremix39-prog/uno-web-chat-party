
import React, { useState, useRef, useEffect } from 'react';
import { useGame } from '@/context/GameContext';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ChatMessage } from '@/types/uno';
import { Send } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';

interface GameChatProps {
  className?: string;
}

const GameChat: React.FC<GameChatProps> = ({ className }) => {
  const { gameState, sendChatMessage } = useGame();
  const [message, setMessage] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const scrollAreaRef = useRef<HTMLDivElement>(null);
  const isMobile = useIsMobile();
  
  const handleSendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (message.trim() && !isSubmitting) {
      setIsSubmitting(true);
      sendChatMessage(message);
      setMessage('');
      
      // Prevent duplicate submissions by disabling for a short period
      setTimeout(() => {
        setIsSubmitting(false);
      }, 500);
    }
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

  // Create an array of deduplicated messages
  const deduplicatedMessages = gameState.chatMessages.reduce<ChatMessage[]>((acc, current) => {
    // Check if we already have a message with same sender, text and within 2 seconds
    const isDuplicate = acc.some(
      msg => 
        msg.senderId === current.senderId && 
        msg.message === current.message && 
        Math.abs(msg.timestamp - current.timestamp) < 2000
    );
    
    if (!isDuplicate) {
      acc.push(current);
    }
    
    return acc;
  }, []);

  return (
    <div className={`flex flex-col h-full bg-white/50 backdrop-blur-sm rounded-md shadow-md ${className}`}>
      <div className="p-3 border-b font-semibold text-lg">
        Chat
      </div>
      
      <ScrollArea ref={scrollAreaRef} className="flex-1 p-3">
        {deduplicatedMessages.length === 0 ? (
          <div className="text-center text-gray-500 py-10">
            No messages yet. Be the first to say hello!
          </div>
        ) : (
          <div className="space-y-3">
            {deduplicatedMessages.map((msg: ChatMessage) => (
              <div 
                key={msg.id} 
                className={`p-2 rounded-lg max-w-[80%] animate-fade-in ${
                  msg.senderId === gameState.player?.id 
                    ? 'ml-auto bg-blue-500 text-white' 
                    : 'bg-gray-200'
                }`}
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
      
      <form 
        onSubmit={handleSendMessage} 
        className={`p-3 border-t flex gap-2 ${isMobile ? 'sticky bottom-0 bg-white z-10' : ''}`}
      >
        <Input
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
          className="flex-1"
        />
        <Button 
          type="submit" 
          size="icon" 
          disabled={!message.trim() || isSubmitting}
          className="transition-all"
        >
          <Send size={18} className={isSubmitting ? "animate-pulse" : ""} />
        </Button>
      </form>
    </div>
  );
};

export default GameChat;
