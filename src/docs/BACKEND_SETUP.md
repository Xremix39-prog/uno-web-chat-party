
# UNO Game Backend Setup

This document explains how to set up and run the UNO game backend server.

## Prerequisites

- Node.js (v16 or higher)
- npm or yarn

## Installation

1. Navigate to the `backend` folder in the project directory:
```
cd backend
```

2. Install the dependencies:
```
npm install
```
or
```
yarn install
```

## Configuration

The server runs on port 3000 by default. You can change this by setting the `PORT` environment variable.

## Running the Server

Start the server with:
```
npm start
```
or
```
yarn start
```

The server will start on http://localhost:3000 (or the port you configured).

## Connecting the Frontend

The frontend will automatically connect to the backend at http://localhost:3000 unless you specify a different URL in the `.env.local` file:

```
VITE_BACKEND_URL=http://your-backend-url:port
```

## Development

If you want to run the server in development mode with automatic reloading:
```
npm run dev
```
or
```
yarn dev
```
