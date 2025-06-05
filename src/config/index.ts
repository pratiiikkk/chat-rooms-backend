export const config = {
  
  server: {
    port: process.env.PORT ? parseInt(process.env.PORT) : 8080,
    host: process.env.HOST || "localhost",
  },

 
  security: {
    allowedOrigins: process.env.ALLOWED_ORIGINS
      ? process.env.ALLOWED_ORIGINS.split(",")
      : ["http://localhost:3000", "https://your-production-domain.com"],
  },

  
  rooms: {
    cleanupInterval: parseInt(process.env.ROOM_CLEANUP_INTERVAL || "3600000"), // 1 hour
    maxAge: parseInt(process.env.ROOM_MAX_AGE || "86400000"), // 24 hours
    maxClients: parseInt(process.env.MAX_CLIENTS_PER_ROOM || "50"),
  },

  // Rate limiting
  rateLimit: {
    maxMessagesPerMinute: parseInt(process.env.MAX_MESSAGES_PER_MINUTE || "60"),
    windowMs: parseInt(process.env.RATE_LIMIT_WINDOW || "60000"), // 1 minute
  },

  // Logging
  logging: {
    level: process.env.LOG_LEVEL || "info",
    enableRequestLogging: process.env.ENABLE_REQUEST_LOGGING === "true",
  },
} as const;

export default config;
