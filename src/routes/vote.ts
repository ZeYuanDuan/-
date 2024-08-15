import express from "express";
import voteControllers from "../controllers/vote-controllers";

const router = express.Router();

// 定義 /vote 路徑下的路由
router.post("/", voteControllers.createVote);

router.post("/:id", voteControllers.voteForTopic);

router.get("/:id", voteControllers.getVoteResult);

export default router;