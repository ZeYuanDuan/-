import { API_BASE_URL } from "./config.js";

export async function fetchVotes() {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote`);
    return response.data.data.votes;
  } catch (error) {
    console.error("獲取投票列表時發生錯誤:", error);
    throw error;
  }
}

export async function fetchVoteStatuses() {
  try {
    const response = await axios.get(`${API_BASE_URL}/vote/statuses`);
    return response.data.data.statuses;
  } catch (error) {
    console.error("獲取投票狀態時發生錯誤:", error);
    throw error;
  }
}

export async function deleteVoteById(voteId) {
  try {
    const response = await axios.delete(`${API_BASE_URL}/vote/${voteId}`);
    return response.data;
  } catch (error) {
    console.error("刪除投票時發生錯誤:", error);
    throw error;
  }
}
