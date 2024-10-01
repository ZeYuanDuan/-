import express from "express";
import path from "path";
import voteControllers from "../controllers/vote-controllers";

const router = express.Router();

// 定義 /vote 路徑下的路由
router.get("/", voteControllers.getVotes);

router.post("/", voteControllers.createVote);

router.post("/:id", voteControllers.voteForTopic); // ? 這是幹嘛用的？？？

router.get("/:id", voteControllers.getVoteResult);

router.put("/:id", voteControllers.updateVote);

router.delete("/:id", voteControllers.deleteVote);

export default router;
