import { Server } from "socket.io";
import { Channel, ConsumeMessage } from "amqplib";
import { QUEUE_NAME } from "../../shared/constants";
import { storeVoteDataToRedis } from "./modules/storeVoteDataToRedis";
import { notifyVoteResultToWebSocketClient } from "./modules/notifyVoteResultToWebSocketClient";
import { getVoteResultFromRedisAndCalculate } from "./modules/getVoteResultFromRedisAndCalculate";

export async function setupVoteConsumer(channel: Channel, io: Server) {
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.prefetch(1); // 一次只處理一個消息

  channel.consume(
    QUEUE_NAME,
    async (msg: ConsumeMessage | null) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        const { voteId, optionId, voterName } = data;

        try {
          const result = await storeVoteDataToRedis(
            voteId,
            optionId,
            voterName
          );

          if (result.success) {
            const voteData = await getVoteResultFromRedisAndCalculate(voteId);
            if (voteData) {
              await notifyVoteResultToWebSocketClient(
                io,
                voteId,
                voteData,
                voterName
              );
              channel.ack(msg);
            } else {
              console.error("獲取投票數據失敗");
              channel.nack(msg, false, true);
            }
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
