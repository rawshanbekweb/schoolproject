import bcrypt from 'bcrypt';
import { pool } from '../config/db';

// .env dagi SUPERADMIN_* qiymatlarini "to'g'ri" hisoblab, har ishga tushishda
// shu login/parol bilan super_admin yozuvini yaratadi yoki yangilaydi.
export const ensureSuperAdmin = async (): Promise<void> => {
  const login = process.env.SUPERADMIN_LOGIN;
  const password = process.env.SUPERADMIN_PASSWORD;
  const fullName = process.env.SUPERADMIN_FULL_NAME || 'Bosh Administrator';

  if (!login || !password) {
    console.warn('⚠️  SUPERADMIN_LOGIN / SUPERADMIN_PASSWORD .env da topilmadi — super admin yaratilmadi');
    return;
  }

  if (password.length < 8) {
    console.warn('⚠️  SUPERADMIN_PASSWORD juda qisqa (kamida 8 belgi tavsiya etiladi)');
  }

  const hash = await bcrypt.hash(password, 12);

  await pool.query(
    `INSERT INTO users (login, password_hash, full_name, role, is_active)
     VALUES ($1, $2, $3, 'super_admin', true)
     ON CONFLICT (login) DO UPDATE
       SET password_hash = EXCLUDED.password_hash,
           role = 'super_admin',
           is_active = true`,
    [login, hash, fullName]
  );

  console.log(`✅ Super admin tayyor: ${login}`);
};
