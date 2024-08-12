const express = require('express');
const router = express.Router();

// 將 /vote 開頭的路徑配置到 vote.js
const voteRoutes = require('./vote');
router.use('/vote', voteRoutes);

module.exports = router;
