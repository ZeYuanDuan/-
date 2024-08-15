import poolPromise from "../config";
import { Pool, RowDataPacket } from 'mysql2/promise';

async function listDatabases(): Promise<void> {
  try {
    const pool: Pool = await poolPromise;
    const [rows] = await pool.query<RowDataPacket[]>("SHOW DATABASES;");
    console.log("Databases:", rows);
  } catch (err) {
    console.error("Error executing query:", (err as Error).stack);
  }
}

listDatabases();