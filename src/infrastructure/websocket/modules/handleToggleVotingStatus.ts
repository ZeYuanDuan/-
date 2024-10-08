import { Server, Socket } from "socket.io";
import { WEB_SOCKET_CHANNELS } from "../webSocketChannels";
import {
  updateVoteStatus,
  createTempResponseKey,
  transferTempResponseToResponse,
  extractTempResponses,
} from "../../../models/redis/services/voteService";
import { saveExtractedResponsesToMysql } from "../../../models/mysql/services/voteService";

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

      await saveExtractedResponsesToMysql(
        parseInt(data.voteId),
        extractedResponses
      );

      await transferTempResponseToResponse(data.voteId);
    }

    io.emit(WEB_SOCKET_CHANNELS.STATUS_UPDATED, {
      voteId: data.voteId,
      status: data.status,
    });
  };
}
