import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const adminOnly = [authenticate, authorize('super_admin')];

// GET /api/subjects
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT s.*, COUNT(DISTINCT ts.teacher_id) AS teacher_count
       FROM subjects s
       LEFT JOIN teacher_subjects ts ON ts.subject_id = s.id
       GROUP BY s.id
       ORDER BY s.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/subjects/:id
router.get('/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('SELECT * FROM subjects WHERE id = $1', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Fan topilmadi', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/subjects
router.post('/', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, short_name, icon, description } = req.body;
    if (!name?.trim()) throw new AppError('Fan nomi majburiy', 400);

    const { rows } = await pool.query(
      `INSERT INTO subjects (name, short_name, icon, description)
       VALUES ($1,$2,$3,$4) RETURNING *`,
      [name.trim(), short_name?.trim() || null, icon?.trim() || null, description?.trim() || null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/subjects/:id
router.put('/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, short_name, icon, description } = req.body;
    if (!name?.trim()) throw new AppError('Fan nomi majburiy', 400);

    const { rows } = await pool.query(
      `UPDATE subjects SET name=$1, short_name=$2, icon=$3, description=$4, updated_at=NOW()
       WHERE id=$5 RETURNING *`,
      [name.trim(), short_name?.trim() || null, icon?.trim() || null, description?.trim() || null, Number(req.params.id)]
    );
    if (!rows[0]) throw new AppError('Fan topilmadi', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/subjects/:id
router.delete('/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('DELETE FROM subjects WHERE id=$1 RETURNING id', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Fan topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
