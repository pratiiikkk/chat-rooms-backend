import { WebSocketServer } from "ws";
import { ChatServer } from "./services/ChatServer";
import config from "./config";

const wss = new WebSocketServer({
  port: config.server.port,
  verifyClient: ({ origin }, callback) => {
   
    if (!origin) {
      callback(true);
      return;
    }

    if (config.security.allowedOrigins.includes(origin)) {
      callback(true);
    } else {
      console.log(`Rejected connection from origin: ${origin}`);
      callback(false);
    }
  },
});

const chatServer = new ChatServer(wss);

process.on("SIGTERM", async () => {
  console.log("SIGTERM received, starting graceful shutdown");
  await chatServer.shutdown();
  process.exit(0);
});

process.on("SIGINT", async () => {
  console.log("SIGINT received, starting graceful shutdown");
  await chatServer.shutdown();
  process.exit(0);
});

console.log(`🚀 WebSocket Chat Server started`);
console.log(`📍 Host: ${config.server.host}:${config.server.port}`);
console.log(`🔒 Allowed origins: ${config.security.allowedOrigins.join(", ")}`);
console.log(
  `📊 Room cleanup interval: ${config.rooms.cleanupInterval / 1000}s`
);
console.log(`⏰ Room max age: ${config.rooms.maxAge / (1000 * 60 * 60)}h`);

// Optional: Log server stats periodically
if (config.logging.level === "debug") {
  setInterval(() => {
    const stats = chatServer.getStats();
    console.log("📈 Server Stats:", stats);
  }, 30000); // Every 30 seconds
}
