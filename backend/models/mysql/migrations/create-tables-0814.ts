import { getConnection, releaseConnection } from "../config";
import { PoolConnection } from "mysql2/promise";

async function createTables(): Promise<void> {
  let connection: PoolConnection | null = null;
  try {
    connection = await getConnection();

    await connection.query(`
      CREATE TABLE IF NOT EXISTS votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS vote_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vote_id INT NOT NULL,
        option_name VARCHAR(255) NOT NULL,
        FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await connection.query(`
      CREATE TABLE IF NOT EXISTS vote_responses (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vote_id INT NOT NULL,
        option_id INT NOT NULL,
        voter_name VARCHAR(255),
        voted_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
        FOREIGN KEY (option_id) REFERENCES vote_options(id) ON DELETE CASCADE
      );
    `);

    console.log("Tables created successfully.");
  } catch (err) {
    console.error("Error creating tables:", (err as Error).stack);
  } finally {
    if (connection) {
      releaseConnection(connection);
    }
  }
}

createTables();
