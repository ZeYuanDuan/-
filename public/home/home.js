const API_BASE_URL = "http://localhost:3000"; // ! (記得修改) 後端基本路徑
const BASE_URL = "http://127.0.0.1:5500/public"; // ! (記得修改) 前端基本路徑
const DATE_TIME_FORMAT = "zh-TW"; // 時間顯示格式：YYYY/MM/DD HH:mm:ss
const TIME_ZONE = "Asia/Taipei"; // 時區
document.addEventListener("DOMContentLoaded", updateVoteList);

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

// ? 拿掉 id 的顯示, 只依照創建時間給予排序
// TODO 處理時間顯示
function createVoteRow(vote) {
  return `
        <tr>
            <td>${vote.id}</td>  
            <td>${vote.title}</td>
            <td>${vote.description || "-"}</td>
            <td>${convertToLocalTime(
              vote.created_at,
              DATE_TIME_FORMAT,
              TIME_ZONE
            )}</td>
            <td>
            <a href="../voting/index.html?voteId=${
              vote.id
            }" class="btn btn-sm btn-info me-1">
          <i class="fas fa-eye"></i> 查看
        </a>

        <a href="../voting/edit.html?voteId=${
          vote.id
        }" class="btn btn-sm btn-warning me-1">
          <i class="fas fa-edit"></i> 修改
        </a>

        <button onclick="deleteVote(${vote.id})" class="btn btn-sm btn-danger">
          <i class="fas fa-trash"></i> 刪除
        </button>
            </td>
        </tr>
        <tr>
    <td colspan="5">
        <pre>${JSON.stringify(vote, null, 2)}</pre>
    </td>
</tr>
    `;
}

// 添加時區轉換函數
function convertToLocalTime(utcTimeString, dateTimeFormat, timeZone) {
  const date = new Date(utcTimeString);

  return new Intl.DateTimeFormat(dateTimeFormat, {
    timeZone: timeZone,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: false,
  }).format(date);
}
