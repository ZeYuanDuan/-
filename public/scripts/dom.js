// 處理 DOM 操作
import { submitVote } from "./websocket.js";

const voterName = "測試用戶"; // TODO 替換為實際的用戶名

export function updateVoteDisplay(vote) {
  updateVoteInfo(vote);
  updateOptions(vote);
}

export function updateVoteCounts(vote) {
  document.getElementById(
    "totalVotes"
  ).textContent = `總票數: ${vote.totalVotes}`;
  vote.options.forEach((option) => {
    const optionElement = document.getElementById(`option-${option.id}`);
    if (optionElement) {
      const optionName = optionElement.textContent.split(":")[0].trim();
      optionElement.textContent = `${optionName}: ${option.votes} 票 (${option.percentage})`;

      let voteButton = optionElement.querySelector("button");
      if (!voteButton) {
        voteButton = createVoteButton(vote.id, option.id);
        optionElement.appendChild(voteButton);
      }
    }
  });
}

function updateVoteInfo(vote) {
  document.getElementById("voteTitle").textContent = vote.title;
  document.getElementById("voteDescription").textContent = vote.description;
  document.getElementById(
    "totalVotes"
  ).textContent = `總票數: ${vote.totalVotes}`;
}

function updateOptions(vote) {
  const voteId = vote.id;
  const options = vote.options;
  const optionsContainer = document.getElementById("voteOptions");
  optionsContainer.innerHTML = "";
  options.forEach((option) => {
    optionsContainer.appendChild(createOptionElement(voteId, option));
  });
}

function createOptionElement(voteId, option) {
  const optionElement = document.createElement("div");
  optionElement.id = `option-${option.id}`;
  optionElement.textContent = `${option.name}: ${option.votes} 票 (${option.percentage})`;

  const voteButton = createVoteButton(voteId, option.id);
  optionElement.appendChild(voteButton);

  return optionElement;
}

function createVoteButton(voteId, optionId) {
  const voteButton = document.createElement("button");
  voteButton.textContent = "投票";
  voteButton.onclick = () => submitVote(voteId, optionId, voterName);
  return voteButton;
}
