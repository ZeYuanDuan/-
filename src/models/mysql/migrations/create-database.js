require("dotenv").config(); // 加載 .env 文件中的環境變數
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const mysql = require("mysql2/promise");

// 設定 secret_name 和 AWS 連接的區域
const secret_name = "rds!db-f200bc9a-59ac-4198-91fb-acf6b9e5917a"; // 你的 Secret 名稱
const region = "ap-northeast-1";

// 創建 Secrets Manager 客戶端
const client = new SecretsManagerClient({
  region: region,
});

// 獲取秘密
async function getSecret() {
  let response;
  try {
    response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", // 默認為 AWSCURRENT
      })
    );
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }

  return JSON.parse(response.SecretString); // 返回解析後的 JSON 對象
}

// 使用 Secret 中的用戶名和密碼創建 MySQL 資料庫
async function createDatabase() {
  const secret = await getSecret();

  const connection = await mysql.createConnection({
    host: "127.0.0.1", // 本地回環地址
    port: 3307, // SSH 隧道的本地端口
    user: secret.username, // 從 Secret 中獲取用戶名
    password: secret.password, // 從 Secret 中獲取密碼
  });

  try {
    await connection.query("CREATE DATABASE `rtv-db`;");
    console.log("Database 'rtv-db' created successfully.");
  } catch (err) {
    console.error("Error creating database:", err.stack);
  } finally {
    await connection.end();
  }
}

createDatabase();
