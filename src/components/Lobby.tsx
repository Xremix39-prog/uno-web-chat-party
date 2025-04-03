
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, LogIn } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { toast } from 'sonner';

const Lobby: React.FC = () => {
  const { availableRooms, createRoom, joinRoom } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const isMobile = useIsMobile();

  const handleCreateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!roomName.trim()) {
      toast.error('Please enter a room name');
      return;
    }
    
    createRoom({
      roomName: roomName.trim(),
      playerName: playerName.trim()
    });
  };

  const handleJoinRoom = (roomId: string) => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    joinRoom({
      roomId,
      playerName: playerName.trim()
    });
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-uno-red via-uno-blue to-uno-green bg-clip-text text-transparent">
          UNO Online
        </h1>
        <p className="text-lg text-gray-600">
          Join or create a room to start playing!
        </p>
      </div>
      
      <div className="mb-6">
        <Label htmlFor="playerName">Your Name</Label>
        <Input
          id="playerName"
          placeholder="Enter your name"
          value={playerName}
          onChange={(e) => setPlayerName(e.target.value)}
          className="mt-1"
        />
      </div>
      
      <Tabs defaultValue="join" className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          <TabsTrigger value="join" className="flex items-center gap-2">
            <LogIn size={16} />
            <span>Join Room</span>
          </TabsTrigger>
          <TabsTrigger value="create" className="flex items-center gap-2">
            <Plus size={16} />
            <span>Create Room</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="join">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users size={20} />
                <span>Available Rooms</span>
              </CardTitle>
              <CardDescription>
                Select a room to join the game
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[300px] pr-4">
                {availableRooms.length === 0 ? (
                  <div className="text-center py-10 text-gray-500">
                    No rooms available. Create one!
                  </div>
                ) : (
                  <div className="space-y-4">
                    {availableRooms.map((room) => (
                      <div
                        key={room.id}
                        className="border rounded-lg p-4 flex justify-between items-center"
                      >
                        <div>
                          <h3 className="font-medium">{room.name}</h3>
                          <p className="text-sm text-gray-500">
                            {room.players.length} / 4 players
                          </p>
                          <p className="text-xs text-gray-400">
                            Status: {room.status === 'waiting' ? 'Waiting for players' : 'Game in progress'}
                          </p>
                        </div>
                        
                        <Button
                          onClick={() => handleJoinRoom(room.id)}
                          disabled={room.status !== 'waiting' || room.players.length >= 4}
                          size={isMobile ? "sm" : "default"}
                        >
                          Join
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="create">
          <Card>
            <form onSubmit={handleCreateRoom}>
              <CardHeader>
                <CardTitle>Create a New Room</CardTitle>
                <CardDescription>
                  Set up a room for others to join
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="roomName">Room Name</Label>
                    <Input
                      id="roomName"
                      placeholder="Enter room name"
                      value={roomName}
                      onChange={(e) => setRoomName(e.target.value)}
                      className="mt-1"
                    />
                  </div>
                </div>
              </CardContent>
              <CardFooter>
                <Button type="submit" className="w-full">
                  Create Room
                </Button>
              </CardFooter>
            </form>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default Lobby;
