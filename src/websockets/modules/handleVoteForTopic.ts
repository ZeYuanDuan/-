import { Socket } from "socket.io";
import { Channel } from "amqplib";
import { QUEUE_NAME, VoteData } from "./constants";

export function handleVoteForTopic(socket: Socket, channel: Channel) {
  return async (data: VoteData) => {
    const { voteId, optionId, voterName } = data;

    if (!voteId || !optionId || !voterName) {
      socket.emit(`voteForTopic:${voteId}:error`, {
        success: false,
        error: "無效的投票數據",
      });
      return;
    }

    try {
      const sent = channel.sendToQueue(
        QUEUE_NAME,
        Buffer.from(JSON.stringify(data)),
        {
          persistent: true,
        }
      );

      if (sent) {
        socket.emit(`voteForTopic:${voteId}:success`, {
          success: true,
          message: "投票已接收並正在處理",
        });
      } else {
        await new Promise((resolve) => channel.once("drain", resolve));
        socket.emit(`voteForTopic:${voteId}:success`, {
          success: true,
          message: "投票已接收並正在處理",
        });
      }
    } catch (error) {
      console.error("發送投票到 RabbitMQ 時發生錯誤:", error);
      socket.emit(`voteForTopic:${voteId}:error`, {
        success: false,
        error: "處理投票時發生錯誤",
      });
    }
  };
}
