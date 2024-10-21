// 處理 DOM 操作
import { submitVote, sendVotingStatusUpdate } from "./websocket.js";

const voterName = "主持人";
let isVotingActive;
let voteId;

// ============================ 根據投票狀態更新 UI ============================
export function updateUIBasedOnVotingStatus(isActive) {
  isVotingActive = isActive; // 將投票狀態更新至全域變數

  const qrcodeElement = document.getElementById("qrcode");
  const toggleButton = document.getElementById("toggleButton");
  const voteButtons = document.querySelectorAll(".btn-circle.btn-sm");

  // 更新 QR 碼顯示
  qrcodeElement.style.display = isActive ? "block" : "none";

  // 更新切換按鈕
  if (isActive) {
    toggleButton.textContent = "結束";
    toggleButton.classList.remove("btn-success");
    toggleButton.classList.add("btn-danger");
  } else {
    toggleButton.textContent = "開始";
    toggleButton.classList.remove("btn-danger");
    toggleButton.classList.add("btn-success");
  }

  // 更新投票按鈕顯示
  voteButtons.forEach((button) => {
    button.style.display = isActive ? "inline-block" : "none";
  });
}
// ============================ 切換投票狀態 UI ============================

// ============================ 切換投票狀態 ============================
function toggleVotingStatus() {
  isVotingActive = !isVotingActive;
  updateUIBasedOnVotingStatus(isVotingActive);

  // 利用 WebSocket 發送投票狀態更新至伺服器
  sendVotingStatusUpdate(voteId, isVotingActive);
}
// ============================ 切換投票狀態 ============================

// ============================ 渲染投票顯示 ============================
export function renderVoteDisplay(vote) {
  voteId = vote.id;

  setupQRCodeAndParticipantLink(voteId);
  setupToggleButton();

  renderVoteInfo(vote);
  renderOptions(vote);

  updateUIBasedOnVotingStatus(vote.status);
}

function setupQRCodeAndParticipantLink(voteId) {
  const qrcodeElement = document.getElementById("qrcode");

  qrcodeElement.innerHTML = "";

  const newUrl = `http://127.0.0.1:5500/public/participant/participant.html?voteId=${voteId}`;

  new QRCode(qrcodeElement, {
    text: newUrl,
    width: 128,
    height: 128,
  });

  const participantLink = document.createElement("a");
  participantLink.href = `../participant/participant.html?voteId=${voteId}`;
  participantLink.textContent = "參與者投票頁面";

  qrcodeElement.appendChild(participantLink);
}

function setupToggleButton() {
  const toggleButton = document.getElementById("toggleButton");
  toggleButton.addEventListener("click", toggleVotingStatus);
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
  return voteButton;
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
