import { Channel } from "amqplib";
import { createChannel } from "../config";

export async function purgeQueue(queueName: string): Promise<void> {
  let channel: Channel | null = null;
  try {
    channel = await createChannel();
    const messageCount = await channel.purgeQueue(queueName);
    console.log(`已清空佇列 ${queueName}，刪除了 ${messageCount} 條消息`);
  } catch (error) {
    console.error(`清空佇列 ${queueName} 時發生錯誤:`, error);
    throw error;
  } finally {
    if (channel) await channel.close();
  }
}

export async function deleteQueue(queueName: string): Promise<void> {
  let channel: Channel | null = null;
  try {
    channel = await createChannel();
    await channel.deleteQueue(queueName);
    console.log(`已刪除佇列 ${queueName}`);
  } catch (error) {
    console.error(`刪除佇列 ${queueName} 時發生錯誤:`, error);
    throw error;
  } finally {
    if (channel) await channel.close();
  }
}

purgeQueue("voteQueue");
