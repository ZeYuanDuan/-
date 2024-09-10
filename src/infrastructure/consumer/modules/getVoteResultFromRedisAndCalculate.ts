import {
  getOptionIds,
  getOptionVotes,
} from "../../../models/redis/services/voteService";

interface VoteData {
  id: number;
  totalVotes: number;
  options: {
    id: string;
    votes: number;
    percentage: string;
  }[];
}

export async function getVoteResultFromRedisAndCalculate(
  voteId: string
): Promise<VoteData | null> {
  try {
    const optionIds = await getOptionIds(voteId);

    if (optionIds.length === 0) {
      return null;
    }

    let totalVotes = 0;
    const optionsData = await Promise.all(
      optionIds.map(async (optionId) => {
        const votes = await getOptionVotes(voteId, optionId);
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
