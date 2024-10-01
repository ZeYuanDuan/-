import { Request, Response } from "express";
import { PoolConnection, ResultSetHeader } from "mysql2/promise";
import { getConnection, releaseConnection } from "../models/mysql/config";
import {
  getVoteDataFromMysql,
  getAllVotesFromMysql,
} from "../models/mysql/services/voteService";
import { storeVoteDataToRedis } from "../infrastructure/consumer/modules/storeVoteDataToRedis";

interface VoteOption {
  id: number;
  option_name: string;
}

interface VoteControllers {
  getVotes: (req: Request, res: Response) => Promise<void>;
  createVote: (req: Request, res: Response) => Promise<void>;
  voteForTopic: (req: Request, res: Response) => Promise<void>;
  getVoteResult: (req: Request, res: Response) => Promise<void>;
  deleteVote: (req: Request, res: Response) => Promise<void>;
}

const voteControllers: VoteControllers = {
  // 獲取所有投票
  getVotes: async (req: Request, res: Response): Promise<void> => {
    try {
      const votes = await getAllVotesFromMysql();
      res.status(200).json({
        success: true,
        data: { votes },
        message: "投票列表獲取成功",
      });
    } catch (error) {
      console.error("獲取投票列表時發生錯誤:", error);
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: "獲取投票列表時發生錯誤",
          details: (error as Error).message,
        },
      });
    }
  },

  // 創建新投票
  createVote: async (req: Request, res: Response): Promise<void> => {
    const { title, description, options } = req.body;

    // 檢查必要參數
    if (!title || !options || !Array.isArray(options) || options.length === 0) {
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

      // 獲取當前 UTC 時間
      const now = new Date().toISOString().slice(0, 19).replace("T", " ");
      console.log("當前時間:", now); // ! 測試用

      const [insertResult] = await connection.query<ResultSetHeader>(
        "INSERT INTO votes (title, description, created_at, updated_at) VALUES (?, ?, ?, ?)",
        [title, description, now, now]
      );
      const voteId = insertResult.insertId;

      const insertedOptions: VoteOption[] = [];
      for (let option of options) {
        // 插入投票選項
        const [insertResult] = await connection.query<ResultSetHeader>(
          "INSERT INTO vote_options (vote_id, option_name, created_at, updated_at) VALUES (?, ?, ?, ?)",
          [voteId, option, now, now]
        );

        const insertedId = insertResult.insertId;

        insertedOptions.push({
          id: insertedId,
          option_name: option,
        } as VoteOption);
      }

      await connection.commit();

      res.status(201).json({
        success: true,
        data: {
          vote: {
            id: voteId,
            title,
            description,
            created_at: now,
            updated_at: now,
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

  // 刪除投票
  deleteVote: async (req: Request, res: Response): Promise<void> => {
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

    let connection: PoolConnection | null = null;
    try {
      connection = await getConnection();
      await connection.beginTransaction();

      // 刪除相關的投票選項
      await connection.query("DELETE FROM vote_options WHERE vote_id = ?", [
        id,
      ]);

      // 刪除投票
      const [result] = await connection.query<ResultSetHeader>(
        "DELETE FROM votes WHERE id = ?",
        [id]
      );

      if (result.affectedRows === 0) {
        await connection.rollback();
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

      await connection.commit();

      res.status(200).json({
        success: true,
        data: null,
        message: "投票刪除成功",
      });
    } catch (error) {
      if (connection) await connection.rollback();
      console.error("刪除投票時發生錯誤:", error);
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: "刪除投票時發生錯誤",
          details: (error as Error).message,
        },
      });
    } finally {
      if (connection) releaseConnection(connection);
    }
  },

  // 處理用戶投票
  voteForTopic: async (req: Request, res: Response): Promise<void> => {
    const { id: voteId } = req.params;
    const { optionId, voterName } = req.body;

    const result = await storeVoteDataToRedis(voteId, optionId, voterName);

    if (!result.success) {
      res.status(result.error?.message === "選項未找到" ? 404 : 400).json({
        success: false,
        data: null,
        error: result.error,
      });
      return;
    }

    res.status(200).json({
      success: true,
      data: { voteId, optionId, voterName },
      message: "投票提交成功",
    });
  },

  // 獲取投票結果
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
      const voteData = await getVoteDataFromMysql(id);

      if (!voteData) {
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

      res.status(200).json({
        success: true,
        data: { vote: voteData },
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
