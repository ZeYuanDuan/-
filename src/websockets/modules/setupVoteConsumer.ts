import { Server } from "socket.io";
import { Channel, ConsumeMessage } from "amqplib";
import { QUEUE_NAME } from "./constants";
import { processVote } from "../../utils/vote-processing";
import { getVoteResultWebSocket } from "./getVoteResultWebSocket";

export async function setupVoteConsumer(channel: Channel, io: Server) {
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.prefetch(1);

  channel.consume(
    QUEUE_NAME,
    async (msg: ConsumeMessage | null) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        const { voteId, optionId, voterName } = data;

        try {
          const result = await processVote(voteId, optionId, voterName);

          if (result.success) {
            await getVoteResultWebSocket(io, voteId);
            channel.ack(msg);
          } else {
            console.error("處理投票時發生錯誤:", result.error);
            channel.nack(msg, false, true);
          }
        } catch (error) {
          console.error("處理從 RabbitMQ 接收的投票時發生錯誤:", error);
          channel.nack(msg, false, true);
        }
      }
    },
    { noAck: false }
  );
}
