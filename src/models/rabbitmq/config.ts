import amqp from "amqplib";

let connection: amqp.Connection | null = null;

export async function getConnection(): Promise<amqp.Connection> {
  if (!connection) {
    connection = await amqp.connect("amqp://localhost");
  }
  return connection;
}

export async function createChannel(): Promise<amqp.Channel> {
  const conn = await getConnection();
  return conn.createChannel();
}
