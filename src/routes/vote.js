const express = require("express");
const router = express.Router();

// 定義 /vote 路徑下的路由
router.post("/", (req, res) => {
  // 建立投票
  res.send("Create vote");
});

router.post("/:id", (req, res) => {
  // 處理投票邏輯
  res.send(`Vote for the topic ${req.params.id}`);
});

router.get("/:id", (req, res) => {
  // 獲取投票結果邏輯
  res.send(`Vote result for the topic ${req.params.id}`);
});

module.exports = router;
