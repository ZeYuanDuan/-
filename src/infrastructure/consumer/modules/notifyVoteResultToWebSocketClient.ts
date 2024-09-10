import { Server } from "socket.io";
import { WEB_SOCKET_CHANNELS } from "../../websocket/webSocketChannels";

export async function notifyVoteResultToWebSocketClient(
  io: Server,
  voteId: string,
  voteData: any
): Promise<void> {
  if (!voteData) {
    io.emit(WEB_SOCKET_CHANNELS.VOTE_RESULT_ERROR(voteId), {
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

  io.emit(WEB_SOCKET_CHANNELS.VOTE_RESULT(voteId), result);
}
