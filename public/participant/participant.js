import { API_BASE_URL } from "../voting/scripts/api.js";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const voteId = getVoteId();
    const vote = await fetchVoteResult(voteId);
    updateVoteDisplay(vote);
  } catch (error) {
    displayError(error.message);
  }
});

document
  .getElementById("participationForm")
  .addEventListener("submit", function (event) {
    event.preventDefault();
    const voterName = document.getElementById("voterName").value;
    localStorage.setItem("voterName", voterName);
    const voteId = getVoteId();
    window.location.href = `../participant-vote/voting.html?voteId=${voteId}`;
  });

function getVoteId() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("voteId");
  if (!id) {
    throw new Error("未提供投票 ID");
  }
  return id;
}

async function fetchVoteResult(voteId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/${voteId}`);
    if (response.data && response.data.success) {
      return response.data.data.vote;
    } else {
      throw new Error(response.data.message || "獲取投票結果失敗");
    }
  } catch (error) {
    if (error.response) {
      // 服務器回應了錯誤狀態碼
      throw new Error(
        `獲取投票結果失敗: ${
          error.response.data.message || error.response.statusText
        }`
      );
    } else if (error.request) {
      // 請求已發出，但沒有收到回應
      throw new Error("無法連接到服務器，請檢查網絡連接");
    } else {
      // 發生了其他錯誤
      throw new Error(`獲取投票結果失敗: ${error.message}`);
    }
  }
}

function updateVoteDisplay(vote) {
  document.getElementById("voteTitle").textContent = vote.title;
  document.getElementById("voteDescription").textContent = vote.description;
}

function displayError(message) {
  console.error(message);
  document.getElementById("voteTitle").textContent = "錯誤";
  document.getElementById("voteDescription").textContent = message;
}
