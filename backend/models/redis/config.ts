import Redis from "ioredis";
import dotenv from "dotenv";
dotenv.config();

const redisClient = new Redis({
  host: "redis",
  // port: 6379,
  password: process.env.REDIS_PASSWORD,
  enableOfflineQueue: true,
  retryStrategy: (times) => {
    const delay = Math.min(times * 50, 2000);
    return delay;
  },
  maxRetriesPerRequest: 3,
});

redisClient.on("error", (err) => {
  console.error("Redis error:", err);
});

redisClient.on("connect", () => {
  console.log("Connected to Redis");
});

export default redisClient;
