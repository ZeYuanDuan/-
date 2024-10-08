// 應用程序入口
import { fetchVoteResult } from "./api.js";
import { renderVoteDisplay } from "./dom.js";
import { initializeWebSocket } from "./websocket.js";

async function initialize() {
  try {
    const voteId = getVoteId();
    const vote = await fetchVoteResult(voteId);
    console.log("投票詳細資訊:", JSON.stringify(vote, null, 2)); //! 測試
    renderVoteDisplay(vote);
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
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("voteId");
  if (!id) {
    throw new Error("未提供投票 ID");
  }
  return id;
}

initialize();
