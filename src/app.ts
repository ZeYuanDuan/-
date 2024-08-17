import express from "express";
import dotenv from "dotenv";
import path from "path";
import router from "./routes/index";
import cors from "cors";
import http from "http";
import { Server } from "socket.io";
import { setupVoteWebSockets } from "./websockets/vote-web-sockets";

dotenv.config({ path: path.resolve(__dirname, "../.env") });

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*", // 允許所有來源，生產環境中應該更具體
    methods: ["GET", "POST"],
  },
});

// 設置投票 WebSocket
setupVoteWebSockets(io);

const port = process.env.PORT || 3000;

app.use(cors());

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
app.use(router);

// io.on("connection", (socket) => {
//   console.log("A user connected");
//   socket.on("disconnect", () => {
//     console.log("User disconnected");
//   });
// });

server.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

export { io };
