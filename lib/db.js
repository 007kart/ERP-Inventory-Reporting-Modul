import pg from 'pg';

let pool;
export function getPool() {
  if (!pool) {
    if (!process.env.DATABASE_URL) throw new Error('Missing DATABASE_URL; see .env.example');
    pool = new pg.Pool({
      connectionString: process.env.DATABASE_URL,
      max: 8,
      idleTimeoutMillis: 20_000,
      connectionTimeoutMillis: 10_000,
      ssl: process.env.DATABASE_SSL === 'true' ? { rejectUnauthorized: true } : false,
    });
  }
  return pool;
}
export async function query(text, params=[]) {
  return getPool().query(text, params);
}
