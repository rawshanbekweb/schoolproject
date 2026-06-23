import { Pool } from 'pg';
import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

dotenv.config();

export const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  database: process.env.DB_NAME || 'maktab_db',
  user: process.env.DB_USER || 'postgres',
  password: process.env.DB_PASSWORD || '',
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname, '..', '..', 'migrations');
  if (!fs.existsSync(migrationsDir)) return;

  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      run_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  const { rows: done } = await pool.query('SELECT filename FROM _migrations');
  const ran = new Set(done.map((r: { filename: string }) => r.filename));

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    if (ran.has(file)) continue;
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`✅ Migration: ${file}`);
  }
};

export const connectDB = async () => {
  try {
    const client = await pool.connect();
    console.log('✅ PostgreSQL ulandi');
    client.release();
    await runMigrations();
    const { ensureSuperAdmin } = await import('../utils/seedSuperAdmin');
    await ensureSuperAdmin();
  } catch (err) {
    console.error('❌ PostgreSQL ulanmadi:', err);
    process.exit(1);
  }
};
