import { Server, Socket } from "socket.io";
import { processVote } from "../utils/vote-processing";
import { getVoteData } from "../utils/vote-data";
import { createChannel } from "../models/rabbitMQ/config";
import { Channel, ConsumeMessage } from "amqplib";

const io = new Server();
export { io };

const QUEUE_NAME = "vote_queue";

export async function setupVoteWebSockets(io: Server) {
  const channel = await createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  // 設置消費者
  await setupVoteConsumer(channel, io);

  io.on("connection", (socket: Socket) => {
    console.log(`新客戶端已連接，Socket ID: ${socket.id}`);

    socket.on("voteForTopic", async (data) => {
      const { voteId, optionId, voterName } = data;

      // 驗證投票數據
      if (!voteId || !optionId || !voterName) {
        socket.emit(`voteForTopic:${voteId}:error`, {
          success: false,
          error: "無效的投票數據",
        });
        return;
      }

      try {
        // 將投票數據發送到 RabbitMQ 隊列，並使用 persistent 選項確保消息持久化
        const sent = channel.sendToQueue(QUEUE_NAME, Buffer.from(JSON.stringify(data)), {
          persistent: true
        });

        if (sent) {
          // 發送確認消息給客戶端
          socket.emit(`voteForTopic:${voteId}:success`, {
            success: true,
            message: "投票已接收並正在處理",
          });
        } else {
          // 如果消息無法立即發送，等待 drain 事件
          await new Promise((resolve) => channel.once('drain', resolve));
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
    });
  });
}

async function setupVoteConsumer(channel: Channel, io: Server) {
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  // 設置預取數量為 1，確保在處理完一條消息之前不會接收新的消息
  await channel.prefetch(1);

  channel.consume(QUEUE_NAME, async (msg: ConsumeMessage | null) => {
    if (msg !== null) {
      const data = JSON.parse(msg.content.toString());
      const { voteId, optionId, voterName } = data;

      try {
        // 處理投票
        const result = await processVote(voteId, optionId, voterName);

        if (result.success) {
          // 更新投票結果並廣播給所有客戶端
          await getVoteResultWebSocket(io, voteId);
          // 確認消息已被成功處理
          channel.ack(msg);
        } else {
          console.error("處理投票時發生錯誤:", result.error);
          // 如果處理失敗，將消息重新排隊
          channel.nack(msg, false, true);
        }
      } catch (error) {
        console.error("處理從 RabbitMQ 接收的投票時發生錯誤:", error);
        // 如果處理過程中發生錯誤，將消息重新排隊
        channel.nack(msg, false, true);
      }
    }
  }, { noAck: false });  // 設置 noAck 為 false，啟用手動確認模式
}

async function getVoteResultWebSocket(
  io: Server,
  voteId: string
): Promise<void> {
  try {
    const voteData = await getVoteData(voteId);

    if (!voteData) {
      io.emit(`voteResult:${voteId}:error`, {
        success: false,
        error: {
          message: "投票未找到",
          details: "指定的投票ID不存在",
        },
      });
      return;
    }

    const result = {
      success: true,
      data: { vote: voteData },
      message: "投票結果獲取成功",
    };

    // 發送結果到所有連接的客戶端
    io.emit(`voteResult:${voteId}`, result);
  } catch (error) {
    console.error("獲取投票結果時發生錯誤:", error);
    io.emit(`voteResult:${voteId}:error`, {
      success: false,
      error: {
        message: "獲取投票結果時發生錯誤",
        details: (error as Error).message,
      },
    });
  }
}
