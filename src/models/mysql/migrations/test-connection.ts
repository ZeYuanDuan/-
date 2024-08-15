import { executeQuery } from "../config";
import { RowDataPacket } from 'mysql2/promise';

async function testQuery(): Promise<void> {
  try {
    const rows = await executeQuery<RowDataPacket>("SELECT 1 + 1 AS solution");
    console.log("The solution is: ", (rows[0] as { solution: number }).solution);
  } catch (err) {
    console.error("Error executing query:", (err as Error).stack);
  }
}

testQuery();