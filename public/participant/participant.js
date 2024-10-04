import { API_BASE_URL, fetchVoteResult } from "../voting/scripts/api.js";

document.addEventListener("DOMContentLoaded", async function () {
  try {
    const voteId = getVoteId();
    const vote = await fetchVoteResult(voteId);
    updateVoteDisplay(vote);
  } catch (error) {
    displayError(error.message);
  }
});

function getVoteId() {
  const urlParams = new URLSearchParams(window.location.search);
  const id = urlParams.get("voteId");
  if (!id) {
    throw new Error("未提供投票 ID");
  }
  return id;
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
