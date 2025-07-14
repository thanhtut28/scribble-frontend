# Dootell - Multiplayer Scribble Game

A real-time multiplayer drawing and guessing game built with React (Next.js) frontend and NestJS backend. Players can create private rooms, draw, and guess words in an engaging social gaming experience.

![Gameplay Demo](./public/gameplay_demo.gif)

## ✨ Features

- 🎨 **Real-time Drawing**: Collaborative canvas with live stroke synchronization
- 🏠 **Private Room System**: Create and join password-protected game rooms
- 👥 **Multiplayer Support**: Up to 8 players per room
- 🎯 **Word Guessing Game**: 8 rounds with 3 random words per round
- 💬 **Live Chat**: Real-time messaging with correct answer highlighting
- 🏆 **Scoring System**: Points based on answer speed and accuracy
- 🔐 **JWT Authentication**: Secure user authentication with refresh tokens
- 📱 **Responsive Design**: Modern UI that works on all devices

## 🎮 How to Play

1. **Create or Join a Room**: Host a new game or join an existing room with a room code
2. **Take Turns Drawing**: Each round, a random player is chosen to draw one of three given words
3. **Guess the Word**: Other players type their guesses in the chat
4. **Score Points**: Faster correct guesses earn more points
5. **Win the Game**: Player with the highest total score after 8 rounds wins!

## 🛠 Tech Stack

### Frontend

- **Next.js 14** - React framework with App Router
- **TypeScript** - Type safety and better developer experience
- **Tailwind CSS** - Utility-first CSS framework
- **Socket.io Client** - Real-time communication
- **React Query** - Data fetching and state management
- **React Hook Form** - Form handling with validation
- **Zustand** - State management

### Backend

- **NestJS** - Progressive Node.js framework
- **Socket.io** - WebSocket communication
- **JWT** - Authentication and authorization
- **TypeScript** - Full-stack type safety

## 🔗 Related Repositories

- **Backend**: [@thanhtut28/scribble-backend](https://github.com/thanhtut28/scribble-backend) - NestJS backend server with Socket.io, Prisma, and JWT authentication

## 🚀 Getting Started

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository

```bash
git clone https://github.com/your-username/dootell.git
cd dootell
```

2. Install dependencies

```bash
npm install
```

3. Set up environment variables

```bash
cp .env.example .env.local
# Edit .env.local with your configuration
```

4. Start the development server

```bash
npm run dev
```

5. Open [http://localhost:3000](http://localhost:3000) in your browser

## 🏗 Project Structure

```
dootell/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── (auth)/            # Authentication pages
│   │   └── (room-system)/     # Game room pages
│   ├── components/            # Reusable UI components
│   │   ├── auth/              # Authentication components
│   │   ├── chat-room/         # Chat functionality
│   │   ├── drawing-board/     # Canvas and drawing tools
│   │   └── ui/                # Base UI components
│   ├── hooks/                 # Custom React hooks
│   ├── lib/                   # Utilities and configurations
│   │   ├── providers/         # Context providers
│   │   ├── services/          # API services
│   │   └── types/             # TypeScript type definitions
│   └── schema/                # Form validation schemas
├── public/                    # Static assets
└── README.md
```

## 🔌 WebSocket API

### Room Events

| Event        | Description                 | Payload                                                 |
| ------------ | --------------------------- | ------------------------------------------------------- |
| `createRoom` | Create a new game room      | `{ name, maxPlayers?, rounds?, isPrivate?, password? }` |
| `joinRoom`   | Join an existing room       | `{ roomId, password? }`                                 |
| `leaveRoom`  | Leave the current room      | `roomId`                                                |
| `getRooms`   | Get list of available rooms | -                                                       |

### Game Events

| Event         | Description              | Payload                  |
| ------------- | ------------------------ | ------------------------ |
| `startGame`   | Start the game in a room | `roomId`                 |
| `drawStroke`  | Send drawing data        | `{ roomId, strokeData }` |
| `sendMessage` | Send chat message        | `{ roomId, message }`    |
| `selectWord`  | Choose word to draw      | `{ roomId, wordIndex }`  |

## 🔐 Authentication

The application uses JWT-based authentication with access and refresh tokens:

- **Signup/Login**: Get access and refresh tokens
- **Cookie Storage**: Tokens stored securely in HTTP-only cookies
- **Auto Refresh**: Automatic token renewal when expired
- **Protected Routes**: Middleware-based route protection

### Authentication Endpoints

- `POST /auth/signup` - Register new user
- `POST /auth/signin` - Login existing user
- `POST /auth/refresh` - Refresh access token
- `GET /auth/me` - Get current user profile

## 🎯 Game Logic

### Room System

- Private rooms with optional password protection
- Maximum 8 players per room
- Configurable number of rounds (default: 8)
- Automatic owner reassignment when host leaves

### Gameplay Flow

1. Host starts the game
2. Random player selection for each round
3. Drawer picks from 3 random words
4. Real-time canvas synchronization
5. Chat-based word guessing
6. Speed-based scoring system
7. Winner declaration after all rounds

### Drawing Features

- Real-time stroke synchronization
- Color picker and brush size selection
- Drawing tools (pen, eraser)
- Canvas clear functionality
- Read-only mode for non-drawers

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📝 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🎨 Screenshots

_Add more screenshots of your application here_

## 🔮 Future Features

- [ ] Game replay system
- [ ] User statistics and achievements
- [ ] Custom word lists
- [ ] Voice chat integration
- [ ] Mobile app (React Native)
- [ ] Tournament mode
- [ ] Player profiles and avatars

---

Built with ❤️ by [Your Name](https://github.com/your-username)
