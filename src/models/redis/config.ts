import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = new Redis({
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || "6380"),
  password: process.env.REDIS_PASSWORD,
  maxRetriesPerRequest: null,
  enableOfflineQueue: false,
  retryStrategy(times) {
    return Math.min(times * 50, 2000);
  },
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
  if (err.message.includes("READONLY")) {
    redisClient.disconnect();
    redisClient.connect();
  }
});

export default redisClient;
