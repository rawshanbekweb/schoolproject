import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();

const teacherOrAdmin = [authenticate, authorize('super_admin', 'teacher')];

const questionSchema = z.object({
  subject_id: z.number().int().positive(),
  grade_level: z.number().int().min(1).max(11).optional(),
  text: z.string().min(5),
  option_a: z.string().min(1),
  option_b: z.string().min(1),
  option_c: z.string().min(1),
  option_d: z.string().min(1),
  correct: z.enum(['A', 'B', 'C', 'D']),
  difficulty: z.number().int().min(1).max(3).default(1),
});

// GET /api/questions/subjects — fanlar ro'yxati (all=true => barcha fanlar)
router.get('/subjects', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const all = req.query.all === 'true';
    const { rows } = await pool.query(
      all
        ? `SELECT id, name, short_name, icon FROM subjects ORDER BY name`
        : `SELECT DISTINCT s.id, s.name, s.short_name, s.icon
           FROM subjects s
           INNER JOIN questions q ON q.subject_id = s.id AND q.is_active = true
           ORDER BY s.name`
    );
    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/questions (public - testlar uchun)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const subject_id = req.query.subject_id ? Number(req.query.subject_id) : undefined;
    const grade = req.query.grade ? Number(req.query.grade) : undefined;
    const limit = Math.min(50, Number(req.query.limit) || 20);

    let where = 'WHERE q.is_active = true';
    const params: any[] = [];
    let idx = 1;

    if (subject_id) { where += ` AND q.subject_id = $${idx++}`; params.push(subject_id); }
    if (grade)      { where += ` AND q.grade_level = $${idx++}`; params.push(grade); }

    params.push(limit);

    // Javoblarni YASHIRISH (faqat teacher/admin emas uchun)
    const { rows } = await pool.query(
      `SELECT q.id, q.subject_id, q.grade_level, q.text,
              q.option_a, q.option_b, q.option_c, q.option_d,
              q.difficulty, s.name AS subject_name
       FROM questions q
       LEFT JOIN subjects s ON s.id = q.subject_id
       ${where}
       ORDER BY RANDOM()
       LIMIT $${idx}`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/questions/manage (teacher o'z savollarini ko'radi)
router.get('/manage', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'super_admin';
    const userId = req.user!.userId;

    const { rows } = await pool.query(
      `SELECT q.*, s.name AS subject_name,
              u.full_name AS teacher_name
       FROM questions q
       LEFT JOIN subjects s ON s.id = q.subject_id
       LEFT JOIN users u ON u.id = q.teacher_id
       WHERE ${isAdmin ? 'true' : 'q.teacher_id = $1'}
       ORDER BY q.created_at DESC`,
      isAdmin ? [] : [userId]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// POST /api/questions
router.post('/', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = questionSchema.parse(req.body);

    // Teacher faqat o'z faniga savol qo'sha oladi
    if (req.user!.role === 'teacher') {
      const { rows } = await pool.query(
        'SELECT 1 FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2',
        [req.user!.userId, body.subject_id]
      );
      if (!rows.length) throw new AppError('Bu fan sizga biriktirilmagan', 403);
    }

    const { rows } = await pool.query(
      `INSERT INTO questions
       (teacher_id, subject_id, grade_level, text, option_a, option_b, option_c, option_d, correct, difficulty)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        req.user!.userId,
        body.subject_id,
        body.grade_level || null,
        body.text,
        body.option_a,
        body.option_b,
        body.option_c,
        body.option_d,
        body.correct,
        body.difficulty,
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/questions/:id
router.put('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const body = questionSchema.partial().parse(req.body);

    // Teacher faqat o'z savolini tahrirlay oladi
    const existing = await pool.query('SELECT * FROM questions WHERE id = $1', [id]);
    if (!existing.rows[0]) throw new AppError('Savol topilmadi', 404);

    if (req.user!.role === 'teacher' && existing.rows[0].teacher_id !== req.user!.userId) {
      throw new AppError('Bu savol sizga tegishli emas', 403);
    }

    const merged = { ...existing.rows[0], ...body };
    const { rows } = await pool.query(
      `UPDATE questions SET subject_id=$1, grade_level=$2, text=$3,
       option_a=$4, option_b=$5, option_c=$6, option_d=$7, correct=$8, difficulty=$9
       WHERE id=$10 RETURNING *`,
      [merged.subject_id, merged.grade_level, merged.text,
       merged.option_a, merged.option_b, merged.option_c, merged.option_d,
       merged.correct, merged.difficulty, id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/questions/:id
router.delete('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const existing = await pool.query('SELECT teacher_id FROM questions WHERE id = $1', [id]);
    if (!existing.rows[0]) throw new AppError('Savol topilmadi', 404);

    if (req.user!.role === 'teacher' && existing.rows[0].teacher_id !== req.user!.userId) {
      throw new AppError('Bu savol sizga tegishli emas', 403);
    }

    await pool.query('DELETE FROM questions WHERE id = $1', [id]);
    res.json({ success: true, message: 'Savol o\'chirildi' });
  } catch (err) {
    next(err);
  }
});

// POST /api/questions/submit-test (natija saqlash)
router.post('/submit-test', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      student_name: z.string().min(2),
      class_name: z.string().optional(),
      subject_id: z.number().optional(),
      grade_level: z.number().optional(),
      answers: z.record(z.string(), z.enum(['A', 'B', 'C', 'D'])),
    });

    const body = schema.parse(req.body);
    const questionIds = Object.keys(body.answers).map(Number);

    const { rows: questions } = await pool.query(
      'SELECT id, correct FROM questions WHERE id = ANY($1)',
      [questionIds]
    );

    let correct_q = 0;
    for (const q of questions) {
      if (body.answers[String(q.id)] === q.correct) correct_q++;
    }

    const total_q = questions.length;
    const score = total_q > 0 ? (correct_q / total_q) * 100 : 0;

    const { rows } = await pool.query(
      `INSERT INTO test_sessions
       (student_name, class_name, subject_id, grade_level, total_q, correct_q, score, finished_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,NOW()) RETURNING id, score, correct_q, total_q`,
      [body.student_name, body.class_name || null, body.subject_id || null,
       body.grade_level || null, total_q, correct_q, score]
    );

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

export default router;
