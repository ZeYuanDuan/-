import { Server, Socket } from "socket.io";
import { Channel } from "amqplib";
import { handleVoteForTopic } from "./modules/handleVoteForTopic";
import { WEB_SOCKET_CHANNELS } from "./webSocketChannels";

export function setupSocketConnection(io: Server, channel: Channel) {
  io.on("connection", (socket: Socket) => {
    console.log(`新客戶端已連接, Socket ID: ${socket.id}`);

    socket.on("voteForTopic", handleVoteForTopic(socket, channel)); // ! 要測試此處的程式碼寫法

    // 監聽 toggleVotingStatus 事件
    socket.on(
      WEB_SOCKET_CHANNELS.TOGGLE_VOTING_STATUS,
      (data: { voteId: string; status: boolean }) => {
        console.log(`收到投票狀態更新: voteId=${data.voteId}, status=${data.status}`);

        // 廣播狀態更新給所有連接的客戶端
        io.emit(WEB_SOCKET_CHANNELS.STATUS_UPDATED, {
          voteId: data.voteId,
          status: data.status
        });
      }
    );
  });
}
