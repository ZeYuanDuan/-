import { Server } from "socket.io";
import { createChannel } from "../models/rabbitMQ/config";
import { QUEUE_NAME } from "./modules/constants";
import { setupSocketConnection } from "./modules/setupSocketConnection";
import { setupVoteConsumer } from "./modules/setupVoteConsumer";

const io = new Server();
export { io };

export async function setupVoteWebSockets(io: Server) {
  const channel = await createChannel();
  await channel.assertQueue(QUEUE_NAME, { durable: true });

  await setupVoteConsumer(channel, io);
  setupSocketConnection(io, channel);
}
