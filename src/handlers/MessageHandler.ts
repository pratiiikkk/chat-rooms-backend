import { WebSocketClient, IncomingMessage } from "../types";
import { RoomManager } from "../services/RoomManager";
import { ClientManager } from "../services/ClientManager";
import { isValidRoomId, isValidUserName, sanitizeMessage } from "../utils";

export class MessageHandler {
  constructor(
    private roomManager: RoomManager,
    private clientManager: ClientManager
  ) {}

 
  handleMessage(client: WebSocketClient, data: string): void {
    let message: IncomingMessage;

    try {
      message = JSON.parse(data);
    } catch (error) {
      this.clientManager.sendError(client, "Invalid message format");
      return;
    }

    if (!message.type || typeof message.type !== "string") {
      this.clientManager.sendError(client, "Invalid message type");
      return;
    }

    try {
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
          this.clientManager.sendError(client, "Unknown message type");
      }
    } catch (error) {
      console.error(`Error handling message from ${client.userId}:`, error);
      this.clientManager.sendError(
        client,
        error instanceof Error ? error.message : "Internal server error"
      );
    }
  }

  private handleCreateRoom(client: WebSocketClient): void {
    const room = this.roomManager.createRoom();

    this.clientManager.sendToClient(client, {
      type: "room_created",
      roomId: room.id,
    });
  }

  
  private handleJoinRoom(client: WebSocketClient, message: any): void {
    // Validate input
    if (!message.roomId || !isValidRoomId(message.roomId)) {
      this.clientManager.sendError(client, "Invalid room ID");
      return;
    }

    if (!message.name || !isValidUserName(message.name)) {
      this.clientManager.sendError(
        client,
        "Invalid username. Must be 1-50 characters."
      );
      return;
    }

    const room = this.roomManager.getRoom(message.roomId);
    if (!room) {
      this.clientManager.sendError(client, "Room not found");
      return;
    }

    if (client.roomId) {
      const currentRoom = this.roomManager.getRoom(client.roomId);
      if (currentRoom) {
        this.leaveRoom(client, currentRoom);
      }
    }

    try {
    
      client.name = sanitizeMessage(message.name);
      this.roomManager.addClientToRoom(room, client);

  
      this.clientManager.sendToClient(client, {
        type: "room_joined",
        roomId: room.id,
        name: client.name,
        userCount: room.userCount,
      });

     
      const otherClients = this.roomManager
        .getRoomClients(room.id)
        .filter((c) => c.userId !== client.userId);

      this.clientManager.sendToClients(otherClients, {
        type: "user_joined",
        userId: client.userId,
        name: client.name,
        userCount: room.userCount,
      });

      console.log(
        `Client ${client.userId} (${client.name}) joined room: ${room.id} (Users: ${room.userCount})`
      );
    } catch (error) {
      this.clientManager.sendError(
        client,
        error instanceof Error ? error.message : "Failed to join room"
      );
    }
  }

 
  private handleSendMessage(client: WebSocketClient, message: any): void {
    if (!client.roomId) {
      this.clientManager.sendError(client, "Not in a room");
      return;
    }

    if (!message.content || typeof message.content !== "string") {
      this.clientManager.sendError(client, "Invalid message content");
      return;
    }

    const room = this.roomManager.getRoom(client.roomId);
    if (!room) {
      this.clientManager.sendError(client, "Room not found");
      return;
    }

    try {
      const sanitizedContent = sanitizeMessage(message.content);
      if (!sanitizedContent.trim()) {
        this.clientManager.sendError(client, "Message cannot be empty");
        return;
      }

      // Broadcast message to all clients in the room
      const roomClients = this.roomManager.getRoomClients(room.id);
      this.clientManager.sendToClients(roomClients, {
        type: "new_message",
        content: sanitizedContent,
        userId: client.userId,
        name: client.name,
      });

      console.log(
        `Message sent in room ${client.roomId} by ${
          client.name
        }: ${sanitizedContent.slice(0, 50)}${
          sanitizedContent.length > 50 ? "..." : ""
        }`
      );
    } catch (error) {
      this.clientManager.sendError(client, "Failed to send message");
    }
  }

  
  leaveRoom(client: WebSocketClient, room: any): void {
    if (!room) return;

    const userName = client.name;
    this.roomManager.removeClientFromRoom(room, client);

    // Notify other clients about the leave
    const remainingClients = this.roomManager.getRoomClients(room.id);
    this.clientManager.sendToClients(remainingClients, {
      type: "user_left",
      userId: client.userId,
      name: userName,
      userCount: room.userCount,
    });

    console.log(`Client ${client.userId} (${userName}) left room: ${room.id}`);
  }
}
