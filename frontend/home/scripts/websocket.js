// WebSocket 連接
import { updateVoteStatus } from "./home.js";

const socket = io("http://localhost:3000");

// 連接成功時的處理
socket.on("connect", () => {
  console.log("WebSocket 連接成功");
});

// 連接錯誤時的處理
socket.on("connect_error", (error) => {
  console.error("WebSocket 連接錯誤:", error);
});

// 監聽 STATUS_UPDATED 事件
socket.on("statusUpdated", (data) => {
  console.log("收到投票狀態更新:", data);

  if (data.voteId && data.status !== undefined) {
    updateVoteStatus(data.voteId, data.status);
  }
});
