
# UNO Game Backend

This is the backend server for the UNO card game. It handles game logic, room management, and real-time communication with clients using Socket.IO.

## Features

- Create and join game rooms
- Play UNO with 2-4 players
- Real-time game updates
- In-game chat

## Installation

1. Install dependencies:
```
npm install
```

2. Start the server:
```
npm start
```

For development with auto-reload:
```
npm run dev
```

## Game Rules

- Each player starts with 7 cards
- Players take turns playing cards that match the current card by color or value
- Special cards:
  - Skip: Skips the next player's turn
  - Reverse: Reverses the direction of play
  - Draw 2: Next player draws 2 cards and loses their turn
  - Wild: Change the color of play
  - Wild Draw 4: Change the color of play and next player draws 4 cards

## API Documentation

The server uses Socket.IO for real-time communication. See the main documentation for a list of available events and payloads.
