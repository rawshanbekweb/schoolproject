import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { PoolClient } from 'pg';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const teacherOrAdmin = [authenticate, authorize('super_admin', 'teacher')];

const sectionSchema = z.object({
  subject_id: z.number().int().positive(),
  question_count: z.number().int().min(1).max(100),
  points_per_question: z.number().min(0.1).max(99),
});

const createSchema = z.object({
  title: z.string().trim().min(1),
  description: z.string().optional().nullable(),
  grade_level: z.number().int().min(1).max(11).optional().nullable(),
  time_limit: z.number().int().min(0).optional(),
  target_classes: z.array(z.string()).optional(),
  sections: z.array(sectionSchema).min(1),
});

const updateSchema = z.object({
  title: z.string().trim().min(1).optional(),
  description: z.string().optional().nullable(),
  grade_level: z.number().int().min(1).max(11).optional().nullable(),
  time_limit: z.number().int().min(0).optional(),
  target_classes: z.array(z.string()).optional(),
  is_active: z.boolean().optional(),
  sections: z.array(sectionSchema).min(1).optional(),
});

const SECTIONS_AGG = `
  COALESCE(
    (SELECT json_agg(json_build_object(
        'id', bts.id,
        'subject_id', bts.subject_id,
        'subject_name', s.name,
        'question_count', bts.question_count,
        'points_per_question', bts.points_per_question
      ) ORDER BY bts.order_index)
     FROM block_test_sections bts
     LEFT JOIN subjects s ON s.id = bts.subject_id
     WHERE bts.block_test_id = bt.id),
    '[]'
  ) AS sections,
  COALESCE((SELECT SUM(bts.question_count) FROM block_test_sections bts WHERE bts.block_test_id = bt.id), 0)::int AS total_questions,
  COALESCE((SELECT SUM(bts.question_count * bts.points_per_question) FROM block_test_sections bts WHERE bts.block_test_id = bt.id), 0) AS max_score
`;

function assertOwnership(req: Request, row: { teacher_id: number | null }) {
  if (req.user!.role === 'teacher' && row.teacher_id !== req.user!.userId) {
    throw new AppError('Ruxsat yo\'q', 403);
  }
}

async function insertSections(client: PoolClient, blockTestId: number, sections: z.infer<typeof sectionSchema>[]) {
  const subjectIds = new Set(sections.map(s => s.subject_id));
  if (subjectIds.size !== sections.length) {
    throw new AppError('Bir fan faqat bitta bo\'limda bo\'lishi mumkin', 400);
  }
  let i = 0;
  for (const sec of sections) {
    await client.query(
      `INSERT INTO block_test_sections (block_test_id, subject_id, question_count, points_per_question, order_index)
       VALUES ($1,$2,$3,$4,$5)`,
      [blockTestId, sec.subject_id, sec.question_count, sec.points_per_question, i++]
    );
  }
}

// ===== GET /api/block-tests  (public) =====
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT bt.*, u.full_name AS teacher_name, ${SECTIONS_AGG}
       FROM block_tests bt
       LEFT JOIN users u ON u.id = bt.teacher_id
       WHERE bt.is_active = true
       ORDER BY bt.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ===== GET /api/block-tests/manage  (teacherOrAdmin) =====
