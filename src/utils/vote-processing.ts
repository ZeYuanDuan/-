import redisClient from "../models/redis/config";

interface VoteProcessingResult {
  success: boolean;
  error?: {
    message: string;
    details: string;
  };
}

export async function processVote(
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
    const optionKey = `vote:${voteId}:option:${optionId}`;
    const exists = await redisClient.exists(optionKey);

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
    await redisClient.incr(optionKey);

    // 存儲投票回應
    const responseKey = `vote:${voteId}:response`;
    await redisClient.sadd(responseKey, `${voterName}:${optionId}`);

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
