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

// 新增同步投票數據到 Redis 的方法
export async function syncVoteDataToRedis(
  voteId: number,
  optionIds: number[]
): Promise<void> {
  const voteIdStr = voteId.toString();

  const optionsKey = REDIS_KEYS.voteOptions(voteIdStr);
  await redisClient.rpush(optionsKey, ...optionIds.map((id) => id.toString()));

  const responseKey = REDIS_KEYS.voteResponse(voteIdStr);
  await redisClient.rpush(responseKey, "");

  for (const optionId of optionIds) {
    const optionKey = REDIS_KEYS.voteOption(voteIdStr, optionId.toString());
    await redisClient.set(optionKey, "0");
  }
}

// 新增刪除 Redis 中投票數據的方法
export async function deleteVoteFromRedis(voteId: string): Promise<void> {
  const optionIds = await getOptionIds(voteId);

  const multi = redisClient.multi();

  multi.del(REDIS_KEYS.voteOptions(voteId));

  multi.del(REDIS_KEYS.voteResponse(voteId));

  for (const optionId of optionIds) {
    multi.del(REDIS_KEYS.voteOption(voteId, optionId));
  }

  try {
    await multi.exec();
  } catch (error) {
    console.error("删除 Redis 中的投票数据时发生错误:", error);
    throw new Error("删除 Redis 中的投票数据失败");
  }
}
