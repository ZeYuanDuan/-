import { getConnection, releaseConnection } from "../config";
import { PoolConnection } from 'mysql2/promise';

async function createDatabase(): Promise<void> {
  let connection: PoolConnection | null = null;
  try {
    connection = await getConnection();
    await connection.query("CREATE DATABASE IF NOT EXISTS `rtv-db`;");
    console.log("Database 'rtv-db' created successfully.");
  } catch (err) {
    console.error("Error creating database:", (err as Error).stack);
  } finally {
    if (connection) {
      releaseConnection(connection);
    }
  }
}

createDatabase();