router.get('/manage', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'super_admin';
    const { rows } = await pool.query(
      `SELECT bt.*, ${SECTIONS_AGG},
              COALESCE((SELECT COUNT(*) FROM block_test_sessions bts2
                        WHERE bts2.block_test_id = bt.id AND bts2.status = 'finished'), 0)::int AS sessions_count
       FROM block_tests bt
       ${isAdmin ? '' : 'WHERE bt.teacher_id = $1'}
       ORDER BY bt.created_at DESC`,
      isAdmin ? [] : [req.user!.userId]
    );

    // Har bir bo'lim uchun savollar bankidagi mavjud savollar sonini hisoblaymiz
    for (const row of rows) {
      for (const sec of row.sections) {
        const { rows: cnt } = await pool.query(
          `SELECT COUNT(*)::int AS n FROM questions
           WHERE subject_id = $1 AND is_active = true
             AND ($2::smallint IS NULL OR grade_level = $2)`,
          [sec.subject_id, row.grade_level]
        );
        sec.available_questions = cnt[0].n;
      }
    }

    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ===== GET /api/block-tests/:id/results  (teacherOrAdmin) =====
router.get('/:id/results', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: bt } = await pool.query('SELECT * FROM block_tests WHERE id = $1', [Number(req.params.id)]);
    if (!bt[0]) throw new AppError('Blok test topilmadi', 404);
    assertOwnership(req, bt[0]);

    const { rows } = await pool.query(
      `SELECT id, student_name, class_name, total_score, max_score, section_results, time_spent, finished_at
       FROM block_test_sessions
       WHERE block_test_id = $1 AND status = 'finished'
       ORDER BY finished_at DESC`,
      [Number(req.params.id)]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ===== POST /api/block-tests/:id/start  (public) =====
router.post('/:id/start', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      student_name: z.string().trim().min(2),
      class_name: z.string().optional(),
    });
    const body = schema.parse(req.body);
    const blockTestId = Number(req.params.id);

    const { rows: btRows } = await pool.query(
      'SELECT * FROM block_tests WHERE id = $1 AND is_active = true',
      [blockTestId]
    );
    if (!btRows[0]) throw new AppError('Blok test topilmadi', 404);
    const bt = btRows[0];

    const { rows: already } = await pool.query(
      `SELECT 1 FROM block_test_sessions WHERE block_test_id = $1 AND student_name = $2 AND status = 'finished'`,
      [blockTestId, body.student_name]
    );
    if (already[0]) throw new AppError('Bu testni allaqachon topshirgansiz', 409);

    const { rows: sections } = await pool.query(
      `SELECT bts.*, s.name AS subject_name FROM block_test_sections bts
       LEFT JOIN subjects s ON s.id = bts.subject_id
       WHERE bts.block_test_id = $1 ORDER BY bts.order_index`,
      [blockTestId]
    );
    if (sections.length === 0) throw new AppError('Blok testda bo\'lim yo\'q', 400);

    const questionSet: any[] = [];
    const responseSections: any[] = [];

    for (const sec of sections) {
      const { rows: questions } = await pool.query(
        `SELECT id, text, option_a, option_b, option_c, option_d
         FROM questions
         WHERE subject_id = $1 AND is_active = true
           AND ($2::smallint IS NULL OR grade_level = $2)
         ORDER BY RANDOM() LIMIT $3`,
        [sec.subject_id, bt.grade_level, sec.question_count]
      );
      if (questions.length === 0) {
        throw new AppError(`"${sec.subject_name}" fanidan savollar bankida savol topilmadi`, 400);
      }
      questionSet.push({
        section_id: sec.id,
        subject_id: sec.subject_id,
        subject_name: sec.subject_name,
        points_per_question: Number(sec.points_per_question),
        question_ids: questions.map((q: any) => q.id),
      });
      responseSections.push({
        section_id: sec.id,
        subject_id: sec.subject_id,
        subject_name: sec.subject_name,
        points_per_question: Number(sec.points_per_question),
        questions,
      });
    }

    const { rows: saved } = await pool.query(
      `INSERT INTO block_test_sessions (block_test_id, student_name, class_name, question_set)
       VALUES ($1,$2,$3,$4) RETURNING id`,
      [blockTestId, body.student_name, body.class_name || null, JSON.stringify(questionSet)]
    );

    res.json({
      success: true,
      data: {
        session_id: saved[0].id,
        time_limit: bt.time_limit,
        title: bt.title,
        sections: responseSections,
      },
    });
  } catch (err) { next(err); }
});

