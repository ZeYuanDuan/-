import { executeQuery, getConnection, releaseConnection } from "../config";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";

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

interface ExtractedResponse {
  optionId: number;
  encodedVoterName: string;
  votedAt: string;
}

export async function getAllVoteIds(): Promise<number[]> {
  const query = "SELECT id FROM votes";
  const results = await executeQuery<{ id: number }>(query);
  return results.map((result) => result.id);
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
  }>(
    "SELECT title, description, created_at, updated_at FROM votes WHERE id = ?",
    [voteId]
  );

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

export async function deleteVoteFromMysql(voteId: number): Promise<boolean> {
  let connection: PoolConnection | null = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // 刪除相關的投票選項
    await connection.query("DELETE FROM vote_options WHERE vote_id = ?", [
      voteId,
    ]);

    // 刪除投票
    const [result] = await connection.query<ResultSetHeader>(
      "DELETE FROM votes WHERE id = ?",
      [voteId]
    );

    if (result.affectedRows === 0) {
      await connection.rollback();
      return false;
    }

    await connection.commit();
    return true;
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) releaseConnection(connection);
  }
}

export async function createVoteInMysql(
  title: string,
  description: string,
  options: string[]
): Promise<VoteData> {
  let connection: PoolConnection | null = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    const [insertResult] = await connection.query<ResultSetHeader>(
      "INSERT INTO votes (title, description, created_at, updated_at) VALUES (?, ?, ?, ?)",
      [title, description, now, now]
    );
    const voteId = insertResult.insertId;

    const insertedOptions = [];
    for (let option of options) {
      const [insertResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO vote_options (vote_id, option_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
        [voteId, option, now, now]
      );

      insertedOptions.push({
        id: insertResult.insertId,
        name: option,
        votes: 0,
        percentage: "0%",
      });
    }

    await connection.commit();

    return {
      id: voteId,
      title,
      description,
      created_at: now,
      updated_at: now,
      totalVotes: 0,
      options: insertedOptions,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) releaseConnection(connection);
  }
}

export async function updateVoteInMysql(
  id: number,
  title: string,
  description: string,
  options: string[]
): Promise<VoteData | null> {
  let connection: PoolConnection | null = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const now = new Date().toISOString().slice(0, 19).replace("T", " ");

    // 首先獲取原始的創建時間
    const [originalVoteData] = await connection.query<any[]>(
      "SELECT created_at FROM votes WHERE id = ?",
      [id]
    );

    if (originalVoteData.length === 0) {
      await connection.rollback();
      return null;
    }

    const originalCreatedAt = originalVoteData[0].created_at;

    const [updateResult] = await connection.query<ResultSetHeader>(
      "UPDATE votes SET title = ?, description = ?, updated_at = ? WHERE id = ?",
      [title, description, now, id]
    );

    if (updateResult.affectedRows === 0) {
      await connection.rollback();
      return null;
    }

    await connection.query("DELETE FROM vote_options WHERE vote_id = ?", [id]);

    const insertedOptions = [];
    for (let option of options) {
      const [insertResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO vote_options (vote_id, option_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
        [id, option, now, now]
      );

      insertedOptions.push({
        id: insertResult.insertId,
        name: option,
        votes: 0,
        percentage: "0%",
      });
    }

    await connection.commit();

    return {
      id,
      title,
      description,
      updated_at: now,
      created_at: originalCreatedAt,
      totalVotes: 0,
      options: insertedOptions,
    };
  } catch (error) {
    if (connection) await connection.rollback();
    throw error;
  } finally {
    if (connection) releaseConnection(connection);
  }
}

export async function saveExtractedResponsesToMysql(
  voteId: number,
  extractedResponses: ExtractedResponse[]
): Promise<void> {
  let connection: PoolConnection | null = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    const insertQuery = `
      INSERT INTO vote_responses (vote_id, option_id, voter_name, voted_at)
      VALUES (?, ?, ?, ?)
    `;

    for (const response of extractedResponses) {
      await connection.query(insertQuery, [
        voteId,
        response.optionId,
        response.encodedVoterName,
        response.votedAt,
      ]);
    }

    await connection.commit();
    console.log(`成功將 ${extractedResponses.length} 條投票響應保存到 MySQL`);
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("保存提取的響應到 MySQL 時出錯:", error);
    throw error;
  } finally {
    if (connection) releaseConnection(connection);
  }
}
