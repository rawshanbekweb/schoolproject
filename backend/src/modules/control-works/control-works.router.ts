import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const teacherOrAdmin = [authenticate, authorize('super_admin', 'teacher')];
const adminOnly = [authenticate, authorize('super_admin')];

// GET /api/control-works
router.get('/', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'super_admin';
    const userId = req.user!.userId;
    const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
    const year = req.query.year ? Number(req.query.year) : undefined;

    const conds: string[] = [];
    const params: any[] = [];
    let idx = 1;

    if (!isAdmin) { conds.push(`cw.teacher_id = $${idx++}`); params.push(userId); }
    if (quarter)  { conds.push(`cw.quarter = $${idx++}`);    params.push(quarter); }
    if (year)     { conds.push(`cw.year = $${idx++}`);       params.push(year); }

    const where = conds.length ? `WHERE ${conds.join(' AND ')}` : '';

    const { rows } = await pool.query(
      `SELECT cw.*,
              s.name  AS subject_name,
              c.name  AS class_name,
              u.full_name AS teacher_name,
              COUNT(cws.id)::int AS score_count,
              ROUND(AVG(cws.score), 2) AS avg_score
       FROM control_works cw
       LEFT JOIN subjects s   ON s.id  = cw.subject_id
       LEFT JOIN classes  c   ON c.id  = cw.class_id
       LEFT JOIN users    u   ON u.id  = cw.teacher_id
       LEFT JOIN control_work_scores cws ON cws.control_work_id = cw.id
       ${where}
       GROUP BY cw.id, s.name, c.name, u.full_name
       ORDER BY cw.created_at DESC`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/control-works
router.post('/', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      subject_id: z.coerce.number().int().positive(),
      class_id:   z.coerce.number().int().positive().optional(),
      quarter:    z.coerce.number().int().min(1).max(4),
      year:       z.coerce.number().int().min(2020).max(2050),
      work_date:  z.string().optional(),
      title:      z.string().max(200).optional(),
    }).parse(req.body);

    const { rows } = await pool.query(
      `INSERT INTO control_works (teacher_id, subject_id, class_id, quarter, year, work_date, title)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [
        req.user!.userId,
        body.subject_id,
        body.class_id || null,
        body.quarter,
        body.year,
        body.work_date || null,
        body.title || null,
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/control-works/:id
router.delete('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const existing = await pool.query('SELECT teacher_id FROM control_works WHERE id = $1', [id]);
    if (!existing.rows[0]) throw new AppError('Topilmadi', 404);

    if (req.user!.role === 'teacher' && existing.rows[0].teacher_id !== req.user!.userId) {
      throw new AppError("Bu nazorat ishi sizga tegishli emas", 403);
    }

    await pool.query('DELETE FROM control_works WHERE id = $1', [id]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/control-works/:id/scores
router.get('/:id/scores', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cwId = Number(req.params.id);
    const existing = await pool.query('SELECT teacher_id FROM control_works WHERE id = $1', [cwId]);
    if (!existing.rows[0]) throw new AppError('Topilmadi', 404);

    if (req.user!.role === 'teacher' && existing.rows[0].teacher_id !== req.user!.userId) {
      throw new AppError("Bu nazorat ishi sizga tegishli emas", 403);
    }

    const { rows } = await pool.query(
      `SELECT * FROM control_work_scores WHERE control_work_id = $1 ORDER BY student_name`,
      [cwId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/control-works/:id/scores — bulk upsert
router.post('/:id/scores', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const cwId = Number(req.params.id);
    const existing = await pool.query('SELECT teacher_id FROM control_works WHERE id = $1', [cwId]);
    if (!existing.rows[0]) throw new AppError('Topilmadi', 404);

    if (req.user!.role === 'teacher' && existing.rows[0].teacher_id !== req.user!.userId) {
      throw new AppError("Bu nazorat ishi sizga tegishli emas", 403);
    }

    const body = z.object({
      scores: z.array(z.object({
        student_name: z.string().min(2).max(200),
        score: z.coerce.number().min(0).max(5),
      })).min(1),
    }).parse(req.body);

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      await client.query('DELETE FROM control_work_scores WHERE control_work_id = $1', [cwId]);
      for (const s of body.scores) {
        await client.query(
          'INSERT INTO control_work_scores (control_work_id, student_name, score) VALUES ($1,$2,$3)',
          [cwId, s.student_name, s.score]
        );
      }
      await client.query('COMMIT');
    } catch (e) {
      await client.query('ROLLBACK');
      throw e;
    } finally {
      client.release();
    }

    res.json({ success: true, message: `${body.scores.length} ta ball saqlandi` });
  } catch (err) { next(err); }
});

export default router;
