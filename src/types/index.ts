import { WebSocket } from "ws";

export interface Room {
  id: string;
  clients: Map<string, WebSocketClient>;
  createdAt: number;
  userCount: number;
}

export interface WebSocketClient {
  socket: WebSocket;
  name: string;
  userId: string;
  roomId: string | null;
}

export interface BaseMessage {
  type: string;
}

export interface CreateRoomMessage extends BaseMessage {
  type: "create_room";
}

export interface JoinRoomMessage extends BaseMessage {
  type: "join_room";
  roomId: string;
  name: string;
}

export interface SendMessageMessage extends BaseMessage {
  type: "send_message";
  content: string;
}

export type IncomingMessage =
  | CreateRoomMessage
  | JoinRoomMessage
  | SendMessageMessage;

export interface RoomCreatedResponse extends BaseMessage {
  type: "room_created";
  roomId: string;
}

export interface RoomJoinedResponse extends BaseMessage {
  type: "room_joined";
  roomId: string;
  name: string;
  userCount: number;
}

export interface NewMessageResponse extends BaseMessage {
  type: "new_message";
  content: string;
  userId: string;
  name: string;
}

export interface UserJoinedResponse extends BaseMessage {
  type: "user_joined";
  userId: string;
  name: string;
  userCount: number;
}

export interface UserLeftResponse extends BaseMessage {
  type: "user_left";
  userId: string;
  name: string;
  userCount: number;
}

export interface ErrorResponse extends BaseMessage {
  type: "error";
  content: string;
}

export interface SystemResponse extends BaseMessage {
  type: "system";
  userId: string;
}

export type OutgoingMessage =
  | RoomCreatedResponse
  | RoomJoinedResponse
  | NewMessageResponse
  | UserJoinedResponse
  | UserLeftResponse
  | ErrorResponse
  | SystemResponse;
