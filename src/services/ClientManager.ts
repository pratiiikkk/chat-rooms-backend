import { WebSocket } from "ws";
import { WebSocketClient, OutgoingMessage } from "../types";
import { generateUserId } from "../utils";

export class ClientManager {
  private clients: Map<WebSocket, WebSocketClient> = new Map();

  createClient(socket: WebSocket): WebSocketClient {
    const client: WebSocketClient = {
      socket,
      name: "",
      userId: generateUserId(),
      roomId: null,
    };

    this.clients.set(socket, client);
    console.log(`Client connected: ${client.userId}`);
    return client;
  }

  getClient(socket: WebSocket): WebSocketClient | undefined {
    return this.clients.get(socket);
  }

  removeClient(socket: WebSocket): WebSocketClient | undefined {
    const client = this.clients.get(socket);
    if (client) {
      this.clients.delete(socket);
      console.log(`Client disconnected: ${client.userId}`);
    }
    return client;
  }

  
  sendToClient(client: WebSocketClient, message: OutgoingMessage): void {
    if (client.socket.readyState === WebSocket.OPEN) {
      try {
        client.socket.send(JSON.stringify(message));
      } catch (error) {
        console.error(
          `Failed to send message to client ${client.userId}:`,
          error
        );
      }
    }
  }

  
  sendToClients(
    clients: WebSocketClient[],
    message: OutgoingMessage,
    excludeUserId?: string
  ): void {
    clients.forEach((client) => {
      if (!excludeUserId || client.userId !== excludeUserId) {
        this.sendToClient(client, message);
      }
    });
  }

  
  sendError(client: WebSocketClient, errorMessage: string): void {
    this.sendToClient(client, {
      type: "error",
      content: errorMessage,
    });
  }

 
  getAllClients(): WebSocketClient[] {
    return Array.from(this.clients.values());
  }


  getClientStats() {
    return {
      totalConnections: this.clients.size,
      clientsInRooms: this.getAllClients().filter((client) => client.roomId)
        .length,
    };
  }
}
