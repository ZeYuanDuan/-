const poolPromise = require("../config");

// 使用連接池執行查詢的範例
async function insertData() {
  try {
    const db = await poolPromise; // 等待 poolPromise 完成

    // 插入測試資料到 votes 表
    await db.query(`
      INSERT INTO votes (title, description) VALUES
      ('Vote 1', 'Description for vote 1'),
      ('Vote 2', 'Description for vote 2');
    `);

    // 插入測試資料到 vote_options 表
    await db.query(`
      INSERT INTO vote_options (vote_id, option_name) VALUES
      (1, 'Option 1 for Vote 1'),
      (1, 'Option 2 for Vote 1'),
      (2, 'Option 1 for Vote 2'),
      (2, 'Option 2 for Vote 2');
    `);

    // 插入測試資料到 vote_responses 表
    await db.query(`
      INSERT INTO vote_responses (vote_id, option_id, voter_name) VALUES
      (1, 1, 'Voter 1'),
      (1, 2, 'Voter 2'),
      (2, 3, 'Voter 3'),
      (2, 4, 'Voter 4');
    `);

    console.log("Test data inserted successfully.");

    // 查詢資料表
    const [tables] = await db.query("SHOW TABLES;");
    console.log("Tables in the database:", tables);
  } catch (err) {
    console.error("Error executing query:", err.stack);
  }
}

// 使用連接池執行查詢的範例
async function tableQuery() {
  try {
    const db = await poolPromise; // 等待 poolPromise 完成
    const [rows] = await db.query("SELECT 1 + 1 AS solution");
    console.log("The solution is: ", rows[0].solution);

    // 查詢資料表
    const [tables] = await db.query("SHOW TABLES;");
    console.log("Tables in the database:", tables);

    // 查詢 votes 表的內容
    const [votes] = await db.query("SELECT * FROM votes;");
    console.log("Votes table content:", votes);

    // 查詢 vote_options 表的內容
    const [voteOptions] = await db.query("SELECT * FROM vote_options;");
    console.log("Vote options table content:", voteOptions);

    // 查詢 vote_responses 表的內容
    const [voteResponses] = await db.query("SELECT * FROM vote_responses;");
    console.log("Vote responses table content:", voteResponses);
  } catch (err) {
    console.error("Error executing query:", err.stack);
  }
}

insertData();

tableQuery();
