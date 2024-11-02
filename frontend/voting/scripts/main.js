// 應用程序入口
import { fetchVoteDataWithStatus } from "./api.js";
import { renderVoteDisplay } from "./dom.js";
import { initializeWebSocket } from "./websocket.js";

let currentVoteId = null;

async function initialize() {
  try {
    currentVoteId = getVoteId();
    await fetchAndRenderVoteData();
    initializeWebSocket(currentVoteId);
  } catch (error) {
    displayError(error.message);
  }
}

async function fetchAndRenderVoteData() {
  try {
    const voteData = await fetchVoteDataWithStatus(currentVoteId);
    renderVoteDisplay(voteData);
  } catch (error) {
    displayError("獲取並渲染投票數據時出錯：" + error.message);
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

// 在 DOM 加載完成後初始化
document.addEventListener("DOMContentLoaded", initialize);

// // 監聽 pageshow 和 popstate 確保狀態更新
// window.addEventListener("pageshow", fetchAndRenderVoteData);
// window.addEventListener("popstate", fetchAndRenderVoteData);

// // 監聽 visibilitychange，當用戶切換頁面或回到該頁面時重新載入狀態
// document.addEventListener("visibilitychange", function () {
//   if (document.visibilityState === "visible") {
//     fetchAndRenderVoteData();
//   }
// });
