import { pool } from '../src/config/db';
import fs from 'fs';
import path from 'path';

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname);

  // 1. _migrations jadvali borligini tekshiramiz
  await pool.query(`
    CREATE TABLE IF NOT EXISTS _migrations (
      filename VARCHAR(255) PRIMARY KEY,
      run_at   TIMESTAMPTZ DEFAULT NOW()
    )
  `);

  // 2. Bajarilgan migrationlarni bazadan olamiz
  const { rows: done } = await pool.query('SELECT filename FROM _migrations');
  const ran = new Set(done.map((r: { filename: string }) => r.filename));

  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`🔄 ${files.length} ta migration topildi`);

  let executedCount = 0;
  for (const file of files) {
    if (ran.has(file)) continue;

    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`▶️  ${file} bajarilmoqda...`);
    await pool.query(sql);
    await pool.query('INSERT INTO _migrations (filename) VALUES ($1)', [file]);
    console.log(`✅ ${file} bajarildi`);
    executedCount++;
  }

  if (executedCount === 0) {
    console.log('✨ Yangi migrationlar topilmadi. Barchasi oldindan bajarilgan.');
  } else {
    console.log(`🎉 Barcha yangi migrationlar (${executedCount} ta) muvaffaqiyatli bajarildi!`);
  }
  await pool.end();
};

runMigrations().catch(err => {
  console.error('❌ Migration xatosi:', err);
  process.exit(1);
});
