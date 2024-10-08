// 處理 DOM 操作
import { submitVote, sendVotingStatusUpdate } from "./websocket.js";

const voterName = "主持人";
let isVotingActive = false;
let voteId;

window.onload = function () {
  const urlParams = new URLSearchParams(window.location.search);
  voteId = urlParams.get("voteId");

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

  const toggleButton = document.getElementById("toggleButton");
  toggleButton.addEventListener("click", toggleVotingStatus);

  const qrcodeElement = document.getElementById("qrcode");
  qrcodeElement.style.display = "none";

  updateButtonVisibility();
};

// ============================ 切換投票狀態 ============================
function toggleVotingStatus() {
  isVotingActive = !isVotingActive;
  const toggleButton = document.getElementById("toggleButton");
  const qrcodeElement = document.getElementById("qrcode");

  if (isVotingActive) {
    toggleButton.textContent = "結束";
    toggleButton.classList.remove("btn-success");
    toggleButton.classList.add("btn-danger");
    qrcodeElement.style.display = "block";
  } else {
    toggleButton.textContent = "開始";
    toggleButton.classList.remove("btn-danger");
    toggleButton.classList.add("btn-success");
    qrcodeElement.style.display = "none";
  }

  updateButtonVisibility();

  // 利用 WebSocket 發送投票狀態更新至伺服器
  sendVotingStatusUpdate(voteId, isVotingActive);
}
// ============================ 切換投票狀態 ============================

// ============================ 渲染投票顯示 ============================
export function renderVoteDisplay(vote) {
  renderVoteInfo(vote);
  renderOptions(vote);
  updateButtonVisibility();
}

function renderVoteInfo(vote) {
  document.getElementById("voteTitle").textContent = vote.title;
  document.getElementById("voteDescription").textContent = vote.description;
  document.getElementById(
    "totalVotes"
  ).textContent = `總票數: ${vote.totalVotes}`;
}

function renderOptions(vote) {
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
  voteButton.style.display = "none"; // 初始時隱藏按鈕
  return voteButton;
}

function updateButtonVisibility() {
  const voteButtons = document.querySelectorAll(".btn-circle.btn-sm");
  voteButtons.forEach(button => {
    button.style.display = isVotingActive ? "inline-block" : "none";
  });
}

export function renderVoteCounts(vote) {
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
