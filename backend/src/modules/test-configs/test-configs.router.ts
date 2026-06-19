import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const teacherOrAdmin = [authenticate, authorize('super_admin', 'teacher')];

// GET /api/test-configs  (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject_id, grade } = req.query;
    let where = 'WHERE tc.is_active = true';
    const params: any[] = [];

    if (subject_id) { params.push(Number(subject_id)); where += ` AND tc.subject_id = $${params.length}`; }
    if (grade)       { params.push(Number(grade));      where += ` AND tc.grade_level = $${params.length}`; }

    const { rows } = await pool.query(
      `SELECT tc.*, s.name AS subject_name, u.full_name AS teacher_name,
              COUNT(q.id)::int AS available_questions
       FROM test_configs tc
       LEFT JOIN subjects s ON s.id = tc.subject_id
       LEFT JOIN users u ON u.id = tc.teacher_id
       LEFT JOIN questions q ON q.subject_id = tc.subject_id
         AND q.is_active = true
         AND (tc.grade_level IS NULL OR q.grade_level = tc.grade_level)
         AND (tc.difficulty = 0 OR q.difficulty = tc.difficulty)
       ${where}
       GROUP BY tc.id, s.name, u.full_name
       ORDER BY tc.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/test-configs/manage  (teacherOrAdmin)
router.get('/manage', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'super_admin';
    const { rows } = await pool.query(
      `SELECT tc.*, s.name AS subject_name,
              COUNT(DISTINCT ts.id)::int AS sessions_count
       FROM test_configs tc
       LEFT JOIN subjects s ON s.id = tc.subject_id
       LEFT JOIN test_sessions ts ON ts.config_id = tc.id
       ${isAdmin ? '' : 'WHERE tc.teacher_id = $1'}
       GROUP BY tc.id, s.name
       ORDER BY tc.created_at DESC`,
      isAdmin ? [] : [req.user!.userId]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/test-configs/:id/start  (public — savollarni qaytaradi, correct YASHIRILGAN)
router.get('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: cfgRows } = await pool.query(
      `SELECT tc.*, s.name AS subject_name FROM test_configs tc
       LEFT JOIN subjects s ON s.id = tc.subject_id
       WHERE tc.id = $1 AND tc.is_active = true`,
      [Number(req.params.id)]
    );
    if (!cfgRows[0]) throw new AppError('Test konfiguratsiyasi topilmadi', 404);
    const cfg = cfgRows[0];

    const diffFilter = cfg.difficulty > 0 ? `AND q.difficulty = ${cfg.difficulty}` : '';
    const gradeFilter = cfg.grade_level ? `AND q.grade_level = ${cfg.grade_level}` : '';

    const { rows: questions } = await pool.query(
      `SELECT id, text, option_a, option_b, option_c, option_d, difficulty
       FROM questions
       WHERE subject_id = $1 AND is_active = true ${diffFilter} ${gradeFilter}
       ORDER BY RANDOM()
       LIMIT $2`,
      [cfg.subject_id, cfg.question_count]
    );

    res.json({ success: true, data: { config: cfg, questions } });
  } catch (err) { next(err); }
});

// POST /api/test-configs  (teacherOrAdmin)
router.post('/', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject_id, title, description, grade_level, mode, time_limit, question_count, difficulty } = req.body;
    if (!subject_id || !title?.trim()) throw new AppError('Fan va sarlavha majburiy', 400);

    // Teacher faqat o'z faniga
    if (req.user!.role === 'teacher') {
      const { rows } = await pool.query(
        'SELECT 1 FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2',
        [req.user!.userId, Number(subject_id)]
      );
      if (!rows[0]) throw new AppError('Siz bu fanga ruxsatsiz', 403);
    }

    const { rows } = await pool.query(
      `INSERT INTO test_configs (teacher_id, subject_id, title, description, grade_level, mode, time_limit, question_count, difficulty)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9) RETURNING *`,
      [req.user!.userId, Number(subject_id), title.trim(), description || null,
       grade_level || null, mode || 'named', time_limit || 0, question_count || 10, difficulty || 0]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/test-configs/:id  (teacherOrAdmin, egasi tekshiriladi)
router.put('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM test_configs WHERE id = $1', [Number(req.params.id)]);
    if (!existing[0]) throw new AppError('Topilmadi', 404);
    if (req.user!.role === 'teacher' && existing[0].teacher_id !== req.user!.userId) throw new AppError('Ruxsat yo\'q', 403);

    const { title, description, grade_level, mode, time_limit, question_count, difficulty, is_active } = req.body;
    const { rows } = await pool.query(
      `UPDATE test_configs SET title=$1, description=$2, grade_level=$3, mode=$4,
       time_limit=$5, question_count=$6, difficulty=$7, is_active=$8, updated_at=NOW()
       WHERE id=$9 RETURNING *`,
      [title ?? existing[0].title, description ?? existing[0].description, grade_level ?? existing[0].grade_level,
       mode ?? existing[0].mode, time_limit ?? existing[0].time_limit, question_count ?? existing[0].question_count,
       difficulty ?? existing[0].difficulty, is_active ?? existing[0].is_active, Number(req.params.id)]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/test-configs/:id
router.delete('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('SELECT teacher_id FROM test_configs WHERE id = $1', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Topilmadi', 404);
    if (req.user!.role === 'teacher' && rows[0].teacher_id !== req.user!.userId) throw new AppError('Ruxsat yo\'q', 403);
    await pool.query('DELETE FROM test_configs WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
