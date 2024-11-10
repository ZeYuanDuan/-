// 處理 API 請求
import { API_BASE_URL } from "../../config.js";

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

export async function fetchVoteStatus(voteId) {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/${voteId}/status`);
    if (response.data && response.data.success) {
      return response.data.data.status;
    } else {
      throw new Error(response.data.message || "獲取投票狀態失敗");
    }
  } catch (error) {
    if (error.response) {
      throw new Error(
        `獲取投票狀態失敗: ${
          error.response.data.message || error.response.statusText
        }`
      );
    } else if (error.request) {
      throw new Error("無法連接到服務器，請檢查網絡連接");
    } else {
      throw new Error(`獲取投票狀態失敗: ${error.message}`);
    }
  }
}

export async function fetchVoteDataWithStatus(voteId) {
  try {
    const [vote, status] = await Promise.all([
      fetchVoteResult(voteId),
      fetchVoteStatus(voteId),
    ]);
    return { ...vote, status };
  } catch (error) {
    throw new Error(`獲取投票數據和狀態失敗: ${error.message}`);
  }
}
