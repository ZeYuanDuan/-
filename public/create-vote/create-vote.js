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

  function createOptionElement(number) {
    const div = document.createElement("div");
    div.className = "form-group option-group";
    div.innerHTML = `
            <div class="input-group">
                <div class="input-group-prepend">
                    <span class="input-group-text">
                        <i class="fas fa-grip-vertical"></i>
                    </span>
                </div>
                <input type="text" class="form-control option-input" placeholder="選項 ${number}" required>
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

  form.addEventListener("submit", async (e) => {
    e.preventDefault();

    const title = document.getElementById("title").value;
    const descriptionValue = document.getElementById("description").value;
    const description =
      descriptionValue.trim() !== "" ? descriptionValue : null;
    const options = Array.from(document.querySelectorAll(".option-input")).map(
      (input) => input.value
    );

    try {
      const response = await axios.post(`${API_BASE_URL}/vote`, {
        title,
        description,
        options,
      });

      if (response.data.success) {
        alert("投票創建成功！");
        window.location.href = `../voting/index.html?voteId=${response.data.data.vote.id}`;
      } else {
        alert("創建投票失敗：" + response.data.error.message);
      }
    } catch (error) {
      console.error("創建投票時發生錯誤:", error);
      alert("創建投票時發生錯誤，請稍後再試。");
    }
  });
});
