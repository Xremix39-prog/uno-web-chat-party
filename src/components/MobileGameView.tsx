
import React, { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import GameRoom from './GameRoom';
import GameChat from './GameChat';
import { MessageSquare, PlayCircle } from 'lucide-react';
import { useGame } from '@/context/GameContext';

const MobileGameView: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('game');
  const { gameState, markChatMessagesAsRead } = useGame();
  const [unreadCount, setUnreadCount] = useState<number>(0);
  
  // Update unread count when messages change
  useEffect(() => {
    const unread = gameState.chatMessages.filter(msg => !msg.isRead).length;
    setUnreadCount(unread);
  }, [gameState.chatMessages]);
  
  // Mark messages as read when switching to chat tab
  useEffect(() => {
    if (activeTab === 'chat' && unreadCount > 0) {
      markChatMessagesAsRead();
      setUnreadCount(0);
    }
  }, [activeTab, unreadCount, markChatMessagesAsRead]);
  
  return (
    <div className="h-full flex flex-col">
      <Tabs 
        value={activeTab} 
        onValueChange={setActiveTab}
        className="flex-1 flex flex-col"
      >
        <TabsContent value="game" className="flex-1 p-0 m-0">
          <GameRoom />
        </TabsContent>
        <TabsContent value="chat" className="flex-1 p-2 m-0 pb-16">
          <GameChat className="h-full" />
        </TabsContent>
        
        <TabsList className="fixed bottom-0 left-0 right-0 z-50 grid grid-cols-2 border-t border-gray-200 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
          <TabsTrigger value="game" className="flex items-center justify-center gap-2 py-3">
            <PlayCircle size={16} />
            <span>Game</span>
          </TabsTrigger>
          <TabsTrigger value="chat" className="flex items-center justify-center gap-2 py-3">
            <MessageSquare size={16} />
            <span>Chat</span>
            {unreadCount > 0 && (
              <span className="bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs animate-pulse">
                {unreadCount > 9 ? '9+' : unreadCount}
              </span>
            )}
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
};

export default MobileGameView;
