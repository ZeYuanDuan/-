import redisClient from "../models/redis/config";

interface VoteData {
  id: number;
  totalVotes: number;
  options: {
    id: string;
    votes: number;
    percentage: string;
  }[];
}

export async function getVoteData(
  voteId: string | number
): Promise<VoteData | null> {
  try {
    const voteOptionsKey = `vote:${voteId}:options`;

    // 獲取選項ID
    const optionIds = await redisClient.smembers(voteOptionsKey);

    if (optionIds.length === 0) {
      return null;
    }

    let totalVotes = 0;
    const optionsData = await Promise.all(
      optionIds.map(async (optionId) => {
        const optionKey = `vote:${voteId}:option:${optionId}`;
        const votes = parseInt((await redisClient.get(optionKey)) || "0");
        totalVotes += votes;

        return { id: optionId, votes };
      })
    );

    const optionsWithPercentage = optionsData.map((opt) => ({
      ...opt,
      percentage:
        totalVotes > 0
          ? ((opt.votes / totalVotes) * 100).toFixed(2) + "%"
          : "0%",
    }));

    return {
      id: Number(voteId),
      totalVotes,
      options: optionsWithPercentage,
    };
  } catch (error) {
    console.error("獲取投票數據時發生錯誤:", error);
    return null;
  }
}
