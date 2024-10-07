import { Server, Socket } from "socket.io";
import { WEB_SOCKET_CHANNELS } from "../webSocketChannels";
import {
  updateVoteStatus,
  createTempResponseKey,
  transferTempResponseToResponse
} from "../../../models/redis/services/voteService";
import { extractTempResponses } from "../../../models/redis/services/voteService";

export function handleToggleVotingStatus(io: Server, socket: Socket) {
  return async (data: { voteId: string; status: boolean }) => {
    console.log(
      `收到投票狀態更新: voteId=${data.voteId}, status=${data.status}`
    );

    await updateVoteStatus(data.voteId, data.status);

    if (data.status) {
      await createTempResponseKey(data.voteId);
    } else {
      const extractedResponses = await extractTempResponses(data.voteId);
      
      // ! 測試代碼：印出完整的 extractedResponses
      console.log('提取的臨時響應數據:');
      console.log(JSON.stringify(extractedResponses, null, 2));
      
      // TODO: 將 extractedResponses 存儲到 MySQL 的 vote_responses 表中
      await transferTempResponseToResponse(data.voteId);
    }

    // 廣播狀態更新給所有連接的客戶端
    io.emit(WEB_SOCKET_CHANNELS.STATUS_UPDATED, {
      voteId: data.voteId,
      status: data.status,
    });
  };
}
