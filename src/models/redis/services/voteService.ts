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

// 在 WS 持續時，將投票數據存入 Redis 的臨時鍵
export async function storeVoteResponse(
  voteId: string,
  voterName: string,
  optionId: string
): Promise<void> {
  const tempResponseKey = REDIS_KEYS.voteTempResponse(voteId);
  const voteTime = new Date().toISOString();
  const encodedVoterName = encodeURIComponent(voterName);
  const voteData = `${encodedVoterName}::${optionId}::${voteTime}`;

  try {
    await redisClient.rpush(tempResponseKey, voteData);
  } catch (error) {
    console.error(`存儲投票響應時發生錯誤: ${error}`);

    try {
      await redisClient.rpush(tempResponseKey, voteData);
    } catch (retryError) {
      console.error(`重試存儲投票響應時發生錯誤: ${retryError}`);
      throw new Error("無法存儲投票響應");
    }
  }
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

// 同步投票數據到 Redis 的方法
export async function syncVoteDataToRedis(
  voteId: number,
  optionIds: number[]
): Promise<void> {
  const voteIdStr = voteId.toString();

  const optionsKey = REDIS_KEYS.voteOptions(voteIdStr);
  await redisClient.rpush(optionsKey, ...optionIds.map((id) => id.toString()));

  const responseKey = REDIS_KEYS.voteResponse(voteIdStr);

  for (const optionId of optionIds) {
    const optionKey = REDIS_KEYS.voteOption(voteIdStr, optionId.toString());
    await redisClient.set(optionKey, "0");
  }

  // 設置投票狀態，預設為 false（使用 "0" 表示）
  const statusKey = REDIS_KEYS.voteStatus(voteIdStr);
  await redisClient.set(statusKey, "0");
}

// 刪除 Redis 中投票數據的方法
export async function deleteVoteFromRedis(voteId: string): Promise<void> {
  const optionIds = await getOptionIds(voteId);

  const multi = redisClient.multi();

  multi.del(REDIS_KEYS.voteOptions(voteId));

  multi.del(REDIS_KEYS.voteResponse(voteId));

  for (const optionId of optionIds) {
    multi.del(REDIS_KEYS.voteOption(voteId, optionId));
  }

  multi.del(REDIS_KEYS.voteStatus(voteId));

  try {
    await multi.exec();
  } catch (error) {
    console.error("刪除 Redis 中的投票數據發生錯誤:", error);
    throw new Error("刪除 Redis 中的投票數據失敗");
  }
}

// 更新投票狀態的方法
export async function updateVoteStatus(
  voteId: string,
  status: boolean
): Promise<void> {
  const statusKey = REDIS_KEYS.voteStatus(voteId);
  const statusValue = status ? "1" : "0";
  await redisClient.set(statusKey, statusValue);
}

// 新增創建臨時響應鍵的方法
export async function createTempResponseKey(voteId: string): Promise<void> {
  const tempResponseKey = REDIS_KEYS.voteTempResponse(voteId);
  await redisClient.del(tempResponseKey);
}

export async function transferTempResponseToResponse(
  voteId: string
): Promise<void> {
  const tempResponseKey = REDIS_KEYS.voteTempResponse(voteId);
  const responseKey = REDIS_KEYS.voteResponse(voteId);

  try {
    const tempResponses = await redisClient.lrange(tempResponseKey, 0, -1);

    if (tempResponses.length > 0) {
      await redisClient.rpush(responseKey, ...tempResponses);
    }

    await redisClient.del(tempResponseKey);
  } catch (error) {
    console.error(`轉移臨時響應數據時發生錯誤: ${error}`);
    throw new Error("無法轉移臨時響應數據");
  }
}

export async function extractTempResponses(
  voteId: string
): Promise<
  Array<{ encodedVoterName: string; optionId: string; votedAt: string }>
> {
  const tempResponseKey = REDIS_KEYS.voteTempResponse(voteId);
  const responses = await redisClient.lrange(tempResponseKey, 0, -1);

  return responses.map((response) => {
    const [encodedVoterName, optionId, votedAt] = response.split("::");
    return {
      encodedVoterName,
      optionId,
      votedAt,
    };
  });
}
