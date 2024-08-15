import express from 'express';
const router = express.Router();

// 將 /vote 開頭的路徑配置到 vote.ts
import voteRoutes from './vote';
router.use('/vote', voteRoutes);

export default router;