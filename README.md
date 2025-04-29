## Game Logic

We want to build a scribble game with react frontend and nestjs backend. The flow is simple, players can play multiplayer online with private room system where users can host and join (maximum players 8 people). In each game, there will be 8 rounds and 3 random words will be generated on each round. Each round, a random player will be chosen to pick a word from 3 words and will draw that word on the canvas. The remaining players will guess that word in the chat box and players who guess correct word will be scored according to the speed of the answer. After all rounds, the game ends and the winner will be declared according to the total score.

### Websocket guide for the backend

# Room System with WebSockets

This module implements a real-time room system for the Scribble Game using Socket.io WebSockets.

## Features

- Create, join, and leave rooms in real-time
- Room password protection
- Room limits (max players, rounds)
- Automatic owner reassignment when the owner leaves
- Real-time notifications for room events

## WebSocket Events

### Client to Server Events

| Event        | Description                    | Payload                                                                                          |
| ------------ | ------------------------------ | ------------------------------------------------------------------------------------------------ |
| `createRoom` | Create a new room              | `{ name: string, maxPlayers?: number, rounds?: number, isPrivate?: boolean, password?: string }` |
| `joinRoom`   | Join an existing room          | `{ roomId: string, password?: string }`                                                          |
| `leaveRoom`  | Leave a room                   | `roomId: string`                                                                                 |
| `getRooms`   | Get all available rooms        | -                                                                                                |
| `getRoom`    | Get details of a specific room | `roomId: string`                                                                                 |

### Server to Client Events

| Event         | Description                | Payload                               |
| ------------- | -------------------------- | ------------------------------------- |
| `connected`   | Connection established     | `{ userId: string, message: string }` |
| `error`       | Error occurred             | `{ message: string }`                 |
| `rooms`       | List of available rooms    | `Room[]`                              |
| `roomCreated` | Room creation notification | `Room`                                |
| `userJoined`  | User joined a room         | `{ room: Room, userId: string }`      |
| `userLeft`    | User left a room           | `{ room: Room, userId: string }`      |

## Authentication

All WebSocket connections require a valid JWT token for authentication. The token can be provided in one of two ways:

1. In the connection handshake as an auth parameter:

```javascript
const socket = io("ws://localhost:4000/rooms", {
  auth: { token: "YOUR_JWT_TOKEN" },
});
```

2. In the connection handshake as an authorization header:

```javascript
const socket = io("ws://localhost:4000/rooms", {
  extraHeaders: { Authorization: "Bearer YOUR_JWT_TOKEN" },
});
```

## Connection Example

```javascript
const { io } = require("socket.io-client");

// Replace with your JWT token
const token = "YOUR_JWT_TOKEN_HERE";

// Connect to the WebSocket server
const socket = io("ws://localhost:4000/rooms", {
  transports: ["websocket"],
  auth: { token },
});

// Connection events
socket.on("connect", () => {
  console.log("Connected to server!");
});

socket.on("error", (error) => {
  console.error("Connection error:", error);
});

// Create a room
socket.emit(
  "createRoom",
  {
    name: "My Game Room",
    maxPlayers: 4,
    rounds: 5,
  },
  (response) => {
    if (response.error) {
      console.error("Error creating room:", response.error);
    } else {
      console.log("Room created successfully:", response);
    }
  },
);
```

See the `examples/websocket-client.js` file for a more complete example.

/// websocket-client.js

/\*\*

- Simple WebSocket client example for testing the Scribble Game WebSocket API
-
- Usage:
- 1.  Make sure you have a valid JWT token
- 2.  Update the token variable below with your token
- 3.  Run this script with Node.js: node websocket-client.js
      \*/

const { io } = require('socket.io-client');

// Replace with your JWT token
const token =
'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2MzdkODJmNS0zNmFiLTQ1NGItYWQyMC1mY2VkMTExNjdiMjYiLCJlbWFpbCI6InRoYUB0aGEuY29tIiwiaWF0IjoxNzQ1ODUxODgyLCJleHAiOjE3NDU4NTI3ODJ9.OvmfaCVONZaVTUya7JKn4ksrvDMX-v4tbPXw5jQmktU';

// Connect to the WebSocket server
const socket = io('ws://localhost:4000/rooms', {
transports: ['websocket'],
auth: { token },
});

// Connection events
socket.on('connect', () => {
console.log('Connected to server!');
});

socket.on('error', (error) => {
console.error('Connection error:', error);
});

socket.on('disconnect', (reason) => {
console.log('Disconnected:', reason);
});

socket.on('connected', (data) => {
console.log('Connection acknowledged:', data);
});

// Room events
socket.on('rooms', (rooms) => {
console.log('Available rooms:', rooms);
});

socket.on('roomCreated', (room) => {
console.log('Room created:', room);
});

socket.on('userJoined', (data) => {
console.log(`User ${data.userId} joined room:`, data.room);
});

socket.on('userLeft', (data) => {
console.log(`User ${data.userId} left room:`, data.room);
});

// Example: Create a room after 2 seconds
setTimeout(() => {
console.log('Creating a room...');
socket.emit(
'createRoom',
{
name: 'Test Room',
maxPlayers: 4,
rounds: 5,
},
(response) => {
if (response.error) {
console.error('Error creating room:', response.error);
} else {
console.log('Room created successfully:', response);
}
},
);
}, 2000);

// Example: Get all rooms after 4 seconds
setTimeout(() => {
console.log('Getting all rooms...');
socket.emit('getRooms', (response) => {
if (response.error) {
console.error('Error getting rooms:', response.error);
} else {
console.log('All rooms:', response);
}
});
}, 4000);

// Keep the connection alive
process.on('SIGINT', () => {
console.log('Disconnecting...');
socket.disconnect();
process.exit(0);
});

## Authentication Implementation

The project uses JWT-based authentication with access and refresh token strategy. The authentication flow includes:

1. User login or signup to get access and refresh tokens
2. Tokens are stored in cookies for better security
3. Automatic refresh of access tokens when they expire
4. Protected routes that require authentication

### Authentication Stack

- Axios for API requests with interceptors for token management
- React Query for data fetching and state management
- Cookie-based token storage with js-cookie
- Next.js middleware for route protection

### Authentication Endpoints

- `/auth/signup` - Register a new user
- `/auth/signin` - Login an existing user
- `/auth/refresh` - Refresh access token
- `/auth/me` - Get current user profile

## Checklist

[ ]: Todo, [x]: Completed

- [x] Authentication with JWT
- [ ] User Management (profile, stats)
- [x] Room System
  - [x] Create/Join/Leave Room API
  - [x] Room Settings (max players, rounds)
  - [x] Player Management in Rooms
- [ ] Game Logic
  - [ ] Word Generation/Selection
  - [ ] Turn Management
  - [ ] Game State Management
  - [ ] Scoring System
- [x] Real-time Communication
  - [x] Socket.io Integration
  - [ ] Drawing Data Transmission
  - [ ] Chat System
  - [ ] Game Event Broadcasting
- [ ] Data Persistence
  - [ ] Game History
  - [ ] User Statistics
- [ ] Testing & Deployment
