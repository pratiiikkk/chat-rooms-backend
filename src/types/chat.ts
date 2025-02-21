// types/chat.ts
export interface WebSocketMessage {
    type: 'create_room' | 'join_room' | 'send_message' | 'room_created' | 'room_joined' | 'new_message' | 'user_joined' | 'user_left' | 'error';
    roomId?: string;
    name?: string;
    content?: string;
    userId?: string;
  }
  
  export interface ChatUser {
    userId: string;
    name: string;
  }
  
  export interface ChatRoom {
    id: string;
    users: ChatUser[];
  }