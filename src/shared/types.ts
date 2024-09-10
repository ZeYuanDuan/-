import { Server, Socket } from "socket.io";
import { Channel } from "amqplib";

export interface VoteData {
  voteId: string;
  optionId: string;
  voterName: string;
}

export interface SocketHandlers {
  setupSocketConnection: (io: Server) => void;
  handleVoteForTopic: (
    socket: Socket,
    channel: Channel
  ) => (data: VoteData) => Promise<void>;
}
