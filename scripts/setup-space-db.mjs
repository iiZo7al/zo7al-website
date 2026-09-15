import { readFile } from 'node:fs/promises';
import pg from 'pg';
import nextEnv from '@next/env';
nextEnv.loadEnvConfig(process.cwd());
if (!process.env.DATABASE_URL) throw new Error('Set DATABASE_URL in the environment or .env.local first.');
const pool = new pg.Pool({ connectionString: process.env.DATABASE_URL, connectionTimeoutMillis: 10000 });
try {
  await pool.query(await readFile(new URL('../database/space-run.sql', import.meta.url), 'utf8'));
  console.log('Space Run leaderboard schema is ready.');
} finally { await pool.end(); }
