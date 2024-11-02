import { Server, Socket } from "socket.io";
import { Channel } from "amqplib";
import { WEB_SOCKET_CHANNELS } from "./webSocketChannels";
import { handleVoteForTopic } from "./modules/handleVoteForTopic";
import { handleToggleVotingStatus } from "./modules/handleToggleVotingStatus";

export function setupSocketConnection(io: Server, channel: Channel) {
  io.on("connection", (socket: Socket) => {
    console.log(`新客戶端已連接, Socket ID: ${socket.id}`);

    socket.on("voteForTopic", handleVoteForTopic(socket, channel)); // ! 要測試此處的程式碼寫法

    socket.on(
      WEB_SOCKET_CHANNELS.TOGGLE_VOTING_STATUS,
      handleToggleVotingStatus(io, socket)
    );
  });
}
