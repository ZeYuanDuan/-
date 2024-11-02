import express from "express";
import dotenv from "dotenv";
import router from "./routes/index";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { setupVotingInfrastructure } from "./infrastructure/setupVotingInfrastructure";

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 允許所有來源，生產環境中應該更具體
    methods: ["GET", "POST"],
  },
});

const port = process.env.PORT || 3000;

app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(router);

server.listen(port, async () => {
  console.log(`Server is running on http://localhost:${port}`);
  try {
    await setupVotingInfrastructure(io);
  } catch (error) {
    console.error("Failed to initialize server:", error);
  }
});

export { io };
