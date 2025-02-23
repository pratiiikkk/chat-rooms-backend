import { WebSocket, WebSocketServer } from "ws";
import { randomBytes } from "crypto";
import { IncomingMessage } from "http";
const ALLOWED_ORIGINS = [   
  'https://your-production-domain.com' 
];
interface Room {
  id: string;
  clients: Map<string, WebSocketClient>;
  createdAt: number;
  userCount: number;
}

interface WebSocketClient {
  socket: WebSocket;
  name: string;
  userId: string;
  roomId: string | null;
}

interface Message {
  type: "create_room" | "join_room" | "send_message";
  roomId?: string;
  name?: string;
  content?: string;
  userId?: string;
}

class ChatServer {
  private rooms: Map<string, Room>;
  private clients: Map<WebSocket, WebSocketClient>;
  private readonly ROOM_CLEANUP_INTERVAL = 1000 * 60 * 60; 
  private readonly ROOM_MAX_AGE = 1000 * 60 * 60 * 24; 

  constructor(private wss: WebSocketServer) {
    this.rooms = new Map();
    this.clients = new Map();
    this.initialize();
  }

  private initialize(): void {
    this.wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
      const origin = request.headers.origin;
      
      if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
        console.log(`Rejected connection from origin: ${origin}`);
        socket.close(1008, 'Origin not allowed');
        return;
      }

      this.handleConnection(socket);
    });
    setInterval(this.cleanupStaleRooms.bind(this), this.ROOM_CLEANUP_INTERVAL);
  }

  private generateRoomId(): string {
    return randomBytes(3).toString("hex");
  }

  private handleConnection(socket: WebSocket): void {
    const client: WebSocketClient = {
      socket,
      name: "",
      userId: randomBytes(8).toString("hex"),
      roomId: null,
    };

    this.clients.set(socket, client);
    console.log(`Client connected: ${client.userId}`);
    this.sendToClient(client, {
      type: "system",
      userId: client.userId,
    });
    socket.on("message", (data: string) => this.handleMessage(client, data));
    socket.on("close", () => this.handleDisconnection(client));
    socket.on("error", (error) => this.handleError(client, error));
  }

  private handleMessage(client: WebSocketClient, data: string): void {
    let message: Message;

    try {
      message = JSON.parse(data);
    } catch (error) {
      this.sendError(client, "Invalid message format");
      return;
    }

    switch (message.type) {
      case "create_room":
        this.handleCreateRoom(client);
        break;
      case "join_room":
        this.handleJoinRoom(client, message);
        break;
      case "send_message":
        this.handleSendMessage(client, message);
        break;
      default:
        this.sendError(client, "Unknown message type");
    }
  }

  private handleCreateRoom(client: WebSocketClient): void {
    const roomId = this.generateRoomId();
    const room: Room = {
      id: roomId,
      clients: new Map(),
      createdAt: Date.now(),
      userCount: 0, 
    };

    this.rooms.set(roomId, room);
    this.sendToClient(client, {
      type: "room_created",
      roomId,
    });

    console.log(`Room created: ${roomId}`);
  }

  private handleJoinRoom(client: WebSocketClient, message: Message): void {
    const room = this.rooms.get(message.roomId!);

    if (!room) {
      this.sendError(client, "Room not found");
      return;
    }

    if (client.roomId) {
      this.leaveRoom(client);
    }

    client.name = message.name!;
    client.roomId = room.id;
    room.clients.set(client.userId, client);
    room.userCount++; // Increment user count

    this.sendToClient(client, {
      type: "room_joined",
      roomId: room.id,
      name: client.name,
      userCount: room.userCount, // Add user count to response
    });

    // Notify other clients in the room
    this.broadcastToRoom(
      room,
      {
        type: "user_joined",
        userId: client.userId,
        name: client.name,
        userCount: room.userCount, // Add user count to broadcast
      },
      client.userId
    );

    console.log(
      `Client ${client.userId} joined room: ${room.id} (Users: ${room.userCount})`
    );
  }
  private handleSendMessage(client: WebSocketClient, message: Message): void {
    if (!client.roomId) {
      this.sendError(client, "Not in a room");
      return;
    }

    const room = this.rooms.get(client.roomId);
    if (!room) {
      this.sendError(client, "Room not found");
      return;
    }

    this.broadcastToRoom(room, {
      type: "new_message",
      content: message.content,
      userId: client.userId,
      name: client.name,
    });

    console.log(`Message sent in room ${client.roomId} by ${client.name}`);
  }

  private handleDisconnection(client: WebSocketClient): void {
    if (client.roomId) {
      this.leaveRoom(client);
    }
    this.clients.delete(client.socket);
    console.log(`Client disconnected: ${client.userId}`);
  }

  private handleError(client: WebSocketClient, error: Error): void {
    console.error(`WebSocket error for client ${client.userId}:`, error);
    this.handleDisconnection(client);
  }

  private leaveRoom(client: WebSocketClient): void {
    const room = this.rooms.get(client.roomId!);
    if (room) {
      room.clients.delete(client.userId);
      room.userCount--; // Decrement user count

      // Notify other clients about the leave
      this.broadcastToRoom(room, {
        type: "user_left",
        userId: client.userId,
        name: client.name,
        userCount: room.userCount, // Add user count to broadcast
      });

      if (room.clients.size === 0) {
        this.rooms.delete(room.id);
        console.log(`Room deleted: ${room.id}`);
      }
    }
    client.roomId = null;
  }

  private sendToClient(client: WebSocketClient, message: any): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      client.socket.send(JSON.stringify(message));
    }
  }

  private broadcastToRoom(
    room: Room,
    message: any,
    excludeUserId?: string
  ): void {
    room.clients.forEach((client) => {
      if (!excludeUserId || client.userId !== excludeUserId) {
        this.sendToClient(client, message);
      }
    });
  }

  private sendError(client: WebSocketClient, message: string): void {
    this.sendToClient(client, {
      type: "error",
      content: message,
    });
  }

  private cleanupStaleRooms(): void {
    const now = Date.now();
    this.rooms.forEach((room) => {
      if (now - room.createdAt > this.ROOM_MAX_AGE) {
        room.clients.forEach((client) => this.leaveRoom(client));
        this.rooms.delete(room.id);
        console.log(`Stale room deleted: ${room.id}`);
      }
    });
  }
}


const wss = new WebSocketServer({ port: 8080 ,
  verifyClient: ({ origin }, callback) => {
    if (!origin || !ALLOWED_ORIGINS.includes(origin)) {
      console.log(`Rejected connection from origin: ${origin}`);
      callback(false);
      return;
    }
    callback(true);
  }
});

const chatServer = new ChatServer(wss);
