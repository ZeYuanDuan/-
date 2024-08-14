const poolPromise = require("../config");

async function createTables() {
  const pool = await poolPromise;

  try {
    await pool.query(`
      CREATE TABLE votes (
        id INT AUTO_INCREMENT PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE vote_options (
        id INT AUTO_INCREMENT PRIMARY KEY,
        vote_id INT NOT NULL,
        option_name VARCHAR(255) NOT NULL,
        FOREIGN KEY (vote_id) REFERENCES votes(id) ON DELETE CASCADE,
        created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
      );
    `);

    await pool.query(`
      CREATE TABLE vote_responses (
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
    console.error("Error creating tables:", err.stack);
  }
}

createTables();
