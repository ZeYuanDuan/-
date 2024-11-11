import express from "express";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3301;

// 路由設置
const router = express.Router();

// 設置靜態文件目錄
app.use(express.static(__dirname));

app.use("/", router);

// 主頁重定向
router.get("/", (req, res) => {
  res.redirect("/home");
});

// 各個頁面路由
router.get("/home", (req, res) => {
  res.sendFile(path.join(__dirname, "home/home.html"));
});

router.get("/voting", (req, res) => {
  res.sendFile(path.join(__dirname, "voting/voting.html"));
});

router.get("/participant-vote", (req, res) => {
  res.sendFile(path.join(__dirname, "participant-vote/voting.html"));
});

router.get("/create-vote", (req, res) => {
  res.sendFile(path.join(__dirname, "create-vote/create-vote.html"));
});

router.get("/update-vote", (req, res) => {
  res.sendFile(path.join(__dirname, "update-vote/update-vote.html"));
});

// 404 處理
router.use((req, res) => {
  res.status(404).send("頁面不存在");
});

app.listen(PORT, () => {
  console.log(`服務器運行在 http://localhost:${PORT}`);
});
