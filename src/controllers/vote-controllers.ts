import { Request, Response } from "express";
import {
  getVoteDataFromMysql,
  getAllVotesFromMysql,
  deleteVoteFromMysql,
  createVoteInMysql,
  updateVoteInMysql,
} from "../models/mysql/services/voteService";
import { syncVoteDataToRedis } from "../models/redis/services/voteService";
import { storeVoteDataToRedis } from "../infrastructure/consumer/modules/storeVoteDataToRedis";
import { deleteVoteFromRedis } from "../models/redis/services/voteService";

interface VoteControllers {
  getVotes: (req: Request, res: Response) => Promise<void>;
  createVote: (req: Request, res: Response) => Promise<void>;
  voteForTopic: (req: Request, res: Response) => Promise<void>;
  getVoteResult: (req: Request, res: Response) => Promise<void>;
  deleteVote: (req: Request, res: Response) => Promise<void>;
  updateVote: (req: Request, res: Response) => Promise<void>;
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

    try {
      const newVote = await createVoteInMysql(title, description, options);

      await syncVoteDataToRedis(
        newVote.id,
        newVote.options.map((opt) => opt.id)
      );

      res.status(201).json({
        success: true,
        data: { vote: newVote },
        message: "投票創建成功",
      });
    } catch (error) {
      console.error("創建投票時發生錯誤:", error);
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: "創建投票時發生錯誤",
          details: (error as Error).message,
        },
      });
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

    try {
      const mysqlSuccess = await deleteVoteFromMysql(Number(id));

      if (!mysqlSuccess) {
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

      try {
        await deleteVoteFromRedis(id);
      } catch (redisError) {
        console.error("刪除 Redis 中的投票數據時發生錯誤:", redisError);
      }

      res.status(200).json({
        success: true,
        data: null,
        message: "投票刪除成功",
      });
    } catch (error) {
      console.error("刪除投票時發生錯誤:", error);
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: "刪除投票時發生錯誤",
          details: (error as Error).message,
        },
      });
    }
  },

  // 修改投票
  updateVote: async (req: Request, res: Response): Promise<void> => {
    const { id } = req.params;
    const { title, description, options } = req.body;

    if (
      !id ||
      !title ||
      !options ||
      !Array.isArray(options) ||
      options.length < 2
    ) {
      res.status(400).json({
        success: false,
        data: null,
        error: {
          message: "參數錯誤",
          details: "投票ID、標題和至少兩個選項都是必須的",
        },
      });
      return;
    }

    try {
      const updatedVote = await updateVoteInMysql(
        Number(id),
        title,
        description,
        options
      );
      if (!updatedVote) {
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
      try {
        await deleteVoteFromRedis(id);

        await syncVoteDataToRedis(
          updatedVote.id,
          updatedVote.options.map((opt) => opt.id)
        );
      } catch (redisError) {
        console.error("更新 Redis 中的投票數據時發生錯誤:", redisError);
      }

      res.status(200).json({
        success: true,
        data: { vote: updatedVote },
        message: "投票修改成功",
      });
    } catch (error) {
      console.error("修改投票時發生錯誤:", error);
      res.status(500).json({
        success: false,
        data: null,
        error: {
          message: "修改投票時發生錯誤",
          details: (error as Error).message,
        },
      });
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
