import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

export async function createClient() {
  const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
  });

  await pool.query('SELECT 1');
  return pool;
}
