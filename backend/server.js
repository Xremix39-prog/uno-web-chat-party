
// The server implementation is quite long, but we need to update it to support the new features
// We'll focus on the key changes needed:

const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
const { v4: uuidv4 } = require('uuid');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

// Game state
const rooms = new Map();
const players = new Map();

// Helper to generate a room code
function generateRoomCode() {
  return Math.random().toString(36).substr(2, 6).toUpperCase();
}

// Card definitions
const colors = ['red', 'blue', 'green', 'yellow'];
const types = {
  number: ['0', '1', '2', '3', '4', '5', '6', '7', '8', '9'],
  action: ['skip', 'reverse', 'draw2'],
  wild: ['wild', 'wild4']
};

// Helper functions
function createDeck() {
  const deck = [];
  
  // Add numbered cards
  colors.forEach(color => {
    // One 0 card per color
    deck.push({ id: uuidv4(), color, type: 'number', value: '0' });
    
    // Two of each 1-9, skip, reverse, draw2
    ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'skip', 'reverse', 'draw2'].forEach(value => {
      const type = ['skip', 'reverse', 'draw2'].includes(value) ? value : 'number';
      deck.push({ id: uuidv4(), color, type, value });
      deck.push({ id: uuidv4(), color, type, value });
    });
  });
  
  // Add wild cards (4 of each)
  for (let i = 0; i < 4; i++) {
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild', value: 'wild' });
    deck.push({ id: uuidv4(), color: 'wild', type: 'wild4', value: 'wild4' });
  }
  
  return shuffleDeck(deck);
}

