import { WebSocketServer, WebSocket } from "ws";

const wss = new WebSocketServer({ port: 8080 });


const rooms: Map<string, Set<WebSocket>> = new Map();

function generateHexCode(): string {
  return Math.floor(Math.random() * 0xFFFFFF)
    .toString(16)
    .padStart(6, "0");
}

wss.on("connection", (socket: WebSocket) => {
  console.log("Client connected");

  socket.on("message", (message: string) => {
    const parsedMessage = JSON.parse(message);
    const { type, roomId, name, content, userId } = parsedMessage;

    if (type === "create_room") {
      const newRoomId = generateHexCode();
      rooms.set(newRoomId, new Set());
      socket.send(JSON.stringify({ type: "room_created", roomId: newRoomId }));
      console.log(`Room created with ID: ${newRoomId}`);
    }

    if (type === "join_room") {
      if (!rooms.has(roomId)) {
        socket.send(
          JSON.stringify({
            type: "error",
            content: "room not found",
          })
        );
        return;
      }
      rooms.get(roomId)!.add(socket);
      socket.send(
        JSON.stringify({
          type: "room_joined",
          roomId,
          name
        })
      );
      console.log(`Client ${name} joined room: ${roomId}`);
    }

    if (type === "send_message" && rooms.has(roomId)) {
      rooms.get(roomId)!.forEach((client) => {
        if (client.readyState === WebSocket.OPEN) {
          client.send(
            JSON.stringify({ type: "new_message", roomId, content, userId, name})
          );
        }
      });
      console.log(`Message sent to room ${roomId}: ${content}`);
    }
  });

  socket.on("close", () => {
    console.log("Client disconnected");
    rooms.forEach((clients, roomId) => {
      clients.delete(socket);
      if (clients.size === 0) {
        rooms.delete(roomId);
      }
    });
  });
});
