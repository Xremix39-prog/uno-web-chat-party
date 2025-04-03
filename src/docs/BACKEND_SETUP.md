
# Backend WebSocket Setup

This application requires a WebSocket backend server to function properly. Follow these steps to connect to your backend:

## Configuration

1. Create a `.env.local` file in the root of your project (this file won't be committed to version control)
2. Add the following environment variable:

```
VITE_BACKEND_URL=http://your-backend-url:port
```

For example:
```
VITE_BACKEND_URL=http://localhost:3000
```

## Default Configuration

If no backend URL is provided, the application will default to:
```
http://localhost:3000
```

## Backend Implementation Requirements

Your backend should implement the following Socket.IO events:

- `getRooms`: Returns a list of available game rooms
- `createRoom`: Creates a new game room
- `joinRoom`: Joins an existing game room
- `leaveRoom`: Leaves a game room
- `startGame`: Starts a game in a room
- `playCard`: Plays a card from a player's hand
- `drawCard`: Draws a card from the deck
- `chatMessage`: Sends a chat message to a room

Refer to the TypeScript types in `src/types/uno.ts` for the expected data formats.
