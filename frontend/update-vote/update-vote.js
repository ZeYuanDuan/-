const API_BASE_URL = "http://localhost:3000";

document.addEventListener("DOMContentLoaded", () => {
  const form = document.getElementById("createVoteForm");
  const addOptionButton = document.getElementById("addOption");
  const optionsContainer = document.getElementById("optionsContainer");

  let optionCount = 2;

  new Sortable(optionsContainer, {
    animation: 150,
    handle: ".input-group-prepend",
    onEnd: function (evt) {
      reorderOptions();
    },
  });

  const urlParams = new URLSearchParams(window.location.search);
  const voteId = urlParams.get("voteId");

  if (voteId) {
    fetchVoteData(voteId);
  } else {
    console.error("No vote ID provided");
  }

  addOptionButton.addEventListener("click", () => {
    optionCount++;
    const newOption = createOptionElement(optionCount);
    optionsContainer.appendChild(newOption);
    updateDeleteButtons();
  });

  optionsContainer.addEventListener("click", (e) => {
    if (
      e.target.classList.contains("delete-option") ||
      e.target.parentElement.classList.contains("delete-option")
    ) {
      const optionGroup = e.target.closest(".option-group");
      optionGroup.remove();
      optionCount--;
      updateDeleteButtons();
      reorderOptions();
    }
  });

  function createOptionElement(number, value = "") {
    const div = document.createElement("div");
    div.className = "form-group option-group";
    div.innerHTML = `
      <div class="input-group">
        <div class="input-group-prepend">
          <span class="input-group-text">
            <i class="fas fa-grip-vertical"></i>
          </span>
        </div>
        <input type="text" class="form-control option-input" placeholder="選項 ${number}" value="${value}" required>
        <div class="input-group-append">
          <button type="button" class="btn btn-outline-secondary delete-option">
            <i class="fas fa-times"></i>
          </button>
        </div>
      </div>
    `;
    return div;
  }

  function updateDeleteButtons() {
    const deleteButtons = document.querySelectorAll(".delete-option");
    deleteButtons.forEach((button) => {
      button.disabled = deleteButtons.length <= 2;
    });
  }

  function reorderOptions() {
    const optionInputs = document.querySelectorAll(".option-input");
    optionInputs.forEach((input, index) => {
      input.placeholder = `選項 ${index + 1}`;
    });
  }

  async function fetchVoteData(voteId) {
    try {
      const response = await axios.get(`${API_BASE_URL}/vote/${voteId}`);
      if (response.data && response.data.success) {
        populateForm(response.data.data.vote);
      } else {
        throw new Error(response.data.message || "獲取投票數據失敗");
      }
    } catch (error) {
      console.error("獲取投票數據時發生錯誤:", error);
      window.confirm(
        "獲取投票數據時發生錯誤，請確認投票 ID 是否正確。點擊確定返回首頁。"
      );
      window.location.href = "../home/home.html";
    }
  }

  function populateForm(vote) {
    document.getElementById("title").value = vote.title;
    document.getElementById("description").value = vote.description || "";

    optionsContainer.innerHTML = ""; // 清空現有選項

    vote.options.forEach((option, index) => {
      const newOption = createOptionElement(index + 1, option.name);
      optionsContainer.appendChild(newOption);
    });

    optionCount = vote.options.length;
    updateDeleteButtons();

    // 更新表單標題
    document.querySelector("h1").textContent = "修改投票";

    // 更新提交按鈕文字
    document.querySelector('button[type="submit"]').textContent = "更新投票";

    // 添加投票 ID 到表單中（用於提交更新）
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.name = "voteId";
    hiddenInput.value = vote.id;
    form.appendChild(hiddenInput);
  }

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const voteId = document.querySelector('input[name="voteId"]')?.value;

    // 如果是修改現有投票，則顯示警告訊息
    if (voteId) {
      const confirmUpdate = confirm(
        "警告：投票修改後，原有的投票數據將會遺失。確定要繼續嗎？"
      );
      if (!confirmUpdate) {
        return; // 如果用戶取消，則不進行後續操作
      }
    }

    const title = document.getElementById("title").value;
    const descriptionValue = document.getElementById("description").value;
    const description =
      descriptionValue.trim() !== "" ? descriptionValue : null;
    const options = Array.from(document.querySelectorAll(".option-input")).map(
      (input) => input.value
    );

    try {
      const url = voteId
        ? `${API_BASE_URL}/vote/${voteId}`
        : `${API_BASE_URL}/vote`;
      const method = voteId ? "put" : "post";

      const response = await axios[method](url, {
        title,
        description,
        options,
      });

      if (response.data.success) {
        alert(voteId ? "投票更新成功！" : "投票創建成功！");
        window.location.href = `../home/home.html`;
      } else {
        alert(
          (voteId ? "更新" : "創建") +
            "投票失敗：" +
            response.data.error.message
        );
      }
    } catch (error) {
      console.error((voteId ? "更新" : "創建") + "投票時發生錯誤:", error);
      alert((voteId ? "更新" : "創建") + "投票時發生錯誤，請稍後再試。");
    }
  });
});
