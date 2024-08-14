const poolPromise = require("../config");

async function createDatabase() {
  const pool = await poolPromise;

  try {
    await pool.query("CREATE DATABASE `rtv-db`;");
    console.log("Database 'rtv-db' created successfully.");
  } catch (err) {
    console.error("Error creating database:", err.stack);
  }
}

createDatabase();