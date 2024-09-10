import { Server, Socket } from "socket.io";
import { Channel } from "amqplib";
import { handleVoteForTopic } from "./modules/handleVoteForTopic";

export function setupSocketConnection(io: Server, channel: Channel) {
  io.on("connection", (socket: Socket) => {
    console.log(`新客戶端已連接, Socket ID: ${socket.id}`);
    socket.on("voteForTopic", handleVoteForTopic(socket, channel)); // ! 要測試此處的程式碼寫法
  });
}
