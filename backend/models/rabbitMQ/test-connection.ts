import { getConnection, createChannel } from "./config";
import dotenv from "dotenv";

dotenv.config();

async function wait(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function testRabbitMQConnection(retries = 5, delay = 2000) {
  console.log("開始 RabbitMQ 連接測試...");
  
  // 檢查環境變量
  console.log("環境變量檢查：");
  console.log(`RABBITMQ_DEFAULT_USER: ${process.env.RABBITMQ_DEFAULT_USER ? '已設置' : '未設置'}`);
  console.log(`RABBITMQ_DEFAULT_PASS: ${process.env.RABBITMQ_DEFAULT_PASS ? '已設置' : '未設置'}`);

  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      console.log(`\n嘗試連接 RabbitMQ (第 ${attempt}/${retries} 次)...`);
      const connection = await getConnection();
      console.log("成功建立連接！");

      console.log("嘗試創建通道...");
      const channel = await createChannel();
      console.log("成功創建通道！");

      // 測試隊列操作
      const testQueue = "connection_test_queue";
      console.log(`嘗試創建測試隊列: ${testQueue}`);
      const queueInfo = await channel.assertQueue(testQueue, { durable: false });
      console.log("隊列信息:", {
        queue: queueInfo.queue,
        messageCount: queueInfo.messageCount,
        consumerCount: queueInfo.consumerCount
      });

      // 測試消息發送和接收
      console.log("測試消息發送...");
      const testMessage = { test: "Hello RabbitMQ!" };
      await channel.sendToQueue(testQueue, Buffer.from(JSON.stringify(testMessage)));
      console.log("消息發送成功");

      // 清理資源
      console.log("\n開始清理測試資源...");
      await channel.deleteQueue(testQueue);
      await channel.close();
      await connection.close();
      console.log("成功清理所有資源");

      console.log("\nRabbitMQ 連接測試完全成功！");
      return;

    } catch (error) {
      console.error(`\n連接嘗試 ${attempt} 失敗:`, error);
      
      if (attempt < retries) {
        console.log(`等待 ${delay}ms 後重試...`);
        await wait(delay);
      } else {
        console.error("已達到最大重試次數，測試失敗");
        process.exit(1);
      }
    }
  }
}

// 執行測試
console.log("啟動 RabbitMQ 連接測試程序...");
testRabbitMQConnection().catch(error => {
  console.error("測試執行失敗:", error);
  process.exit(1);
});
