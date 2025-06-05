import { WebSocket, WebSocketServer } from "ws";
import { IncomingMessage } from "http";
import { WebSocketClient } from "../types";
import { RoomManager } from "../services/RoomManager";
import { ClientManager } from "../services/ClientManager";
import { MessageHandler } from "../handlers/MessageHandler";
import config from "../config";

export class ChatServer {
  private roomManager: RoomManager;
  private clientManager: ClientManager;
  private messageHandler: MessageHandler;

  constructor(private wss: WebSocketServer) {
    this.roomManager = new RoomManager();
    this.clientManager = new ClientManager();
    this.messageHandler = new MessageHandler(
      this.roomManager,
      this.clientManager
    );

    this.initialize();
  }

 
  private initialize(): void {
    this.wss.on("connection", (socket: WebSocket, request: IncomingMessage) => {
      this.handleConnection(socket, request);
    });

  
    console.log(`Chat server initialized on port ${config.server.port}`);
    console.log(
      `Allowed origins: ${config.security.allowedOrigins.join(", ")}`
    );
  }

  
  private handleConnection(socket: WebSocket, request: IncomingMessage): void {
    const origin = request.headers.origin;

   
    if (config.logging.enableRequestLogging) {
      console.log(`New connection from origin: ${origin}`);
    }

    
    const client = this.clientManager.createClient(socket);

    
    this.clientManager.sendToClient(client, {
      type: "system",
      userId: client.userId,
    });

    socket.on("message", (data: string) => {
      this.handleMessage(client, data);
    });

    socket.on("close", () => {
      this.handleDisconnection(client);
    });

    socket.on("error", (error) => {
      this.handleError(client, error);
    });
  }

  
  private handleMessage(client: WebSocketClient, data: string): void {
    try {
      this.messageHandler.handleMessage(client, data);
    } catch (error) {
      console.error(`Error processing message from ${client.userId}:`, error);
      this.clientManager.sendError(client, "Failed to process message");
    }
  }


  private handleDisconnection(client: WebSocketClient): void {
    if (client.roomId) {
      const room = this.roomManager.getRoom(client.roomId);
      if (room) {
        this.messageHandler.leaveRoom(client, room);
      }
    }

    this.clientManager.removeClient(client.socket);
  }

  private handleError(client: WebSocketClient, error: Error): void {
    console.error(`WebSocket error for client ${client.userId}:`, error);
    this.handleDisconnection(client);
  }

  
  getStats() {
    return {
      ...this.roomManager.getRoomStats(),
      ...this.clientManager.getClientStats(),
      uptime: process.uptime(),
    };
  }

  
  async shutdown(): Promise<void> {
    console.log("Starting graceful shutdown...");

   
    this.clientManager.getAllClients().forEach((client) => {
      if (client.socket.readyState === WebSocket.OPEN) {
        client.socket.close(1001, "Server shutting down");
      }
    });

    
    this.roomManager.destroy();

    
    this.wss.close(() => {
      console.log("Chat server shut down complete");
    });
  }
}
