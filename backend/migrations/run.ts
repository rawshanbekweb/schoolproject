import { pool } from '../src/config/db';
import fs from 'fs';
import path from 'path';

const runMigrations = async () => {
  const migrationsDir = path.join(__dirname);
  const files = fs.readdirSync(migrationsDir)
    .filter(f => f.endsWith('.sql'))
    .sort();

  console.log(`🔄 ${files.length} ta migration topildi`);

  for (const file of files) {
    const sql = fs.readFileSync(path.join(migrationsDir, file), 'utf8');
    console.log(`▶️  ${file} bajarilmoqda...`);
    await pool.query(sql);
    console.log(`✅ ${file} bajarildi`);
  }

  console.log('🎉 Barcha migrationlar muvaffaqiyatli bajarildi!');
  await pool.end();
};

runMigrations().catch(err => {
  console.error('❌ Migration xatosi:', err);
  process.exit(1);
});
