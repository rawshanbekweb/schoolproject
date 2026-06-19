import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const adminOrContent = [authenticate, authorize('super_admin', 'content_manager')];

const schema = z.object({
  person_name: z.string().min(2).max(200),
  person_type: z.enum(['student', 'teacher']),
  class_name: z.string().max(20).optional(),
  subject_id: z.number().int().positive().optional(),
  title: z.string().min(3).max(300),
  description: z.string().optional(),
  photo_url: z.union([z.string().url(), z.literal(''), z.undefined()]),
  award_date: z.string().optional(),
  level: z.string().max(50).optional(),
  is_featured: z.boolean().default(false),
});

// GET /api/achievements (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const person_type = req.query.person_type as string | undefined;
    const featured = req.query.featured === 'true';
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(50, Number(req.query.limit) || 20);
    const offset = (page - 1) * limit;

    const conditions: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (person_type) { conditions.push(`a.person_type = $${idx++}`); params.push(person_type); }
    if (featured)    { conditions.push(`a.is_featured = true`); }

    const where = conditions.length ? `WHERE ${conditions.join(' AND ')}` : '';
    params.push(limit, offset);

    const { rows } = await pool.query(
      `SELECT a.*, s.name AS subject_name
       FROM achievements a
       LEFT JOIN subjects s ON s.id = a.subject_id
       ${where}
       ORDER BY a.is_featured DESC, a.award_date DESC NULLS LAST, a.created_at DESC
       LIMIT $${idx++} OFFSET $${idx}`,
      params
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM achievements a ${where}`,
      params.slice(0, params.length - 2)
    );

    res.json({
      success: true,
      data: rows,
      meta: { page, limit, total: Number(countRes.rows[0].count) },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/achievements
router.post('/', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = schema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO achievements
       (person_name, person_type, class_name, subject_id, title, description,
        photo_url, award_date, level, is_featured)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        body.person_name, body.person_type, body.class_name || null,
        body.subject_id || null, body.title, body.description || null,
        body.photo_url || null, body.award_date || null,
        body.level || null, body.is_featured,
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/achievements/:id
router.put('/:id', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const body = schema.partial().parse(req.body);
    const existing = await pool.query('SELECT * FROM achievements WHERE id = $1', [id]);
    if (!existing.rows[0]) throw new AppError('Yutuq topilmadi', 404);

    const m = { ...existing.rows[0], ...body };
    const { rows } = await pool.query(
      `UPDATE achievements SET person_name=$1, person_type=$2, class_name=$3, subject_id=$4,
       title=$5, description=$6, photo_url=$7, award_date=$8, level=$9, is_featured=$10
       WHERE id=$11 RETURNING *`,
      [m.person_name, m.person_type, m.class_name, m.subject_id, m.title,
       m.description, m.photo_url, m.award_date, m.level, m.is_featured, id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/achievements/:id
router.delete('/:id', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM achievements WHERE id = $1', [Number(req.params.id)]);
    if (!rowCount) throw new AppError('Yutuq topilmadi', 404);
    res.json({ success: true, message: "O'chirildi" });
  } catch (err) {
    next(err);
  }
});

export default router;
