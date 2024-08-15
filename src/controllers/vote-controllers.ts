import { Request, Response } from "express";
import { RowDataPacket, PoolConnection } from "mysql2/promise";
import { getConnection, releaseConnection, executeQuery } from "../models/mysql/config";

interface VoteOption {
  id: number;
  option_name: string;
}

interface VoteResult extends VoteOption {
  votes: number;
}

interface VoteControllers {
  createVote: (req: Request, res: Response) => Promise<void>;
  voteForTopic: (req: Request, res: Response) => Promise<void>;
  getVoteResult: (req: Request, res: Response) => Promise<void>;
}

const voteControllers: VoteControllers = {
  // ! 創建新投票
  createVote: async (req: Request, res: Response): Promise<void> => {
    const { title, description, options } = req.body;

    // 檢查必要參數
    if (!title || !description || !options || !Array.isArray(options) || options.length === 0) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          message: "參數錯誤",
          details: "標題、描述和至少一個選項都是必須的",
        },
      });
      return;
    }

    let connection: PoolConnection | null = null;
    try {
      connection = await getConnection();
      await connection.beginTransaction();

      // 插入新投票記錄
      const [result] = await connection.query<RowDataPacket[]>(
        "INSERT INTO votes (title, description) VALUES (?, ?) RETURNING id",
        [title, description]
      );
      const voteId = (result[0] as RowDataPacket).id;

      // 插入投票選項
      const insertedOptions: VoteOption[] = [];
      for (let option of options) {
        const [optionRows] = await connection.query<RowDataPacket[]>(
          "INSERT INTO vote_options (vote_id, option_name) VALUES (?, ?) RETURNING id, option_name",
          [voteId, option]
        );
        insertedOptions.push(optionRows[0] as VoteOption);
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        data: {
          vote: {
            id: voteId,
            title,
            description,
            options: insertedOptions.map((opt) => ({
              id: opt.id,
              name: opt.option_name,
            })),
          },
        },
        message: "投票創建成功",
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("創建投票時發生錯誤:", error);
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: "創建投票時發生錯誤",
          details: (error as Error).message,
        },
      });
    } finally {
      if (connection) releaseConnection(connection);
    }
  },

  // ! 處理用戶投票
  voteForTopic: async (req: Request, res: Response): Promise<void> => {
    const { id: voteId } = req.params;
    const { optionId, voterName } = req.body;

    if (!voteId || !optionId || !voterName) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          message: "缺少必要參數",
          details: "投票ID、選項ID和投票者姓名都是必須的",
        },
      });
      return;
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
        res.status(404).json({
          success: false,
          data: null,
          error: {
            message: "選項未找到",
            details: "指定的選項在該投票中不存在",
          },
        });
        return;
      }

      // 插入投票回應
      await connection.query(
        "INSERT INTO vote_responses (vote_id, option_id, voter_name) VALUES (?, ?, ?)",
        [voteId, optionId, voterName]
      );

      await connection.commit();

      res.status(200).json({
        success: true,
        data: { voteId, optionId, voterName },
        message: "投票提交成功",
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("投票過程中發生錯誤:", error);
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: "投票時發生錯誤",
          details: (error as Error).message,
        },
      });
    } finally {
      if (connection) releaseConnection(connection);
    }
  },

  // ! 獲取投票結果
  getVoteResult: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;

    if (!id) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          message: "缺少必要參數",
          details: "投票ID是必須的",
        },
      });
      return;
    }

    try {
      // 獲取投票基本信息
      const voteRows = await executeQuery<{ title: string; description: string }>(
        "SELECT title, description FROM votes WHERE id = ?",
        [id]
      );
      
      if (voteRows.length === 0) {
        res.status(404).json({
          success: false,
          data: null,
          error: {
            message: "投票未找到",
            details: "指定的投票ID不存在",
          },
        });
        return;
      }
      
      const vote = voteRows[0];

      // 獲取投票選項和票數
      const voteResults = await executeQuery<VoteResult>(
        `SELECT o.id, o.option_name, COUNT(r.id) AS votes
        FROM vote_options o
        LEFT JOIN vote_responses r ON o.id = r.option_id
        WHERE o.vote_id = ?
        GROUP BY o.id, o.option_name`,
        [id]
      );

      const totalVotes = voteResults.reduce((sum, option) => sum + Number(option.votes), 0);

      const optionsWithPercentage = voteResults.map((opt) => ({
        id: opt.id,
        name: opt.option_name,
        votes: Number(opt.votes),
        percentage: totalVotes > 0 ? ((Number(opt.votes) / totalVotes) * 100).toFixed(2) + "%" : "0%",
      }));

      res.status(200).json({
        success: true,
        data: {
          vote: {
            id: parseInt(id),
            title: vote.title,
            description: vote.description,
            totalVotes,
            options: optionsWithPercentage,
          },
        },
        message: "投票結果獲取成功",
      });
    } catch (error) {
      console.error("獲取投票結果時發生錯誤:", error);
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: "獲取投票結果時發生錯誤",
          details: (error as Error).message,
        },
      });
    }
  },
};

export default voteControllers;