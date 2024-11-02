import { executeQuery } from "../config";
import { RowDataPacket } from 'mysql2/promise';

async function testQuery(): Promise<void> {
  console.log("開始測試數據庫連接...");
  console.log("環境變量檢查：");
  console.log(`DB_HOST: ${process.env.DB_HOST}`);
  console.log(`DB_PORT: ${process.env.DB_PORT}`);
  console.log(`DB_USER: ${process.env.DB_USER ? '已設置' : '未設置'}`);
  console.log(`DB_PASSWORD: ${process.env.DB_PASSWORD ? '已設置' : '未設置'}`);
  console.log(`DB_NAME: ${process.env.DB_NAME}`);
  
  try {
    console.log("嘗試執行測試查詢...");
    const rows = await executeQuery<RowDataPacket>("SELECT 1 + 1 AS solution");
    console.log("查詢成功執行");
    console.log("The solution is: ", (rows[0] as { solution: number }).solution);
    
    // 測試更多數據庫信息
    const [serverInfo] = await executeQuery<RowDataPacket>("SELECT @@hostname, @@port");
    console.log("數據庫服務器信息:", serverInfo);
  } catch (err) {
    console.error("連接測試失敗:");
    console.error("錯誤詳情:", (err as Error).message);
    console.error("錯誤堆棧:", (err as Error).stack);
  }
}

console.log("開始執行數據庫連接測試...");
testQuery();