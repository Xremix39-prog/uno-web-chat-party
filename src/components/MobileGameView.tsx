
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GameRoom from './GameRoom';
import GameChat from './GameChat';
import { MessageSquare, PlayCircle } from 'lucide-react';
import { useGame } from '@/context/GameContext';
import { toast } from '@/hooks/use-toast';

const MobileGameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('game');
  const { gameState } = useGame();
  const [unreadMessages, setUnreadMessages] = useState(0);
  
  // Track unread messages when not on chat tab
  useEffect(() => {
    if (activeTab !== 'chat' && gameState.chatMessages.length > 0) {
      const currentCount = gameState.chatMessages.length;
      setUnreadMessages(prevCount => {
        const newMessages = currentCount - prevCount;
        // Show toast for new messages
        if (newMessages > 0 && prevCount > 0) {
          const lastMessage = gameState.chatMessages[gameState.chatMessages.length - 1];
          if (lastMessage.senderId !== gameState.player?.id) {
            toast({
              title: `Message from ${lastMessage.senderName}`,
              description: lastMessage.message.length > 30 
                ? `${lastMessage.message.substring(0, 30)}...` 
                : lastMessage.message,
              duration: 3000,
            });
          }
        }
        return currentCount;
      });
    } else if (activeTab === 'chat') {
      setUnreadMessages(gameState.chatMessages.length);
    }
  }, [activeTab, gameState.chatMessages, gameState.player?.id]);
  
  return (
    <div className="h-full flex flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsContent value="game" className="flex-1 p-0 m-0 pb-16"> {/* Added padding at bottom for fixed controls */}
          <GameRoom />
        </TabsContent>
        <TabsContent value="chat" className="flex-1 p-2 m-0 pb-16"> {/* Added padding at bottom for fixed controls */}
          <GameChat className="h-full" />
        </TabsContent>
        
        <TabsList className="mt-auto fixed bottom-0 left-0 right-0 grid grid-cols-2 z-50 mobile-fixed-controls">
          <TabsTrigger value="game" className="flex items-center justify-center gap-2 py-3">
            <PlayCircle size={20} />
            <span>Game</span>
            {gameState.player?.isCurrentTurn && (
              <span className="bg-yellow-400 text-black rounded-full w-3 h-3 animate-pulse"></span>
            )}
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center justify-center gap-2 py-3">
            <MessageSquare size={20} />
            <span>Chat</span>
            {activeTab !== 'chat' && gameState.chatMessages.length > unreadMessages && (
              <span className="bg-red-500 text-white rounded-full min-w-5 h-5 flex items-center justify-center text-xs px-1">
                {gameState.chatMessages.length - unreadMessages > 9 ? '9+' : gameState.chatMessages.length - unreadMessages}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default MobileGameView;
