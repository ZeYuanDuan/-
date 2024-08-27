import { getConnection, createChannel } from "./config";

async function testRabbitMQConnection() {
  try {
    console.log("嘗試連接到 RabbitMQ...");
    const connection = await getConnection();
    console.log("成功連接到 RabbitMQ");

    console.log("嘗試創建通道...");
    const channel = await createChannel();
    console.log("成功創建通道");

    // 可選：嘗試創建一個測試隊列
    const queueName = "test_queue";
    await channel.assertQueue(queueName, { durable: false });
    console.log(`成功創建測試隊列: ${queueName}`);

    // 關閉通道和連接
    await channel.close();
    await connection.close();
    console.log("成功關閉通道和連接");

    console.log("RabbitMQ 連接測試成功完成");
  } catch (error) {
    console.error("RabbitMQ 連接測試失敗:", error);
  }
}

testRabbitMQConnection();
