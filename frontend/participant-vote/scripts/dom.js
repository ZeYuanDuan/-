// 處理 DOM 操作
// TODO 這個腳本的複雜度太高，需要重構

import { submitVote } from "./websocket.js";

// ============================ 根據投票狀態更新 UI ============================
function toggleElementsVisibility(isActive) {
  const elementsToToggle = [
    document.getElementById("voteTitle"),
    document.getElementById("voteDescription"),
    document.getElementById("voteOptions"),
    document.getElementById("totalVotes"),
    ...document.querySelectorAll(".btn-circle.btn-sm"),
  ];

  elementsToToggle.forEach((element) => {
    if (element) {
      element.style.display = isActive ? "" : "none";
    }
  });

  let messageBlock = document.getElementById("noVoteMessage");
  if (!messageBlock) {
    messageBlock = document.createElement("p");
    messageBlock.id = "noVoteMessage";
    messageBlock.className = "text-center font-weight-bold my-3";
    const voteTitleElement = document.getElementById("voteTitle");
    voteTitleElement.parentNode.insertBefore(
      messageBlock,
      voteTitleElement.nextSibling
    );
  }

  if (!isActive) {
    messageBlock.textContent = "目前沒有任何投票正在進行";
    messageBlock.style.display = "";
  } else {
    messageBlock.style.display = "none";
    messageBlock.remove();
  }
}

export function updateUIBasedOnVotingStatus(isActive) {
  if (isActive) {
    toggleElementsVisibility(true);
  } else {
    toggleElementsVisibility(false);
  }
}
// ============================ 切換投票狀態 UI ============================

// ============================ 渲染投票表單============================
export function renderVoteForm(vote) {
  renderTitleAndDescription(vote);

  const voteId = vote.id;
  const options = vote.options;
  const formContainer = document.getElementById("voteOptions");
  formContainer.innerHTML = "";

  const form = document.createElement("form");
  form.id = "voteForm";
  form.className = "vote-options-container";

  options.forEach((option) => {
    const label = document.createElement("label");
    label.className = "d-block mb-3 p-3 border rounded vote-option";
    label.style.cursor = "pointer";

    const input = document.createElement("input");
    input.type = "radio";
    input.name = "voteOption";
    input.value = option.id;
    input.id = `option-${option.id}`;
    input.className = "mr-2";

    const optionText = document.createElement("span");
    optionText.textContent = option.name;
    optionText.className = "ml-2 h5";

    label.appendChild(input);
    label.appendChild(optionText);
    form.appendChild(label);

    label.addEventListener("click", function () {
      form
        .querySelectorAll(".vote-option")
        .forEach((opt) => opt.classList.remove("selected"));
      this.classList.add("selected");
    });
  });

  const submitButton = document.createElement("button");
  submitButton.type = "submit";
  submitButton.className = "btn btn-primary btn-lg btn-block mt-4";
  submitButton.textContent = "提交";

  form.appendChild(submitButton);
  form.addEventListener("submit", (event) => {
    event.preventDefault();
    const selectedOption = form.querySelector(
      'input[name="voteOption"]:checked'
    );
    if (selectedOption) {
      const optionId = selectedOption.value;
      const voterName = getVoterName();
      const submittedOptionId = submitVote(voteId, optionId, voterName);
      console.log("submittedOptionId", submittedOptionId); // ! 測試用
      renderVoteResult(vote, submittedOptionId);
      updateUIBasedOnVotingStatus(vote.status);
    } else {
      alert("請選擇一個選項");
    }
  });

  formContainer.appendChild(form);
}

function renderTitleAndDescription(vote) {
  document.getElementById("voteTitle").textContent = vote.title;
  document.getElementById("voteDescription").textContent = vote.description;
}

// ============================ 渲染投票表單============================

function renderVoteResult(vote, submittedOptionId) {
  const options = vote.options;
  const optionsContainer = document.getElementById("voteOptions");
  optionsContainer.innerHTML = "";
  options.forEach((option) => {
    optionsContainer.appendChild(
      createOptionElement(option, submittedOptionId)
    );
  });
}

function createOptionElement(option, submittedOptionId) {
  const isSelected = String(option.id) === String(submittedOptionId);
  const selectedClass = isSelected ? "selected-option" : "";

  const optionElement = document.createElement("div");
  optionElement.className = "col-12 px-1";
  optionElement.id = `option-${option.id}`;

  optionElement.innerHTML = `
    <div class="card ${selectedClass}">
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

  return optionElement;
}

export function getVoterName() {
  const name = localStorage.getItem("voterName");
  if (!name) {
    throw new Error("未提供參與者名稱");
  }
  return name;
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
    }
  });
}
