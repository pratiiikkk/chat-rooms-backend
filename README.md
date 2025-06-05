# Chat App Backend

A WebSocket-based real-time chat server built with Node.js and TypeScript. This backend provides the foundation for multi-room chat functionality with robust client management and message handling.

## Features

- 🚀 **Real-time Communication**: WebSocket-based for instant messaging
- 🏠 **Multi-room Support**: Create and join multiple chat rooms
- 👥 **Client Management**: Automatic client tracking and cleanup
- 🔒 **Origin Validation**: Configurable CORS protection
- ⚡ **Rate Limiting**: Protection against spam and abuse
- 🧹 **Auto Cleanup**: Automatic room cleanup for inactive rooms
- 📊 **Stats & Monitoring**: Built-in server statistics
- 🔧 **TypeScript**: Full type safety throughout the codebase

## Architecture

The backend follows a modular architecture with clear separation of concerns:

```
src/
├── index.ts              # Server entry point
├── config/               # Configuration management
├── handlers/             # Message handling logic
├── services/             # Core business logic
│   ├── ChatServer.ts     # Main server orchestrator
│   ├── ClientManager.ts  # Client lifecycle management
│   └── RoomManager.ts    # Room lifecycle management
├── types/                # TypeScript type definitions
└── utils/                # Utility functions
```

## Quick Start

### Prerequisites

- Node.js (v18 or higher)
- npm or yarn

### Installation

1. Clone the repository and navigate to the backend directory:

```bash
cd chat-app-backend
```

2. Install dependencies:

```bash
npm install
```

3. Start the development server:

```bash
npm run dev
```

The server will start on `http://localhost:8080` by default.

### Production Build

```bash
# Build the project
npm run build

# Start the production server
npm start
```

## Configuration

The server can be configured using environment variables:

### Server Configuration

- `PORT` - Server port (default: 8080)
- `HOST` - Server host (default: localhost)

### Security

- `ALLOWED_ORIGINS` - Comma-separated list of allowed origins (default: http://localhost:3000)

### Room Management

- `ROOM_CLEANUP_INTERVAL` - Room cleanup interval in milliseconds (default: 3600000 - 1 hour)
- `ROOM_MAX_AGE` - Maximum room age in milliseconds (default: 86400000 - 24 hours)
- `MAX_CLIENTS_PER_ROOM` - Maximum clients per room (default: 50)

### Rate Limiting

- `MAX_MESSAGES_PER_MINUTE` - Maximum messages per minute per client (default: 60)
- `RATE_LIMIT_WINDOW` - Rate limit window in milliseconds (default: 60000 - 1 minute)

### Logging

- `LOG_LEVEL` - Logging level: info, debug (default: info)
- `ENABLE_REQUEST_LOGGING` - Enable connection logging (default: false)

### Example .env file

```env
PORT=8080
HOST=localhost
ALLOWED_ORIGINS=http://localhost:3000,https://yourdomain.com
LOG_LEVEL=debug
ENABLE_REQUEST_LOGGING=true
```

## WebSocket API

### Client → Server Messages

#### Create Room

```json
{
  "type": "create_room"
}
```

#### Join Room

```json
{
  "type": "join_room",
  "roomId": "room-id",
  "name": "username"
}
```

#### Send Message

```json
{
  "type": "send_message",
  "content": "Hello, world!"
}
```

### Server → Client Messages

#### Room Created

```json
{
  "type": "room_created",
  "roomId": "generated-room-id"
}
```

#### Room Joined

```json
{
  "type": "room_joined",
  "roomId": "room-id",
  "name": "username",
  "userCount": 5
}
```

#### Message Received

```json
{
  "type": "message",
  "content": "Hello, world!",
  "sender": "username",
  "timestamp": 1672531200000
}
```

#### User Joined/Left

```json
{
  "type": "user_joined",
  "name": "username",
  "userCount": 6
}
```

```json
{
  "type": "user_left",
  "name": "username",
  "userCount": 5
}
```

#### Error Messages

```json
{
  "type": "error",
  "message": "Error description"
}
```

## Development

### Available Scripts

- `npm run dev` - Start development server with hot reload
- `npm run build` - Build for production
- `npm start` - Start production server
- `npm run clean` - Clean build directory
- `npm run type-check` - Run TypeScript type checking

### Code Structure

- **ChatServer**: Main orchestrator that handles WebSocket connections and coordinates other services
- **ClientManager**: Manages client lifecycle, connection state, and messaging
- **RoomManager**: Handles room creation, deletion, and client room assignments
- **MessageHandler**: Processes incoming messages and routes them appropriately

## Features in Detail

### Room Management

- Automatic room creation with unique IDs
- Configurable room capacity limits
- Automatic cleanup of empty rooms
- Room statistics and monitoring

### Client Management

- Unique client identification
- Connection state tracking
- Graceful disconnection handling
- Rate limiting per client

### Message Handling

- Type-safe message processing
- Broadcast messaging within rooms
- Error handling and validation
- Message history (if implemented)

## Security Features

- **Origin Validation**: Prevents unauthorized cross-origin requests
- **Rate Limiting**: Protects against message flooding
- **Input Validation**: Validates all incoming messages
- **Graceful Error Handling**: Prevents server crashes from malformed requests

## Monitoring & Stats

The server provides built-in statistics including:

- Active client count
- Room count and occupancy
- Message throughput
- Connection statistics

Enable debug logging to see periodic stats output:

```env
LOG_LEVEL=debug
```
