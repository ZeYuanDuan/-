import amqp from "amqplib";

export async function getConnection(retries = 5, delay = 2000): Promise<amqp.Connection> {
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const connection = await amqp.connect({
        hostname: "rabbitmq",
        port: 5672,
        username: "guest",
        password: "guest",
      });
      console.log("成功連接到 RabbitMQ");
      return connection;
    } catch (error) {
      console.error(`連接嘗試 ${attempt} 失敗:`, error);
      if (attempt === retries) throw error;
      await new Promise(resolve => setTimeout(resolve, delay));
    }
  }
  throw new Error("無法連接到 RabbitMQ");
}

export async function createChannel(): Promise<amqp.Channel> {
  const conn = await getConnection();
  return conn.createChannel();
}
