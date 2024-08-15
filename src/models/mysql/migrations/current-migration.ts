import { executeQuery } from "../config";
import { RowDataPacket } from "mysql2/promise";

async function insertData(): Promise<void> {
  try {
    await executeQuery(`
      INSERT INTO votes (title, description) VALUES
      ('Vote 1', 'Description for vote 1'),
      ('Vote 2', 'Description for vote 2');
    `);

    await executeQuery(`
      INSERT INTO vote_options (vote_id, option_name) VALUES
      (1, 'Option 1 for Vote 1'),
      (1, 'Option 2 for Vote 1'),
      (2, 'Option 1 for Vote 2'),
      (2, 'Option 2 for Vote 2');
    `);

    await executeQuery(`
      INSERT INTO vote_responses (vote_id, option_id, voter_name) VALUES
      (1, 1, 'Voter 1'),
      (1, 2, 'Voter 2'),
      (2, 3, 'Voter 3'),
      (2, 4, 'Voter 4');
    `);

    console.log("Test data inserted successfully.");

    const tables = await executeQuery<RowDataPacket>("SHOW TABLES;");
    console.log("Tables in the database:", tables);
  } catch (err) {
    console.error("Error executing query:", (err as Error).stack);
  }
}

async function tableQuery(): Promise<void> {
  try {
    const tables = await executeQuery<RowDataPacket>("SHOW TABLES;");
    console.log("Tables in the database:", tables);

    const votes = await executeQuery<RowDataPacket>("SELECT * FROM votes;");
    console.log("Votes table content:", votes);

    const voteOptions = await executeQuery<RowDataPacket>("SELECT * FROM vote_options;");
    console.log("Vote options table content:", voteOptions);

    const voteResponses = await executeQuery<RowDataPacket>("SELECT * FROM vote_responses;");
    console.log("Vote responses table content:", voteResponses);
  } catch (err) {
    console.error("Error executing query:", (err as Error).stack);
  }
}

insertData();
tableQuery();