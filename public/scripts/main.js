// 應用程序入口
import { fetchVoteResult } from "./api.js";
import { updateVoteDisplay } from "./dom.js";
import { initializeWebSocket, submitVote } from "./websocket.js";

const voteId = getVoteId();
const voterName = "測試用戶";

async function initialize() {
  try {
    const vote = await fetchVoteResult(voteId);
    updateVoteDisplay(vote);
    initializeWebSocket(voteId);
  } catch (error) {
    displayError(error.message);
  }
}

function displayError(message) {
  console.error(message);
  document.getElementById("errorMessage").textContent = message;
}

function getVoteId() {
  return "1"; // TODO 替換為實際的動態投票 ID
}

initialize();
