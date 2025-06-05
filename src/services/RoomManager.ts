import { Room, WebSocketClient } from "../types";
import { generateRoomId, getCurrentTimestamp } from "../utils";
import config from "../config";

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Start cleanup interval
    this.cleanupInterval = setInterval(
      () => this.cleanupStaleRooms(),
      config.rooms.cleanupInterval
    );
  }

  createRoom(): Room {
    const roomId = generateRoomId();
    const room: Room = {
      id: roomId,
      clients: new Map(),
      createdAt: getCurrentTimestamp(),
      userCount: 0,
    };

    this.rooms.set(roomId, room);
    console.log(`Room created: ${roomId}`);
    return room;
  }

 
  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

 
  addClientToRoom(room: Room, client: WebSocketClient): void {
    if (room.clients.size >= config.rooms.maxClients) {
      throw new Error("Room is full");
    }

    room.clients.set(client.userId, client);
    room.userCount++;
    client.roomId = room.id;
  }

  
  removeClientFromRoom(room: Room, client: WebSocketClient): void {
    if (room.clients.delete(client.userId)) {
      room.userCount--;
      client.roomId = null;

      // Delete room if empty
      if (room.clients.size === 0) {
        this.deleteRoom(room.id);
      }
    }
  }

  
  private deleteRoom(roomId: string): void {
    if (this.rooms.delete(roomId)) {
      console.log(`Room deleted: ${roomId}`);
    }
  }

  
  getRoomClients(roomId: string): WebSocketClient[] {
    const room = this.getRoom(roomId);
    return room ? Array.from(room.clients.values()) : [];
  }


  getRoomStats() {
    return {
      totalRooms: this.rooms.size,
      totalUsers: Array.from(this.rooms.values()).reduce(
        (sum, room) => sum + room.userCount,
        0
      ),
    };
  }

 
  private cleanupStaleRooms(): void {
    const now = getCurrentTimestamp();
    let deletedCount = 0;

    this.rooms.forEach((room) => {
      if (now - room.createdAt > config.rooms.maxAge) {
        // Force remove all clients from stale room
        room.clients.forEach((client) => {
          client.roomId = null;
        });
        this.deleteRoom(room.id);
        deletedCount++;
      }
    });

    if (deletedCount > 0) {
      console.log(`Cleaned up ${deletedCount} stale rooms`);
    }
  }

 
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
  }
}
