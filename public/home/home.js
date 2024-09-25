const API_BASE_URL = "http://localhost:3000";

async function fetchVotes() {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote`);
    if (response.data && response.data.success) {
      return response.data.data.votes;
    } else {
      throw new Error(response.data.message || "獲取投票列表失敗");
    }
  } catch (error) {
    console.error("獲取投票列表時發生錯誤:", error);
    return [];
  }
}

function createVoteRow(vote) {
  return `
        <tr>
            <td>${vote.id}</td>
            <td>${vote.title}</td>
            <td>${vote.description || "-"}</td>
            <td>${new Date(vote.created_at).toLocaleString()}</td>
            <td>
                <a href="index.html?voteId=${
                  vote.id
                }" class="btn btn-sm btn-info">
                    <i class="fas fa-eye"></i> 查看
                </a>
            </td>
        </tr>
    `;
}

async function updateVoteList() {
  const voteList = document.getElementById("voteList");
  const votes = await fetchVotes();

  if (votes.length === 0) {
    voteList.innerHTML =
      '<tr><td colspan="5" class="text-center">暫無投票</td></tr>';
  } else {
    voteList.innerHTML = votes.map(createVoteRow).join("");
  }
}

document.addEventListener("DOMContentLoaded", updateVoteList);
