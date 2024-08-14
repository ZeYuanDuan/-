const poolPromise = require("../config");

async function listDatabases() {
  const pool = await poolPromise;

  try {
    const [rows] = await pool.query("SHOW DATABASES;");
    console.log("Databases:", rows);
  } catch (err) {
    console.error("Error executing query:", err.stack);
  }
}

listDatabases();