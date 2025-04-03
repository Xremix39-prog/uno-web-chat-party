
import React, { useState } from 'react';
import { useGame } from '@/context/GameContext';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, LogIn, ArrowLeft, Lock, Globe, KeyRound } from 'lucide-react';
import { useIsMobile } from '@/hooks/use-mobile';
import { Switch } from '@/components/ui/switch';
import { toast } from 'sonner';
import { useNavigate } from 'react-router-dom';

interface LobbyProps {
  isSinglePlayer?: boolean;
}

const Lobby: React.FC<LobbyProps> = ({ isSinglePlayer = false }) => {
  const { availableRooms, createRoom, joinRoom } = useGame();
  const [playerName, setPlayerName] = useState('');
  const [roomName, setRoomName] = useState('');
  const [isPrivateRoom, setIsPrivateRoom] = useState(false);
  const [roomCode, setRoomCode] = useState('');
  const [joinTab, setJoinTab] = useState<'public' | 'private'>('public');
  const isMobile = useIsMobile();
  const navigate = useNavigate();

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
      playerName: playerName.trim(),
      isPrivate: isPrivateRoom,
      isSinglePlayer
    });
  };

  const handleJoinRoom = (roomId: string, code?: string) => {
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    joinRoom({
      roomId,
      playerName: playerName.trim(),
      code
    });
  };

  const handleJoinPrivateRoom = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!playerName.trim()) {
      toast.error('Please enter your name');
      return;
    }
    
    if (!roomCode.trim()) {
      toast.error('Please enter a room code');
      return;
    }
    
    // Find room by code
    const room = availableRooms.find(r => r.code === roomCode.trim());
    
    if (!room) {
      toast.error('Room not found with this code');
      return;
    }
    
    joinRoom({
      roomId: room.id,
      playerName: playerName.trim(),
      code: roomCode.trim()
    });
  };

  const goBack = () => {
    navigate('/');
  };

  // Filter rooms based on game mode and visibility
  const publicRooms = availableRooms.filter(room => 
    !room.isPrivate && 
    (isSinglePlayer ? room.isSinglePlayer : !room.isSinglePlayer)
  );

  return (
    <div className="w-full max-w-4xl mx-auto p-4">
      <Button 
        variant="ghost" 
        className="mb-4 flex items-center gap-1 hover:bg-gray-100" 
        onClick={goBack}
      >
        <ArrowLeft size={16} />
        <span>Back to Home</span>
      </Button>

      <div className="text-center mb-8">
        <h1 className="text-4xl md:text-6xl font-bold mb-2 bg-gradient-to-r from-uno-red via-uno-blue to-uno-green bg-clip-text text-transparent">
          {isSinglePlayer ? 'Single Player' : 'Multiplayer'}
        </h1>
        <p className="text-lg text-gray-600">
          {isSinglePlayer 
            ? 'Create a room to play against AI opponents' 
            : 'Join or create a room to play with friends'}
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
      
      <Tabs defaultValue={isSinglePlayer ? "create" : "join"} className="w-full">
        <TabsList className="grid grid-cols-2 mb-4">
          {!isSinglePlayer && (
            <TabsTrigger value="join" className="flex items-center gap-2">
              <LogIn size={16} />
              <span>Join Room</span>
            </TabsTrigger>
          )}
          <TabsTrigger value="create" className="flex items-center gap-2" style={{gridColumn: isSinglePlayer ? 'span 2' : ''}}>
            <Plus size={16} />
            <span>Create Room</span>
          </TabsTrigger>
        </TabsList>
        
        {!isSinglePlayer && (
          <TabsContent value="join">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users size={20} />
                  <span>Join a Room</span>
                </CardTitle>
                <CardDescription>
                  Join a public room or enter a private room code
                </CardDescription>
                
                <div className="mt-4">
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger 
                      value="public" 
                      className="flex items-center gap-2"
                      onClick={() => setJoinTab('public')}
                    >
                      <Globe size={16} />
                      <span>Public Rooms</span>
                    </TabsTrigger>
                    <TabsTrigger 
                      value="private" 
                      className="flex items-center gap-2"
                      onClick={() => setJoinTab('private')}
                    >
                      <KeyRound size={16} />
                      <span>Private Room</span>
                    </TabsTrigger>
                  </TabsList>
                </div>
              </CardHeader>
              <CardContent>
                {joinTab === 'public' ? (
                  <ScrollArea className="h-[300px] pr-4">
                    {publicRooms.length === 0 ? (
                      <div className="text-center py-10 text-gray-500">
                        No public rooms available. Create one!
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {publicRooms.map((room) => (
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
                ) : (
                  <form onSubmit={handleJoinPrivateRoom} className="py-4">
                    <div className="space-y-4">
                      <div>
                        <Label htmlFor="roomCode">Room Code</Label>
                        <Input
                          id="roomCode"
                          placeholder="Enter the private room code"
                          value={roomCode}
                          onChange={(e) => setRoomCode(e.target.value)}
                          className="mt-1"
                        />
                      </div>
                      <Button type="submit" className="w-full">
                        <KeyRound size={16} className="mr-2" />
                        Join Private Room
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        )}
        
        <TabsContent value="create">
          <Card>
            <form onSubmit={handleCreateRoom}>
              <CardHeader>
                <CardTitle>Create a New Room</CardTitle>
                <CardDescription>
                  {isSinglePlayer 
                    ? 'Set up a room to play against AI opponents' 
                    : 'Set up a room for others to join'}
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
                  
                  {!isSinglePlayer && (
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Lock size={16} />
                        <Label htmlFor="privateRoom">Private Room</Label>
                      </div>
                      <Switch
                        id="privateRoom"
                        checked={isPrivateRoom}
                        onCheckedChange={setIsPrivateRoom}
                      />
                    </div>
                  )}
                  
                  {isPrivateRoom && (
                    <div className="rounded-lg border border-dashed p-3 text-sm">
                      <p className="flex items-center gap-2">
                        <KeyRound size={14} />
                        <span>A unique room code will be generated for your private room.</span>
                      </p>
                    </div>
                  )}
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
