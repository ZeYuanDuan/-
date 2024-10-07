import { Server, Socket } from "socket.io";
import { WEB_SOCKET_CHANNELS } from "../webSocketChannels";
import { updateVoteStatus } from "../../../models/redis/services/voteService";

export function handleToggleVotingStatus(io: Server, socket: Socket) {
  return async (data: { voteId: string; status: boolean }) => {
    console.log(
      `收到投票狀態更新: voteId=${data.voteId}, status=${data.status}`
    );

    await updateVoteStatus(data.voteId, data.status);

    // 廣播狀態更新給所有連接的客戶端
    io.emit(WEB_SOCKET_CHANNELS.STATUS_UPDATED, {
      voteId: data.voteId,
      status: data.status,
    });
  };
}
