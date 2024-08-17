import { Server, Socket } from "socket.io";
import { processVote } from "../utils/vote-processing";
import { getVoteData } from "../utils/vote-data";

export function setupVoteWebSockets(io: Server) {
  io.on("connection", (socket: Socket) => {
    socket.on("voteForTopic", async (data) => {
      const { voteId, optionId, voterName } = data;
      const result = await processVote(voteId, optionId, voterName);

      if (!result.success) {
        socket.emit(`voteForTopic:${voteId}:error`, {
          success: false,
          error: result.error,
        });
        return;
      }

      // 更新投票結果
      await getVoteResultWebSocket(io, socket, voteId);

      // 發送成功消息
      socket.emit(`voteForTopic:${voteId}:success`, {
        success: true,
        data: { voteId, optionId, voterName },
        message: "投票提交成功",
      });
    });
  });
}

async function getVoteResultWebSocket(
  io: Server,
  socket: Socket,
  voteId: string
): Promise<void> {
  try {
    const voteData = await getVoteData(voteId);

    if (!voteData) {
      socket.emit(`voteResult:${voteId}:error`, {
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

    // 發送結果到所有連接的客戶端
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