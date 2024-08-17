import { PoolConnection, RowDataPacket } from "mysql2/promise";
import { getConnection, releaseConnection } from "../models/mysql/config";

interface VoteProcessingResult {
  success: boolean;
  error?: {
    message: string;
    details: string;
  };
}

export async function processVote(
  voteId: string,
  optionId: string,
  voterName: string
): Promise<VoteProcessingResult> {
  if (!voteId || !optionId || !voterName) {
    return {
      success: false,
      error: {
        message: "缺少必要參數",
        details: "投票ID、選項ID和投票者姓名都是必須的",
      },
    };
  }

  let connection: PoolConnection | null = null;
  try {
    connection = await getConnection();
    await connection.beginTransaction();

    // 檢查選項是否存在
    const [optionRows] = await connection.query<RowDataPacket[]>(
      "SELECT * FROM vote_options WHERE id = ? AND vote_id = ?",
      [optionId, voteId]
    );
    if (optionRows.length === 0) {
      await connection.rollback();
      return {
        success: false,
        error: {
          message: "選項未找到",
          details: "指定的選項在該投票中不存在",
        },
      };
    }

    // 插入投票回應
    await connection.query(
      "INSERT INTO vote_responses (vote_id, option_id, voter_name) VALUES (?, ?, ?)",
      [voteId, optionId, voterName]
    );

    await connection.commit();
    return { success: true };
  } catch (error) {
    if (connection) await connection.rollback();
    console.error("投票處理過程中發生錯誤:", error);
    return {
      success: false,
      error: {
        message: "投票處理時發生錯誤",
        details: (error as Error).message,
      },
    };
  } finally {
    if (connection) releaseConnection(connection);
  }
}
