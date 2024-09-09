import { Server, Socket } from "socket.io";
import { Channel } from "amqplib";
import { handleVoteForTopic } from "./handleVoteForTopic";

export function setupSocketConnection(io: Server, channel: Channel) {
  io.on("connection", (socket: Socket) => {
    console.log(`新客戶端已連接, Socket ID: ${socket.id}`);
    socket.on("voteForTopic", handleVoteForTopic(socket, channel));
  });
}
