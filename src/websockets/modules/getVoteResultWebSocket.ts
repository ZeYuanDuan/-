import { Server } from "socket.io";
import { getVoteData } from "../../utils/vote-data";

export async function getVoteResultWebSocket(
  io: Server,
  voteId: string
): Promise<void> {
  try {
    const voteData = await getVoteData(voteId);

    if (!voteData) {
      io.emit(`voteResult:${voteId}:error`, {
        success: false,
        error: {
          message: "投票未找到",
          details: "指定的投票ID不存在",
        },
      });
      return;
    }

    const result = {
      success: true,
      data: { vote: voteData },
      message: "投票結果獲取成功",
    };

    io.emit(`voteResult:${voteId}`, result);
  } catch (error) {
    console.error("獲取投票結果時發生錯誤:", error);
    io.emit(`voteResult:${voteId}:error`, {
      success: false,
      error: {
        message: "獲取投票結果時發生錯誤",
        details: (error as Error).message,
      },
    });
  }
}