// ===== POST /api/block-tests/:id/submit  (public) =====
router.post('/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      session_id: z.number().int().positive(),
      answers: z.record(z.string().regex(/^\d+$/), z.enum(['A', 'B', 'C', 'D'])),
    });
    const body = schema.parse(req.body);
    const blockTestId = Number(req.params.id);

    const { rows: sessionRows } = await pool.query(
      `SELECT * FROM block_test_sessions WHERE id = $1 AND block_test_id = $2`,
      [body.session_id, blockTestId]
    );
    if (!sessionRows[0]) throw new AppError('Sessiya topilmadi', 404);
    const session = sessionRows[0];
    if (session.status === 'finished') throw new AppError('Bu sessiya allaqachon yakunlangan', 409);

    const questionSet: any[] = session.question_set;
    const allQuestionIds = questionSet.flatMap(sec => sec.question_ids);
    const { rows: questions } = await pool.query(
      `SELECT id, correct FROM questions WHERE id = ANY($1::int[])`,
      [allQuestionIds]
    );
    const correctMap = new Map(questions.map((q: any) => [q.id, q.correct]));

    let totalScore = 0;
    let maxScore = 0;
    const sectionResults = questionSet.map(sec => {
      let correctQ = 0;
      for (const qid of sec.question_ids) {
        if (body.answers[String(qid)] === correctMap.get(qid)) correctQ++;
      }
      const totalQ = sec.question_ids.length;
      const score = Math.round(correctQ * sec.points_per_question * 100) / 100;
      totalScore += score;
      maxScore += totalQ * sec.points_per_question;
      return {
        section_id: sec.section_id,
        subject_id: sec.subject_id,
        subject_name: sec.subject_name,
        correct_q: correctQ,
        total_q: totalQ,
        score,
      };
    });
    maxScore = Math.round(maxScore * 100) / 100;
    totalScore = Math.round(totalScore * 100) / 100;

    const { rows: updated } = await pool.query(
      `UPDATE block_test_sessions
       SET status = 'finished', total_score = $1, max_score = $2, section_results = $3,
           time_spent = EXTRACT(EPOCH FROM (NOW() - started_at))::int, finished_at = NOW()
       WHERE id = $4
       RETURNING id, total_score, max_score, section_results, time_spent`,
      [totalScore, maxScore, JSON.stringify(sectionResults), session.id]
    );

    res.json({ success: true, data: updated[0] });
  } catch (err) { next(err); }
});

// ===== POST /api/block-tests  (teacherOrAdmin) =====
router.post('/', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const body = createSchema.parse(req.body);
    await client.query('BEGIN');

    const { rows } = await client.query(
      `INSERT INTO block_tests (teacher_id, title, description, grade_level, time_limit, target_classes)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [req.user!.userId, body.title, body.description || null, body.grade_level || null,
       body.time_limit ?? 0, body.target_classes ?? []]
    );
    const blockTest = rows[0];
    await insertSections(client, blockTest.id, body.sections);

    await client.query('COMMIT');
    res.status(201).json({ success: true, data: blockTest });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ===== PUT /api/block-tests/:id  (teacherOrAdmin) =====
router.put('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  const client = await pool.connect();
  try {
    const blockTestId = Number(req.params.id);
    const { rows: existing } = await client.query('SELECT * FROM block_tests WHERE id = $1', [blockTestId]);
    if (!existing[0]) throw new AppError('Blok test topilmadi', 404);
    assertOwnership(req, existing[0]);

    const body = updateSchema.parse(req.body);

    await client.query('BEGIN');

    const { rows } = await client.query(
      `UPDATE block_tests SET title=$1, description=$2, grade_level=$3, time_limit=$4,
       target_classes=$5, is_active=$6, updated_at=NOW() WHERE id=$7 RETURNING *`,
      [body.title ?? existing[0].title, body.description ?? existing[0].description,
       body.grade_level ?? existing[0].grade_level, body.time_limit ?? existing[0].time_limit,
       body.target_classes ?? existing[0].target_classes,
       body.is_active ?? existing[0].is_active, blockTestId]
    );

    if (body.sections) {
      await client.query('DELETE FROM block_test_sections WHERE block_test_id = $1', [blockTestId]);
      await insertSections(client, blockTestId, body.sections);
    }

    await client.query('COMMIT');
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    await client.query('ROLLBACK');
    next(err);
  } finally {
    client.release();
  }
});

// ===== DELETE /api/block-tests/:id  (teacherOrAdmin) =====
router.delete('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('SELECT * FROM block_tests WHERE id = $1', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Topilmadi', 404);
    assertOwnership(req, rows[0]);
    await pool.query('DELETE FROM block_tests WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
