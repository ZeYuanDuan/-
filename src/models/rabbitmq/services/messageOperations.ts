import { Channel } from "amqplib";
import { QUEUE_NAME } from "../../../shared/constants";

// 抽象一個發送消息到隊列的邏輯
export async function sendMessageToQueue(
  channel: Channel,
  data: object
): Promise<void> {
  const message = JSON.stringify(data);
  const sent = channel.sendToQueue(QUEUE_NAME, Buffer.from(message), {
    persistent: true,
  });

  if (!sent) {
    await new Promise((resolve) => channel.once("drain", resolve));
  }
}

// 抽象一個從隊列消費消息的邏輯
export async function consumeMessageFromQueue(
  channel: Channel,
  onMessage: (data: any) => Promise<void>
) {
  await channel.assertQueue(QUEUE_NAME, { durable: true });
  await channel.prefetch(1);

  channel.consume(
    QUEUE_NAME,
    async (msg) => {
      if (msg !== null) {
        const data = JSON.parse(msg.content.toString());
        try {
          await onMessage(data);
          channel.ack(msg);
        } catch (error) {
          console.error("處理消息時發生錯誤:", error);
          channel.nack(msg, false, true);
        }
      }
    },
    { noAck: false }
  );
}
