// 處理 API 請求
export const API_BASE_URL = "http://localhost:3000";

export async function fetchVoteResult(voteId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/${voteId}`);
    if (response.data && response.data.success) {
      return response.data.data.vote;
    } else {
      throw new Error(response.data.message || "獲取投票結果失敗");
    }
  } catch (error) {
    if (error.response) {
      throw new Error(
        `獲取投票結果失敗: ${
          error.response.data.message || error.response.statusText
        }`
      );
    } else if (error.request) {
      throw new Error("無法連接到服務器，請檢查網絡連接");
    } else {
      throw new Error(`獲取投票結果失敗: ${error.message}`);
    }
  }
}
