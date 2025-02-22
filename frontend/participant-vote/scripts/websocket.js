// 處理 WebSocket 連接
import { renderVoteCounts } from "./dom.js";
import { getVoterName } from "./dom.js";
import { updateUIBasedOnVotingStatus } from "./dom.js";

let socket;

export function initializeWebSocket(voteId) {
  socket = io("http://localhost:3000");

  socket.on("connect", () => {
    console.log("已連接到 WebSocket 服務器");
  });

  socket.on(`voteResult:${voteId}`, (data) => {
    if (data.success) {
      renderVoteCounts(data.data.vote); // 更新票數
    } else {
      console.error("獲取投票結果失敗:", data.error);
    }
  });

  socket.on(`voteForTopic:${voteId}:success`, (data) => {
    console.log("投票成功:", data.message);
  });

  socket.on(`voteForTopic:${voteId}:error`, (error) => {
    console.error("投票失敗:", error.error);
  });

  socket.on("statusUpdated", (data) => {
    console.log("投票狀態已更新:", data.status, "投票ID:", data.voteId);
    updateUIBasedOnVotingStatus(data.status); // 保持投票狀態同步
  });
}

export function submitVote(voteId, optionId) {
  try {
    const voterName = getVoterName();
    socket.emit("voteForTopic", { voteId, optionId, voterName });
    return optionId;
  } catch (error) {
    throw new Error("發送投票請求時發生錯誤: " + error.message);
  }
}
