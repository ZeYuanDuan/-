import dotenv from "dotenv";
import {
  SecretsManagerClient,
  GetSecretValueCommand,
} from "@aws-sdk/client-secrets-manager";
import mysql from "mysql2/promise";

dotenv.config(); // 加載 .env 文件中的環境變數

// 從環境變量中讀取 secret_name 和 region
const secret_name = process.env.AWS_SECRET_NAME;
const region = process.env.AWS_REGION;

if (!secret_name || !region) {
  throw new Error("AWS_SECRET_NAME 或 AWS_REGION 環境變量未設置");
}

// 創建 Secrets Manager 客戶端
const client = new SecretsManagerClient({
  region: region,
});

interface DatabaseSecret {
  username: string;
  password: string;
}

// 獲取秘密
async function getSecret(): Promise<DatabaseSecret> {
  try {
    const response = await client.send(
      new GetSecretValueCommand({
        SecretId: secret_name,
        VersionStage: "AWSCURRENT", // 默認為 AWSCURRENT
      })
    );
    return JSON.parse(response.SecretString || "{}");
  } catch (error) {
    console.error("Error retrieving secret:", error);
    throw error;
  }
}

let pool: mysql.Pool | null = null;

async function initializePool(): Promise<void> {
  if (pool) return;

  const secret = await getSecret();
  pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: parseInt(process.env.DB_PORT || "3306"),
    user: secret.username,
    password: secret.password,
    database: process.env.DB_NAME,
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
    console.error("Error connecting to the database:", err);
    throw err;
  }
}

export async function getConnection(): Promise<mysql.PoolConnection> {
  if (!pool) {
    await initializePool();
  }
  return pool!.getConnection();
}

export async function releaseConnection(
  connection: mysql.PoolConnection
): Promise<void> {
  connection.release();
}

export async function executeQuery<T>(
  query: string,
  params?: any[]
): Promise<T[]> {
  const connection = await getConnection();
  try {
    const [results] = await connection.query(query, params);
    return results as T[];
  } finally {
    releaseConnection(connection);
  }
}

// 初始化連接池
initializePool().catch(console.error);
