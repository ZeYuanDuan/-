import redisClient from "../config";
import { REDIS_KEYS } from "./redisKeys";

export async function checkOptionExists(
  voteId: string,
  optionId: string
): Promise<boolean> {
  const optionKey = REDIS_KEYS.voteOption(voteId, optionId);
  return (await redisClient.exists(optionKey)) === 1;
}

export async function incrementVote(
  voteId: string,
  optionId: string
): Promise<void> {
  const optionKey = REDIS_KEYS.voteOption(voteId, optionId);
  await redisClient.incr(optionKey);
}

export async function storeVoteResponse(
  voteId: string,
  voterName: string,
  optionId: string
): Promise<void> {
  const responseKey = REDIS_KEYS.voteResponse(voteId);
  await redisClient.rpush(responseKey, `${voterName}:${optionId}`);
}

// 新增獲取選項 ID 的方法
export async function getOptionIds(voteId: string): Promise<string[]> {
  const voteOptionsKey = REDIS_KEYS.voteOptions(voteId);
  return await redisClient.lrange(voteOptionsKey, 0, -1);
}

// 新增獲取選項投票數的方法
export async function getOptionVotes(
  voteId: string,
  optionId: string
): Promise<number> {
  const optionKey = REDIS_KEYS.voteOption(voteId, optionId);
  return parseInt((await redisClient.get(optionKey)) || "0");
}
