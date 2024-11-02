import { executeQuery } from "../config";
import { RowDataPacket } from 'mysql2/promise';

async function listDatabases(): Promise<void> {
  try {
    const rows = await executeQuery<RowDataPacket>("SHOW DATABASES;");
    console.log("Databases:", rows);
  } catch (err) {
    console.error("Error executing query:", (err as Error).stack);
  }
}

listDatabases();