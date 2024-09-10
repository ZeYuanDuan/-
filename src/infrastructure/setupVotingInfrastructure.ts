import { setupVoteConsumer } from "./consumer/setupVoteConsumer";
import { setupSocketConnection } from "./websocket/setupSocketConnection";
import { createChannel } from "../models/rabbitMQ/config";
import { Server } from "socket.io";

export async function setupVotingInfrastructure(io: Server) {
  const channel = await createChannel();

  await setupVoteConsumer(channel, io);
  setupSocketConnection(io, channel);
}