function shuffleDeck(deck) {
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

function dealCards(deck, numPlayers) {
  const hands = Array(numPlayers).fill().map(() => []);
  
  // Each player gets 7 cards
  for (let i = 0; i < 7; i++) {
    for (let j = 0; j < numPlayers; j++) {
      hands[j].push(deck.pop());
    }
  }
  
  return hands;
}

// Find a card that isn't wild for the starting card
function getStartingCard(deck) {
  for (let i = 0; i < deck.length; i++) {
    if (deck[i].color !== 'wild') {
      return deck.splice(i, 1)[0];
    }
  }
  return deck.pop(); // Fallback if somehow all cards are wild
}

function canPlayCard(card, currentCard) {
  // Wild cards can always be played
  if (card.color === 'wild') return true;
  
  // Match color or value
  return card.color === currentCard.color || card.value === currentCard.value;
}

function getNextPlayerIndex(roomId) {
  const room = rooms.get(roomId);
  const { currentPlayerIndex, players, direction } = room;
  
  if (direction === 'clockwise') {
    return (currentPlayerIndex + 1) % players.length;
  } else {
    return (currentPlayerIndex - 1 + players.length) % players.length;
  }
}

// Socket.IO event handlers
io.on('connection', (socket) => {
  console.log('User connected:', socket.id);
  
  // Get available rooms
  socket.on('getRooms', () => {
    const roomsList = Array.from(rooms.values()).map(room => ({
      id: room.id,
      name: room.name,
      players: room.players.map(p => ({ id: p.id, name: p.name, cards: [], isHost: p.isHost, isCurrentTurn: p.id === room.players[room.currentPlayerIndex]?.id })),
      status: room.status,
      currentPlayerId: room.players[room.currentPlayerIndex]?.id || null,
      isPrivate: room.isPrivate,
      code: room.isPrivate ? room.code : undefined,
      isSinglePlayer: room.isSinglePlayer,
      turnCount: room.turnCount || 0,
      deckShuffleCount: room.deckShuffleCount || 0
    }));
    
    socket.emit('rooms', roomsList);
  });
  
  // Create a new room
  socket.on('createRoom', ({ roomName, playerName, isPrivate = false, isSinglePlayer = false }) => {
    const roomId = uuidv4();
    const playerId = socket.id;
    
    const player = {
      id: playerId,
      name: playerName,
      cards: [],
      isHost: true,
      socketId: socket.id
    };
    
    const room = {
      id: roomId,
      name: roomName,
      players: [player],
      status: 'waiting',
      currentPlayerIndex: 0,
      direction: 'clockwise',
      drawPile: [],
      discardPile: [],
      currentCard: null,
      messages: [],
      isPrivate: isPrivate,
      code: isPrivate ? generateRoomCode() : undefined,
      isSinglePlayer: isSinglePlayer,
      turnCount: 0,
      startTime: null,
      deckShuffleCount: 0,
      winnerName: null
    };
    
    rooms.set(roomId, room);
    players.set(playerId, { roomId });
    
    socket.join(roomId);
    
    // Broadcast updated room list
    io.emit('rooms', Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      players: r.players.map(p => ({ id: p.id, name: p.name, cards: [], isHost: p.isHost, isCurrentTurn: p.id === r.players[r.currentPlayerIndex]?.id })),
      status: r.status,
      currentPlayerId: r.players[r.currentPlayerIndex]?.id || null,
      isPrivate: r.isPrivate,
      code: undefined, // Don't broadcast private codes
      isSinglePlayer: r.isSinglePlayer,
      turnCount: r.turnCount || 0,
      deckShuffleCount: r.deckShuffleCount || 0
    })));
    
    // Send room created event to the creator
    socket.emit('roomCreated', {
      room: {
        id: room.id,
        name: room.name,
        players: room.players.map(p => ({ id: p.id, name: p.name, cards: p.cards, isHost: p.isHost, isCurrentTurn: room.currentPlayerIndex === room.players.indexOf(p) })),
        status: room.status,
        currentPlayerId: room.players[room.currentPlayerIndex]?.id || null,
        currentCard: room.currentCard,
        direction: room.direction,
        drawPile: [],
        discardPile: [],
        isPrivate: room.isPrivate,
        code: room.code,
        isSinglePlayer: room.isSinglePlayer,
        turnCount: room.turnCount,
        deckShuffleCount: room.deckShuffleCount,
        winnerName: null
      },
      player
    });
    
    console.log(`Room created: ${roomName} (${roomId}) by ${playerName} - ${isPrivate ? 'Private' : 'Public'}`);
  });
  
  // Join an existing room
  socket.on('joinRoom', ({ roomId, playerName, code }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }
    
    if (room.status !== 'waiting') {
      return socket.emit('error', { message: 'Game already in progress' });
    }
    
    if (room.players.length >= 4) {
      return socket.emit('error', { message: 'Room is full' });
    }
    
    // Check room code if it's private
    if (room.isPrivate && room.code !== code) {
      return socket.emit('error', { message: 'Invalid room code' });
    }
    
    const playerId = socket.id;
    
    const player = {
      id: playerId,
      name: playerName,
      cards: [],
      isHost: false,
      socketId: socket.id
    };
    
    room.players.push(player);
    players.set(playerId, { roomId });
    
    socket.join(roomId);
    
    // Broadcast updated room
    io.to(roomId).emit('roomUpdated', {
      id: room.id,
      name: room.name,
      players: room.players.map(p => ({ id: p.id, name: p.name, cards: [], isHost: p.isHost, isCurrentTurn: room.currentPlayerIndex === room.players.indexOf(p) })),
      status: room.status,
      currentPlayerId: room.players[room.currentPlayerIndex]?.id || null,
      currentCard: room.currentCard,
      direction: room.direction,
      drawPile: [],
      discardPile: [],
      isPrivate: room.isPrivate,
      code: undefined, // Don't broadcast private codes in room updates
      isSinglePlayer: room.isSinglePlayer,
      turnCount: room.turnCount,
      deckShuffleCount: room.deckShuffleCount,
      winnerName: null
    });
    
    // Broadcast updated room list
    io.emit('rooms', Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      players: r.players.map(p => ({ id: p.id, name: p.name, cards: [], isHost: p.isHost, isCurrentTurn: p.id === r.players[r.currentPlayerIndex]?.id })),
      status: r.status,
      currentPlayerId: r.players[r.currentPlayerIndex]?.id || null,
      isPrivate: r.isPrivate,
      code: undefined, // Don't broadcast private codes
      isSinglePlayer: r.isSinglePlayer,
      turnCount: r.turnCount || 0,
      deckShuffleCount: r.deckShuffleCount || 0
    })));
    
    // Send room joined event to the joiner
    socket.emit('roomJoined', {
      room: {
        id: room.id,
        name: room.name,
        players: room.players.map(p => ({ id: p.id, name: p.name, cards: p.cards, isHost: p.isHost, isCurrentTurn: room.currentPlayerIndex === room.players.indexOf(p) })),
        status: room.status,
        currentPlayerId: room.players[room.currentPlayerIndex]?.id || null,
        currentCard: room.currentCard,
        direction: room.direction,
        drawPile: [],
        discardPile: [],
        isPrivate: room.isPrivate,
        code: room.code, // Send code only to the joiner
        isSinglePlayer: room.isSinglePlayer,
        turnCount: room.turnCount,
        deckShuffleCount: room.deckShuffleCount,
        winnerName: null
      },
      player
    });
    
    console.log(`Player ${playerName} joined room ${room.name} (${roomId})`);
  });
  
  // Start the game
  socket.on('startGame', ({ roomId }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }
    
    if (room.players.length < 2) {
      return socket.emit('error', { message: 'Need at least 2 players to start' });
    }
    
    // Check if requester is the host
    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1 || !room.players[playerIndex].isHost) {
      return socket.emit('error', { message: 'Only the host can start the game' });
    }
    
    // Initialize game
    room.drawPile = createDeck();
    const hands = dealCards(room.drawPile, room.players.length);
    
    // Assign hands to players
    room.players.forEach((player, i) => {
      player.cards = hands[i];
    });
    
    // Set initial card
    room.currentCard = getStartingCard(room.drawPile);
    room.discardPile = [room.currentCard];
    
    // Update game status
    room.status = 'playing';
    room.currentPlayerIndex = 0;
    room.startTime = Date.now();
    room.turnCount = 0;
    room.deckShuffleCount = 0;
    
    // Notify all players
    const gameStartedData = {
      id: room.id,
      name: room.name,
      players: room.players.map(p => ({
        id: p.id,
        name: p.name,
        cards: p.id === socket.id ? p.cards : [], // Only send cards to the requesting player
        isHost: p.isHost,
        isCurrentTurn: room.currentPlayerIndex === room.players.indexOf(p)
      })),
      status: room.status,
      currentPlayerId: room.players[room.currentPlayerIndex].id,
      currentCard: room.currentCard,
      direction: room.direction,
      drawPile: room.drawPile.map(() => ({})), // Just send the count
      discardPile: room.discardPile,
      isPrivate: room.isPrivate,
      code: undefined, // Don't broadcast private codes in game updates
      isSinglePlayer: room.isSinglePlayer,
      turnCount: room.turnCount,
      startTime: room.startTime,
      deckShuffleCount: room.deckShuffleCount,
      winnerName: null
    };
    
    // Send personalized game state to each player
    room.players.forEach(player => {
      const playerSocket = io.sockets.sockets.get(player.socketId);
      if (playerSocket) {
        const playerView = {
          ...gameStartedData,
          players: room.players.map(p => ({
            id: p.id,
            name: p.name,
            cards: p.id === player.id ? p.cards : [], // Only send cards to this specific player
            isHost: p.isHost,
            isCurrentTurn: room.currentPlayerIndex === room.players.indexOf(p)
          })),
          code: player.id === room.players[0].id ? room.code : undefined // Only send code to host
        };
        playerSocket.emit('gameStarted', playerView);
      }
    });
    
    // Update room list for lobby players
    io.emit('rooms', Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      players: r.players.map(p => ({ id: p.id, name: p.name, cards: [], isHost: p.isHost, isCurrentTurn: p.id === r.players[r.currentPlayerIndex]?.id })),
      status: r.status,
      currentPlayerId: r.players[r.currentPlayerIndex]?.id || null,
      isPrivate: r.isPrivate,
      code: undefined, // Don't broadcast private codes
      isSinglePlayer: r.isSinglePlayer,
      turnCount: r.turnCount || 0,
      deckShuffleCount: r.deckShuffleCount || 0
    })));
    
    console.log(`Game started in room ${room.name} (${roomId})`);
  });
  
  // Play cards
  socket.on('playCard', ({ roomId, playerId, cardIds, chosenColor }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }
    
    if (room.status !== 'playing') {
      return socket.emit('error', { message: 'Game not in progress' });
    }
    
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return socket.emit('error', { message: 'Player not found' });
    }
    
    if (playerIndex !== room.currentPlayerIndex) {
      return socket.emit('error', { message: 'Not your turn' });
    }
    
    // Process multiple cards if needed
    if (!Array.isArray(cardIds) || cardIds.length === 0) {
      return socket.emit('error', { message: 'No cards to play' });
    }
    
    const player = room.players[playerIndex];
    
    // For now, we'll just handle playing one card at a time
    // TODO: Implement playing multiple cards with the same value
    const cardId = cardIds[0];
    const cardIndex = player.cards.findIndex(c => c.id === cardId);
    
    if (cardIndex === -1) {
      return socket.emit('error', { message: 'Card not found in your hand' });
    }
    
    const card = player.cards[cardIndex];
    
    // Validate card can be played
    if (!canPlayCard(card, room.currentCard)) {
      return socket.emit('error', { message: 'Cannot play this card' });
    }
    
    // Handle wild cards
    if (card.type === 'wild' || card.type === 'wild4') {
      if (!chosenColor || !colors.includes(chosenColor)) {
        return socket.emit('error', { message: 'Must choose a valid color for wild card' });
      }
      
      // Create a new card with the chosen color
      card.color = chosenColor;
    }
    
    // Remove card from player's hand
    player.cards.splice(cardIndex, 1);
    
    // Add to discard pile
    room.discardPile.unshift(card);
    room.currentCard = card;
    
    // Increment turn count
    room.turnCount++;
    
    // Check for win condition
    if (player.cards.length === 0) {
      room.status = 'finished';
      room.winnerName = player.name;
      
      // Notify all players about game over
      io.to(roomId).emit('gameOver', { roomId, winnerName: player.name });
      
      // Update all players with final game state
      room.players.forEach(p => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket) {
          playerSocket.emit('roomUpdated', {
            id: room.id,
            name: room.name,
            players: room.players.map(pl => ({
              id: pl.id,
              name: pl.name,
              cards: pl.id === p.id ? pl.cards : [], // Only send cards to this specific player
              isHost: pl.isHost,
              isCurrentTurn: false
            })),
            status: room.status,
            currentPlayerId: null,
            currentCard: room.currentCard,
            direction: room.direction,
            drawPile: room.drawPile.map(() => ({})),
            discardPile: room.discardPile,
            isPrivate: room.isPrivate,
            code: p.isHost ? room.code : undefined,
            isSinglePlayer: room.isSinglePlayer,
            turnCount: room.turnCount,
            startTime: room.startTime,
            deckShuffleCount: room.deckShuffleCount,
            winnerName: player.name
          });
        }
      });
      
      return;
    }
    
    // Handle special cards
    let skipNextPlayer = false;
    
    switch (card.value) {
      case 'skip':
        skipNextPlayer = true;
        break;
      case 'reverse':
        room.direction = room.direction === 'clockwise' ? 'counter-clockwise' : 'clockwise';
        if (room.players.length === 2) {
          // In 2-player game, reverse acts like skip
          skipNextPlayer = true;
        }
        break;
      case 'draw2':
        // Next player draws 2 cards
        const nextPlayerIndex = getNextPlayerIndex(roomId);
        const nextPlayer = room.players[nextPlayerIndex];
        for (let i = 0; i < 2; i++) {
          if (room.drawPile.length === 0) {
            // Reshuffle discard pile if draw pile is empty
            const lastCard = room.discardPile.shift();
            room.drawPile = shuffleDeck(room.discardPile);
            room.discardPile = [lastCard];
            room.deckShuffleCount++;
          }
          if (room.drawPile.length > 0) {
            nextPlayer.cards.push(room.drawPile.pop());
          }
        }
        skipNextPlayer = true;
        break;
      case 'wild4':
        // Next player draws 4 cards
        const wild4NextIndex = getNextPlayerIndex(roomId);
        const wild4NextPlayer = room.players[wild4NextIndex];
        for (let i = 0; i < 4; i++) {
          if (room.drawPile.length === 0) {
            // Reshuffle discard pile if draw pile is empty
            const lastCard = room.discardPile.shift();
            room.drawPile = shuffleDeck(room.discardPile);
            room.discardPile = [lastCard];
            room.deckShuffleCount++;
          }
          if (room.drawPile.length > 0) {
            wild4NextPlayer.cards.push(room.drawPile.pop());
          }
        }
        skipNextPlayer = true;
        break;
    }
    
    // Move to next player
    if (skipNextPlayer) {
      // Skip the next player
      room.currentPlayerIndex = getNextPlayerIndex(roomId);
      room.currentPlayerIndex = getNextPlayerIndex(roomId);
    } else {
      // Move to next player normally
      room.currentPlayerIndex = getNextPlayerIndex(roomId);
    }
    
    // Notify all players
    io.to(roomId).emit('cardPlayed', { roomId, playerId, card });
    
    // Send updated game state to each player
    room.players.forEach(p => {
      const playerSocket = io.sockets.sockets.get(p.socketId);
      if (playerSocket) {
        playerSocket.emit('roomUpdated', {
          id: room.id,
          name: room.name,
          players: room.players.map(pl => ({
            id: pl.id,
            name: pl.name,
            cards: pl.id === p.id ? pl.cards : [], // Only send cards to this specific player
            isHost: pl.isHost,
            isCurrentTurn: room.currentPlayerIndex === room.players.indexOf(pl)
          })),
          status: room.status,
          currentPlayerId: room.players[room.currentPlayerIndex].id,
          currentCard: room.currentCard,
          direction: room.direction,
          drawPile: room.drawPile.map(() => ({})),
          discardPile: room.discardPile,
          isPrivate: room.isPrivate,
          code: p.isHost ? room.code : undefined,
          isSinglePlayer: room.isSinglePlayer,
          turnCount: room.turnCount,
          startTime: room.startTime,
          deckShuffleCount: room.deckShuffleCount,
          winnerName: null
        });
      }
    });
    
    console.log(`Player ${player.name} played a ${card.color} ${card.value} in room ${room.name}`);
  });
  
  // Draw a card
  socket.on('drawCard', ({ roomId, playerId }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }
    
    if (room.status !== 'playing') {
      return socket.emit('error', { message: 'Game not in progress' });
    }
    
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return socket.emit('error', { message: 'Player not found' });
    }
    
    if (playerIndex !== room.currentPlayerIndex) {
      return socket.emit('error', { message: 'Not your turn' });
    }
    
    const player = room.players[playerIndex];
    
    // Check if draw pile is empty
    if (room.drawPile.length === 0) {
      // Keep the top discard card
      const topCard = room.discardPile.shift();
      // Shuffle the rest of the discard pile to create a new draw pile
      room.drawPile = shuffleDeck(room.discardPile);
      room.discardPile = [topCard];
      room.deckShuffleCount++;
    }
    
    // Draw a card
    if (room.drawPile.length > 0) {
      const drawnCard = room.drawPile.pop();
      player.cards.push(drawnCard);
      
      // Increment turn count
      room.turnCount++;
      
      // Check if drawn card can be played
      const canPlay = canPlayCard(drawnCard, room.currentCard);
      
      // Move to next player if can't play
      if (!canPlay) {
        room.currentPlayerIndex = getNextPlayerIndex(roomId);
      }
      
      // Notify all players
      io.to(roomId).emit('cardDrawn', { roomId, playerId });
      
      // Send updated game state to each player
      room.players.forEach(p => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket) {
          playerSocket.emit('roomUpdated', {
            id: room.id,
            name: room.name,
            players: room.players.map(pl => ({
              id: pl.id,
              name: pl.name,
              cards: pl.id === p.id ? pl.cards : [], // Only send cards to this specific player
              isHost: pl.isHost,
              isCurrentTurn: !canPlay ? room.currentPlayerIndex === room.players.indexOf(pl) : room.currentPlayerIndex === room.players.indexOf(player)
            })),
            status: room.status,
            currentPlayerId: !canPlay ? room.players[room.currentPlayerIndex].id : player.id,
            currentCard: room.currentCard,
            direction: room.direction,
            drawPile: room.drawPile.map(() => ({})),
            discardPile: room.discardPile,
            isPrivate: room.isPrivate,
            code: p.isHost ? room.code : undefined,
            isSinglePlayer: room.isSinglePlayer,
            turnCount: room.turnCount,
            startTime: room.startTime,
            deckShuffleCount: room.deckShuffleCount,
            winnerName: null
          });
        }
      });
      
      console.log(`Player ${player.name} drew a card in room ${room.name}`);
    } else {
      socket.emit('error', { message: 'No cards left to draw' });
    }
  });
  
  // Send chat message
  socket.on('chatMessage', ({ roomId, message }) => {
    const room = rooms.get(roomId);
    
    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }
    
    const playerIndex = room.players.findIndex(p => p.socketId === socket.id);
    if (playerIndex === -1) {
      return socket.emit('error', { message: 'Player not found' });
    }
    
    const player = room.players[playerIndex];
    
    // Prevent chat spam - check if last message from this player is the same
    if (room.messages && room.messages.length > 0) {
      const lastMessage = room.messages[room.messages.length - 1];
      if (lastMessage.senderId === player.id && 
          lastMessage.message === message && 
          Date.now() - lastMessage.timestamp < 5000) {
        return; // Ignore duplicate message within 5 seconds
      }
    }
    
    const chatMessage = {
      id: `${roomId}_${uuidv4()}`,
      senderId: player.id,
      senderName: player.name,
      message,
      timestamp: Date.now(),
      isRead: false
    };
    
    // Store message in room
    if (!room.messages) room.messages = [];
    room.messages.push(chatMessage);
    
    // Send to all players in the room
    io.to(roomId).emit('chatMessage', chatMessage);
    
    console.log(`Chat in room ${room.name}: ${player.name}: ${message}`);
  });
  
  // Handle reconnection
  socket.on('reconnect', ({ playerId }) => {
    // Check if player exists in players map
    const playerInfo = players.get(playerId);
    if (!playerInfo) {
      return socket.emit('error', { message: 'Player not found' });
    }
    
    const roomId = playerInfo.roomId;
    const room = rooms.get(roomId);
    
    if (!room) {
      return socket.emit('error', { message: 'Room not found' });
    }
    
    // Find player in room
    const playerIndex = room.players.findIndex(p => p.id === playerId);
    if (playerIndex === -1) {
      return socket.emit('error', { message: 'Player not found in room' });
    }
    
    // Update player's socket ID
    const player = room.players[playerIndex];
    player.socketId = socket.id;
    
    // Join room
    socket.join(roomId);
    
    // Update player in players map
    players.set(playerId, { roomId });
    
    // Send player and room data
    socket.emit('reconnected', {
      room: {
        id: room.id,
        name: room.name,
        players: room.players.map(p => ({
          id: p.id,
          name: p.name,
          cards: p.id === playerId ? p.cards : [], // Only send cards to this player
          isHost: p.isHost,
          isCurrentTurn: room.currentPlayerIndex === room.players.indexOf(p)
        })),
        status: room.status,
        currentPlayerId: room.players[room.currentPlayerIndex]?.id || null,
        currentCard: room.currentCard,
        direction: room.direction,
        drawPile: room.drawPile?.map(() => ({})) || [],
        discardPile: room.discardPile || [],
        isPrivate: room.isPrivate,
        code: player.isHost ? room.code : undefined,
        isSinglePlayer: room.isSinglePlayer,
        turnCount: room.turnCount || 0,
        startTime: room.startTime,
        deckShuffleCount: room.deckShuffleCount || 0,
        winnerName: room.winnerName
      },
      player
    });
    
    console.log(`Player ${player.name} reconnected to room ${room.name}`);
  });
  
  // Leave room
  socket.on('leaveRoom', ({ roomId, playerId }) => {
    handlePlayerLeave(socket.id, roomId);
  });
  
  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    
    // Find player's room
    const playerInfo = players.get(socket.id);
    if (playerInfo) {
      handlePlayerLeave(socket.id, playerInfo.roomId);
    }
    
    players.delete(socket.id);
  });
  
  // Helper for handling player leaving
  function handlePlayerLeave(socketId, roomId) {
    const room = rooms.get(roomId);
    if (!room) return;
    
    const playerIndex = room.players.findIndex(p => p.socketId === socketId);
    if (playerIndex === -1) return;
    
    const player = room.players[playerIndex];
    const playerId = player.id;
    
    // Remove player from room
    room.players.splice(playerIndex, 1);
    
    // Notify others
    io.to(roomId).emit('roomLeft', { roomId, playerId });
    
    // Handle host leaving
    if (player.isHost && room.players.length > 0) {
      // Assign new host
      room.players[0].isHost = true;
    }
    
    // If game in progress, handle turn changes
    if (room.status === 'playing') {
      // If it was this player's turn, move to next player
      if (playerIndex === room.currentPlayerIndex) {
        if (room.direction === 'clockwise') {
          room.currentPlayerIndex = room.currentPlayerIndex % room.players.length;
        } else {
          room.currentPlayerIndex = (room.currentPlayerIndex - 1 + room.players.length) % room.players.length;
        }
      } else if (playerIndex < room.currentPlayerIndex) {
        // Adjust current player index if removed player was before current player
        room.currentPlayerIndex--;
      }
      
      // End game if only one player left
      if (room.players.length === 1) {
        room.status = 'finished';
        room.winnerName = room.players[0].name;
        io.to(roomId).emit('gameOver', { roomId, winnerName: room.players[0].name });
      }
    }
    
    // Update remaining players
    if (room.players.length > 0) {
      room.players.forEach(p => {
        const playerSocket = io.sockets.sockets.get(p.socketId);
        if (playerSocket) {
          playerSocket.emit('roomUpdated', {
            id: room.id,
            name: room.name,
            players: room.players.map(pl => ({
              id: pl.id,
              name: pl.name,
              cards: pl.id === p.id ? pl.cards : [], // Only send cards to this specific player
              isHost: pl.isHost,
              isCurrentTurn: room.currentPlayerIndex === room.players.indexOf(pl)
            })),
            status: room.status,
            currentPlayerId: room.status === 'playing' ? room.players[room.currentPlayerIndex].id : null,
            currentCard: room.currentCard,
            direction: room.direction,
            drawPile: room.drawPile ? room.drawPile.map(() => ({})) : [],
            discardPile: room.discardPile || [],
            isPrivate: room.isPrivate,
            code: p.isHost ? room.code : undefined,
            isSinglePlayer: room.isSinglePlayer,
            turnCount: room.turnCount || 0,
            startTime: room.startTime,
            deckShuffleCount: room.deckShuffleCount || 0,
            winnerName: room.winnerName
          });
        }
      });
    } else {
      // Delete empty room
      rooms.delete(roomId);
    }
    
    // Remove player from room
    socket.leave(roomId);
    
    // Update room list for lobby
    io.emit('rooms', Array.from(rooms.values()).map(r => ({
      id: r.id,
      name: r.name,
      players: r.players.map(p => ({ id: p.id, name: p.name, cards: [], isHost: p.isHost, isCurrentTurn: p.id === r.players[r.currentPlayerIndex]?.id })),
      status: r.status,
      currentPlayerId: r.status === 'playing' ? r.players[r.currentPlayerIndex]?.id : null,
      isPrivate: r.isPrivate,
      code: undefined, // Don't broadcast private codes
      isSinglePlayer: r.isSinglePlayer,
      turnCount: r.turnCount || 0,
      deckShuffleCount: r.deckShuffleCount || 0
    })));
    
    console.log(`Player ${player.name} left room ${room.name}`);
  }
});

// Default route
app.get('/', (req, res) => {
  res.send('UNO Game Server is running');
});

// Start server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
