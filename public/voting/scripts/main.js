// 應用程序入口
import { fetchVoteDataWithStatus } from "./api.js";
import { renderVoteDisplay } from "./dom.js";
import { initializeWebSocket } from "./websocket.js";

async function initialize() {
  try {
    const voteId = getVoteId();
    const voteData = await fetchVoteDataWithStatus(voteId);
    renderVoteDisplay(voteData);
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
