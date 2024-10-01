import { executeQuery } from "../config";

interface VoteResult {
  id: number;
  option_name: string;
  votes: number;
}

interface VoteData {
  id: number;
  title: string;
  description: string;
  totalVotes: number;
  created_at: string;
  updated_at: string;
  options: {
    id: number;
    name: string;
    votes: number;
    percentage: string;
  }[];
}

export async function getAllVotesFromMysql(): Promise<VoteData[]> {
  const votesQuery = `
    SELECT v.id, v.title, v.description, 
    COUNT(DISTINCT r.id) as totalVotes,
    v.created_at, v.updated_at
    FROM votes v
    LEFT JOIN vote_options o ON v.id = o.vote_id
    LEFT JOIN vote_responses r ON o.id = r.option_id
    GROUP BY v.id, v.title, v.description, v.created_at, v.updated_at
  `;

  const votes = await executeQuery<{
    id: number;
    title: string;
    description: string;
    totalVotes: number;
    created_at: string;
    updated_at: string;
  }>(votesQuery);

  const voteDataPromises = votes.map(async (vote) => {
    const options = await getVoteOptionsFromMysql(vote.id);
    return {
      ...vote,
      options,
    };
  });

  return Promise.all(voteDataPromises);
}

export async function getVoteDataFromMysql(
  voteId: string | number
): Promise<VoteData | null> {
  const voteRows = await executeQuery<{
    title: string;
    description: string;
    created_at: string;
    updated_at: string;
  }>("SELECT title, description, created_at, updated_at FROM votes WHERE id = ?", [voteId]);

  if (voteRows.length === 0) {
    return null;
  }

  const vote = voteRows[0];

  // 獲取投票選項和票數
  const voteResults = await executeQuery<VoteResult>(
    `SELECT o.id, o.option_name, COUNT(r.id) AS votes
    FROM vote_options o
    LEFT JOIN vote_responses r ON o.id = r.option_id
    WHERE o.vote_id = ?
    GROUP BY o.id, o.option_name`,
    [voteId]
  );

  const totalVotes = voteResults.reduce(
    (sum, option) => sum + Number(option.votes),
    0
  );

  const optionsWithPercentage = voteResults.map((opt) => ({
    id: opt.id,
    name: opt.option_name,
    votes: Number(opt.votes),
    percentage:
      totalVotes > 0
        ? ((Number(opt.votes) / totalVotes) * 100).toFixed(2) + "%"
        : "0%",
  }));

  return {
    id: Number(voteId),
    title: vote.title,
    description: vote.description,
    created_at: vote.created_at,
    updated_at: vote.updated_at,
    totalVotes,
    options: optionsWithPercentage,
  };
}

async function getVoteOptionsFromMysql(voteId: number) {
  const optionsQuery = `
    SELECT o.id, o.option_name, COUNT(r.id) as votes
    FROM vote_options o
    LEFT JOIN vote_responses r ON o.id = r.option_id
    WHERE o.vote_id = ?
    GROUP BY o.id, o.option_name
  `;

  const options = await executeQuery<VoteResult>(optionsQuery, [voteId]);

  const totalVotes = options.reduce(
    (sum, option) => sum + Number(option.votes),
    0
  );

  return options.map((opt) => ({
    id: opt.id,
    name: opt.option_name,
    votes: Number(opt.votes),
    percentage:
      totalVotes > 0
        ? ((Number(opt.votes) / totalVotes) * 100).toFixed(2) + "%"
        : "0%",
  }));
}
