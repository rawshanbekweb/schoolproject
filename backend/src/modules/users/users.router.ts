import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import bcrypt from 'bcrypt';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

// Faqat super_admin
const adminOnly = [authenticate, authorize('super_admin')];

// ===== Profil rasmi yuklash =====
const profileDir = path.resolve(process.env.UPLOAD_DIR || './uploads', 'profiles');
if (!fs.existsSync(profileDir)) fs.mkdirSync(profileDir, { recursive: true });

const profileUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, profileDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname).toLowerCase();
      cb(null, `profile-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (['image/jpeg', 'image/png', 'image/webp'].includes(file.mimetype)) cb(null, true);
    else cb(new Error('Faqat JPEG, PNG yoki WebP rasm'));
  },
});

// GET /api/users/me
router.get('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT id, login, full_name, role, photo_url, phone, bio,
              experience_years, education, achievements_text, is_active
       FROM users WHERE id = $1`,
      [req.user!.userId]
    );
    if (!rows[0]) throw new AppError('Topilmadi', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// PATCH /api/users/me
router.patch('/me', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { phone, bio, experience_years, education, achievements_text } = req.body;
    const { rows } = await pool.query(
      `UPDATE users SET phone=$1, bio=$2, experience_years=$3, education=$4,
       achievements_text=$5, updated_at=NOW()
       WHERE id=$6 RETURNING id, full_name, photo_url, phone, bio, experience_years, education, achievements_text`,
      [phone || null, bio || null, experience_years ?? 0, education || null,
       achievements_text || null, req.user!.userId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/users/me/photo
router.post(
  '/me/photo',
  authenticate,
  (req: Request, res: Response, next: NextFunction) => {
    profileUpload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) return next(new AppError(`Yuklash xatosi: ${err.message}`, 400));
      if (err) return next(new AppError(err.message, 400));
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError('Fayl topilmadi', 400);
      const host = req.get('host') ?? 'localhost:3000';
      const protocol = req.get('x-forwarded-proto') ?? req.protocol ?? 'http';
      const photoUrl = `${protocol}://${host}/uploads/profiles/${req.file.filename}`;
      await pool.query('UPDATE users SET photo_url=$1, updated_at=NOW() WHERE id=$2', [photoUrl, req.user!.userId]);
      res.json({ success: true, data: { photo_url: photoUrl } });
    } catch (err) { next(err); }
  }
);

const createUserSchema = z.object({
  login: z.string().min(3).max(100),
  password: z.string().min(6).max(100),
  full_name: z.string().min(2).max(200),
  role: z.enum(['super_admin', 'content_manager', 'teacher']),
  phone: z.string().optional(),
  photo_url: z.string().optional(),
  subject_ids: z.array(z.number()).optional(),
});

const updateUserSchema = createUserSchema.partial().omit({ password: true }).extend({
  password: z.string().min(6).optional(),
  is_active: z.boolean().optional(),
  is_public: z.boolean().optional(),
  photo_url: z.string().optional().nullable(),
  bio: z.string().max(1000).optional(),
  experience_years: z.coerce.number().int().min(0).max(60).optional(),
  education: z.string().max(500).optional(),
  achievements_text: z.string().max(1000).optional(),
});

// GET /api/users
router.get('/', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(`
      SELECT u.id, u.login, u.full_name, u.role, u.photo_url, u.phone, u.is_active, u.created_at,
             COALESCE(
               json_agg(
                 json_build_object('id', s.id, 'name', s.name)
               ) FILTER (WHERE s.id IS NOT NULL), '[]'
             ) AS subjects
      FROM users u
      LEFT JOIN teacher_subjects ts ON ts.teacher_id = u.id
      LEFT JOIN subjects s ON s.id = ts.subject_id
      GROUP BY u.id
      ORDER BY u.created_at DESC
    `);
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/users
router.post('/', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = createUserSchema.parse(req.body);
    const hash = await bcrypt.hash(body.password, 12);

    const { rows } = await pool.query(
      `INSERT INTO users (login, password_hash, full_name, role, phone, photo_url)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING id, login, full_name, role, phone, photo_url, is_active, created_at`,
      [body.login, hash, body.full_name, body.role, body.phone || null, body.photo_url || null]
    );

    const user = rows[0];

    // Teacher uchun fanlarni bog'lash
    if (body.role === 'teacher' && body.subject_ids?.length) {
      for (const subjectId of body.subject_ids) {
        await pool.query(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
          [user.id, subjectId]
        );
      }
    }

    res.status(201).json({ success: true, data: user });
  } catch (err) {
    next(err);
  }
});

// PATCH /api/users/:id
router.patch('/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const body = updateUserSchema.parse(req.body);

    const fields: string[] = [];
    const values: any[] = [];
    let idx = 1;

    if (body.full_name)    { fields.push(`full_name = $${idx++}`);    values.push(body.full_name); }
    if (body.role)         { fields.push(`role = $${idx++}`);         values.push(body.role); }
    if (body.phone !== undefined) { fields.push(`phone = $${idx++}`); values.push(body.phone); }
    if (body.is_active !== undefined) { fields.push(`is_active = $${idx++}`); values.push(body.is_active); }
    if (body.is_public !== undefined) { fields.push(`is_public = $${idx++}`); values.push(body.is_public); }
    if (body.photo_url !== undefined) { fields.push(`photo_url = $${idx++}`); values.push(body.photo_url || null); }
    if (body.bio !== undefined)       { fields.push(`bio = $${idx++}`);       values.push(body.bio || null); }
    if (body.experience_years !== undefined) { fields.push(`experience_years = $${idx++}`); values.push(body.experience_years); }
    if (body.education !== undefined)        { fields.push(`education = $${idx++}`);        values.push(body.education || null); }
    if (body.achievements_text !== undefined){ fields.push(`achievements_text = $${idx++}`); values.push(body.achievements_text || null); }
    if (body.password) {
      const hash = await bcrypt.hash(body.password, 12);
      fields.push(`password_hash = $${idx++}`);
      values.push(hash);
    }

    if (!fields.length) throw new AppError('O\'zgartirilishi kerak bo\'lgan maydon yo\'q', 400);

    fields.push(`updated_at = NOW()`);
    values.push(id);

    const { rows } = await pool.query(
      `UPDATE users SET ${fields.join(', ')} WHERE id = $${idx}
       RETURNING id, login, full_name, role, phone, is_active, updated_at`,
      values
    );

    if (!rows[0]) throw new AppError('Foydalanuvchi topilmadi', 404);

    // Fanlarni yangilash (teacher)
    if (body.subject_ids !== undefined) {
      await pool.query('DELETE FROM teacher_subjects WHERE teacher_id = $1', [id]);
      for (const subjectId of body.subject_ids) {
        await pool.query(
          'INSERT INTO teacher_subjects (teacher_id, subject_id) VALUES ($1, $2)',
          [id, subjectId]
        );
      }
    }

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/users/:id
router.delete('/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const { rowCount } = await pool.query('DELETE FROM users WHERE id = $1', [id]);
    if (!rowCount) throw new AppError('Foydalanuvchi topilmadi', 404);
    res.json({ success: true, message: 'O\'chirildi' });
  } catch (err) {
    next(err);
  }
});

export default router;
