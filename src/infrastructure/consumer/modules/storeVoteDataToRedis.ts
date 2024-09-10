import { checkOptionExists, incrementVote, storeVoteResponse } from "../../../models/redis/services/voteService";

interface VoteProcessingResult {
  success: boolean;
  error?: {
    message: string;
    details: string;
  };
}

export async function storeVoteDataToRedis(
  voteId: string,
  optionId: string,
  voterName: string
): Promise<VoteProcessingResult> {
  if (!voteId || !optionId || !voterName) {
    return {
      success: false,
      error: {
        message: "缺少必要參數",
        details: "投票ID、選項ID和投票者姓名都是必須的",
      },
    };
  }

  try {
    // 檢查選項是否存在
    const exists = await checkOptionExists(voteId, optionId);

    if (!exists) {
      return {
        success: false,
        error: {
          message: "選項未找到",
          details: "指定的選項在該投票中不存在",
        },
      };
    }

    // 增加投票計數
    await incrementVote(voteId, optionId);

    // 存儲投票回應
    await storeVoteResponse(voteId, voterName, optionId);

    return { success: true };
  } catch (error) {
    console.error("投票處理過程中發生錯誤:", error);
    return {
      success: false,
      error: {
        message: "投票處理時發生錯誤",
        details: (error as Error).message,
      },
    };
  }
}
