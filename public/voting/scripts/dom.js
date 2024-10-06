// 處理 DOM 操作
import { submitVote } from "./websocket.js";

const voterName = "測試用戶"; // TODO 替換為實際的用戶名

window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  const voteId = urlParams.get("voteId");

  const newUrl = `http://127.0.0.1:5500/public/participant/participant.html?voteId=${voteId}`;

  new QRCode(document.getElementById("qrcode"), {
    text: newUrl,
    width: 128,
    height: 128,
  });

  const participantLink = document.createElement("a");
  participantLink.href = `../participant/participant.html?voteId=${voteId}`;
  participantLink.textContent = "參與者投票頁面";

  document.getElementById("qrcode").appendChild(participantLink);
};

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
      // 更新進度條
      const progressContainer = optionElement.querySelector(".d-flex");
      if (progressContainer) {
        progressContainer.innerHTML = `
          <div class="progress flex-grow-1 mr-2">
            <div 
              class="progress-bar" 
              role="progressbar" 
              style="width: ${option.percentage}">
              ${option.votes} 票
            </div>
          </div>
          <span class="text-muted">${option.percentage}</span>
        `;
      }

      let voteButton = optionElement.querySelector("button");
      if (!voteButton) {
        voteButton = createVoteButton(vote.id, option.id);
        optionElement.querySelector(".card-body").appendChild(voteButton);
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
  optionElement.className = "col-12 px-1";
  optionElement.id = `option-${option.id}`;

  optionElement.innerHTML = `
    <div class="card">
      <div class="card-body">
        <h5 class="card-title">${option.name}</h5>
        <div class="d-flex align-items-center mb-2">
          <div class="progress flex-grow-1 mr-2">
            <div 
              class="progress-bar" 
              role="progressbar" 
              style="width: ${option.percentage}">
              ${option.votes} 票
            </div>
          </div>
          <span class="text-muted">${option.percentage}</span>
        </div>
      </div>
    </div>
  `;

  const voteButton = createVoteButton(voteId, option.id);
  optionElement.querySelector(".card-body").appendChild(voteButton);

  return optionElement;
}

function createVoteButton(voteId, optionId) {
  const voteButton = document.createElement("button");
  voteButton.className = "btn btn-primary btn-circle btn-sm";
  voteButton.textContent = "投票";
  voteButton.onclick = () => submitVote(voteId, optionId, voterName);
  return voteButton;
}
