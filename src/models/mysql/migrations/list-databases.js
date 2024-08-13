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

  return JSON.parse(response.SecretString); // 返回解析後的 JSON 對象
}

// 連接資料庫並列出所有資料庫名稱
async function listDatabases() {
  const secret = await getSecret();

  const connection = await mysql.createConnection({
    host: process.env.DB_HOST, // 使用環境變數
    port: process.env.DB_PORT, // 使用環境變數
    user: secret.username,
    password: secret.password,
  });

  try {
    const [rows] = await connection.query("SHOW DATABASES;");
    console.log("Databases:", rows);
  } catch (err) {
    console.error("Error executing query:", err.stack);
  } finally {
    await connection.end();
  }
}

listDatabases();
