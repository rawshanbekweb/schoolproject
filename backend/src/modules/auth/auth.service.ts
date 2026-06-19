// ========== auth.service.ts ==========
import bcrypt from 'bcrypt';
import { pool } from '../../config/db';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from '../../utils/jwt';
import { AppError } from '../../middleware/errorHandler';
import { User, UserPublic } from '../../types';

export const loginService = async (login: string, password: string) => {
  const { rows } = await pool.query<User>(
    'SELECT * FROM users WHERE login = $1 AND is_active = true',
    [login]
  );

  const user = rows[0];
  if (!user) throw new AppError('Login yoki parol noto\'g\'ri', 401);

  const isMatch = await bcrypt.compare(password, user.password_hash);
  if (!isMatch) throw new AppError('Login yoki parol noto\'g\'ri', 401);

  const payload = { userId: user.id, role: user.role };
  const accessToken = signAccessToken(payload);
  const refreshToken = signRefreshToken(payload);

  const { password_hash, ...userPublic } = user;
  return { accessToken, refreshToken, user: userPublic };
};

export const refreshService = (refreshToken: string) => {
  const payload = verifyRefreshToken(refreshToken);
  const accessToken = signAccessToken({ userId: payload.userId, role: payload.role });
  return { accessToken };
};

export const getMeService = async (userId: number): Promise<UserPublic> => {
  const { rows } = await pool.query<User>(
    'SELECT id, login, full_name, role, photo_url, phone, is_active, created_at, updated_at FROM users WHERE id = $1',
    [userId]
  );
  if (!rows[0]) throw new AppError('Foydalanuvchi topilmadi', 404);
  return rows[0] as unknown as UserPublic;
};
