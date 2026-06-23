import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';

const router = Router();
const adminOnly = [authenticate, authorize('super_admin')];
const allStaff = [authenticate, authorize('super_admin', 'content_manager', 'teacher')];

// GET /api/analytics/my-stats — O'qituvchining o'z statistikasi
router.get('/my-stats', authenticate, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const userId = req.user!.userId;

    const [subjectsRes, questionsRes, cwRes, ratingRes] = await Promise.all([
      pool.query(
        `SELECT s.id, s.name, s.icon, s.short_name
         FROM subjects s
         JOIN teacher_subjects ts ON ts.subject_id = s.id
         WHERE ts.teacher_id = $1
         ORDER BY s.name`,
        [userId]
      ),
      pool.query(
        'SELECT COUNT(*)::int AS cnt FROM questions WHERE teacher_id = $1 AND is_active = true',
        [userId]
      ),
      pool.query(
        'SELECT COUNT(*)::int AS cnt FROM control_works WHERE teacher_id = $1',
        [userId]
      ),
      pool.query(
        `SELECT ROUND(
           ((COALESCE(AVG(cws.score),0)/5.0*0.6 +
            LEAST(COUNT(DISTINCT q.id)::numeric/50.0,1.0)*0.4)*10)::numeric, 1
         ) AS rating
         FROM users u
         LEFT JOIN control_works cw ON cw.teacher_id = u.id
         LEFT JOIN control_work_scores cws ON cws.control_work_id = cw.id
         LEFT JOIN questions q ON q.teacher_id = u.id AND q.is_active = true
         WHERE u.id = $1`,
        [userId]
      ),
    ]);

    res.json({
      success: true,
      data: {
        subjects: subjectsRes.rows,
        questions_count: questionsRes.rows[0].cnt,
        control_works_count: cwRes.rows[0].cnt,
        rating: Number(ratingRes.rows[0]?.rating) || 0,
      },
    });
  } catch (err) { next(err); }
});

// GET /api/analytics/overview (admin dashboard uchun)
router.get('/overview', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [users, news, questions, sessions, achievements] = await Promise.all([
      pool.query('SELECT COUNT(*) FROM users WHERE is_active = true'),
      pool.query('SELECT COUNT(*) FROM news WHERE is_published = true'),
      pool.query('SELECT COUNT(*) FROM questions WHERE is_active = true'),
      pool.query('SELECT COUNT(*) FROM test_sessions'),
      pool.query('SELECT COUNT(*) FROM achievements'),
    ]);

    res.json({
      success: true,
      data: {
        active_users: Number(users.rows[0].count),
        published_news: Number(news.rows[0].count),
        active_questions: Number(questions.rows[0].count),
        test_sessions: Number(sessions.rows[0].count),
        achievements: Number(achievements.rows[0].count),
      },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/teacher-ratings
router.get('/teacher-ratings', ...allStaff, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(`
      WITH teacher_scores AS (
        SELECT
          cw.teacher_id,
          AVG(cws.score) AS avg_score
        FROM control_work_scores cws
        JOIN control_works cw ON cw.id = cws.control_work_id
        GROUP BY cw.teacher_id
      ),
      teacher_questions AS (
        SELECT teacher_id, COUNT(*) AS questions_count
        FROM questions
        WHERE is_active = true
        GROUP BY teacher_id
      )
      SELECT
        u.id AS teacher_id,
        u.full_name,
        u.photo_url,
        COALESCE(ts.avg_score, 0) AS avg_score,
        COALESCE(tq.questions_count, 0) AS questions_count,
        ROUND(
          (
            (
              (COALESCE(ts.avg_score, 0) / 5.0) * 0.6 +
              LEAST(COALESCE(tq.questions_count, 0)::numeric / 50.0, 1.0) * 0.4
            ) * 10
          )::numeric, 2
        ) AS rating,
        COALESCE(
          json_agg(s.name) FILTER (WHERE s.id IS NOT NULL), '[]'
        ) AS subjects
      FROM users u
      LEFT JOIN teacher_scores ts ON ts.teacher_id = u.id
      LEFT JOIN teacher_questions tq ON tq.teacher_id = u.id
      LEFT JOIN teacher_subjects tss ON tss.teacher_id = u.id
      LEFT JOIN subjects s ON s.id = tss.subject_id
      WHERE u.role = 'teacher' AND u.is_active = true
      GROUP BY u.id, u.full_name, u.photo_url, ts.avg_score, tq.questions_count
      ORDER BY rating DESC
    `);

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/class-averages
router.get('/class-averages', ...allStaff, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quarter = req.query.quarter ? Number(req.query.quarter) : undefined;
    const year = req.query.year ? Number(req.query.year) : new Date().getFullYear();

    let where = 'WHERE cw.year = $1';
    const params: any[] = [year];

    if (quarter) {
      where += ' AND cw.quarter = $2';
      params.push(quarter);
    }

    const { rows } = await pool.query(
      `SELECT
        c.id AS class_id,
        c.name AS class_name,
        s.name AS subject_name,
        cw.quarter,
        ROUND(AVG(cws.score), 2) AS avg_score,
        COUNT(cws.id) AS student_count
       FROM control_work_scores cws
       JOIN control_works cw ON cw.id = cws.control_work_id
       JOIN classes c ON c.id = cw.class_id
       JOIN subjects s ON s.id = cw.subject_id
       ${where}
       GROUP BY c.id, c.name, s.name, cw.quarter
       ORDER BY c.grade, c.letter, s.name`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

// GET /api/analytics/class-ranking (public - nazorat ishlari reytingi)
router.get('/class-ranking', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const quarter = Number(req.query.quarter) || 1;
    const year = Number(req.query.year) || new Date().getFullYear();

    const { rows } = await pool.query(
      `SELECT
        c.name AS class_name,
        ROUND(AVG(cws.score), 2) AS avg_score,
        COUNT(DISTINCT cw.subject_id) AS subjects_count
       FROM control_work_scores cws
       JOIN control_works cw ON cw.id = cws.control_work_id
       JOIN classes c ON c.id = cw.class_id
       WHERE cw.quarter = $1 AND cw.year = $2
       GROUP BY c.id, c.name
       ORDER BY avg_score DESC`,
      [quarter, year]
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
