require("dotenv").config(); // 加載 .env 文件中的環境變數
const {
  SecretsManagerClient,
  GetSecretValueCommand,
} = require("@aws-sdk/client-secrets-manager");
const mysql = require("mysql2/promise");

// 設定 secret_name 和 AWS 連接的區域
const secret_name = "rds!db-f200bc9a-59ac-4198-91fb-acf6b9e5917a";
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

  const secret = JSON.parse(response.SecretString);
  console.log("Retrieved secret:", secret); // ! 列出 secret (測試)
  return secret; // 返回解析後的 JSON 對象
}

// 使用秘密創建 MySQL 連接池
async function createPool() {
  const secret = await getSecret();

  const pool = mysql.createPool({
    host: process.env.DB_HOST, // 使用環境變數
    port: process.env.DB_PORT, // 使用環境變數
    user: secret.username,
    password: secret.password,
    database: process.env.DB_NAME, // 使用環境變數
    waitForConnections: true,
    connectionLimit: 10, // 最大連接數
    queueLimit: 0, // 排隊限制
  });

  // 測試連接
  try {
    const connection = await pool.getConnection();
    console.log("Connected to the database as id " + connection.threadId);
    connection.release(); // 釋放連接回連接池
  } catch (err) {
    console.error("Error connecting to the database:", err.stack);
  }

  return pool;
}

// 調用 createPool 創建並導出連接池
const poolPromise = createPool();

module.exports = poolPromise;
