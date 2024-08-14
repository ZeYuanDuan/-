const poolPromise = require("../config");

// 使用連接池執行查詢的範例
async function testQuery() {
  try {
    const db = await poolPromise; // 等待 poolPromise 完成
    const [rows] = await db.query("SELECT 1 + 1 AS solution");
    console.log("The solution is: ", rows[0].solution);
  } catch (err) {
    console.error("Error executing query:", err.stack);
  }
}

testQuery();
