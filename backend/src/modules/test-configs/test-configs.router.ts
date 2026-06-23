import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { z } from 'zod';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const teacherOrAdmin = [authenticate, authorize('super_admin', 'teacher')];

// ===== Fayl yuklash konfiguratsiyasi =====
const examUploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads', 'exams');
if (!fs.existsSync(examUploadDir)) fs.mkdirSync(examUploadDir, { recursive: true });

const examStorage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, examUploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `exam-${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const examUpload = multer({
  storage: examStorage,
  limits: { fileSize: 20 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Faqat PDF, DOC yoki DOCX fayllar'));
    }
    cb(null, true);
  },
});

// ===== GET /api/test-configs  (public) =====
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject_id, grade } = req.query;
    let where = 'WHERE tc.is_active = true';
    const params: any[] = [];

    if (subject_id) { params.push(Number(subject_id)); where += ` AND tc.subject_id = $${params.length}`; }
    if (grade)       { params.push(Number(grade));      where += ` AND tc.grade_level = $${params.length}`; }

    const { rows } = await pool.query(
      `SELECT tc.*, s.name AS subject_name, u.full_name AS teacher_name,
              CASE WHEN tc.file_url IS NOT NULL THEN true ELSE false END AS is_file_based,
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

// ===== GET /api/test-configs/manage  (teacherOrAdmin) =====
router.get('/manage', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const isAdmin = req.user!.role === 'super_admin';
    const { rows } = await pool.query(
      `SELECT tc.*, s.name AS subject_name,
              CASE WHEN tc.file_url IS NOT NULL THEN true ELSE false END AS is_file_based,
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

// ===== GET /api/test-configs/:id/results  (teacherOrAdmin) =====
router.get('/:id/results', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: cfg } = await pool.query(
      'SELECT * FROM test_configs WHERE id = $1',
      [Number(req.params.id)]
    );
    if (!cfg[0]) throw new AppError('Test topilmadi', 404);
    if (req.user!.role === 'teacher' && cfg[0].teacher_id !== req.user!.userId) {
      throw new AppError('Ruxsat yo\'q', 403);
    }

    const { rows } = await pool.query(
      `SELECT id, student_name, class_name, score, correct_q, total_q, finished_at
       FROM test_sessions
       WHERE config_id = $1
       ORDER BY finished_at DESC`,
      [Number(req.params.id)]
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ===== GET /api/test-configs/:id/start  (public) =====
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

    if (cfg.file_url) {
      if (!cfg.answer_key) throw new AppError('O\'qituvchi hali javob kalitini kiritmagan', 400);
      const questionCount = Object.keys(cfg.answer_key).length;
      return res.json({
        success: true,
        data: {
          config: {
            id: cfg.id,
            title: cfg.title,
            description: cfg.description,
            subject_name: cfg.subject_name,
            mode: cfg.mode,
            time_limit: cfg.time_limit,
            question_count: questionCount,
            is_file_based: true,
            file_url: cfg.file_url,
            file_type: cfg.file_type,
            target_classes: cfg.target_classes ?? [],
          },
          questions: Array.from({ length: questionCount }, (_, i) => ({ num: i + 1 })),
        },
      });
    }

    const params: any[] = [cfg.subject_id];
    let diffFilter = '';
    if (cfg.difficulty > 0) { params.push(cfg.difficulty); diffFilter = `AND q.difficulty = $${params.length}`; }
    let gradeFilter = '';
    if (cfg.grade_level) { params.push(cfg.grade_level); gradeFilter = `AND q.grade_level = $${params.length}`; }
    params.push(cfg.question_count);
    const { rows: questions } = await pool.query(
      `SELECT id, text, option_a, option_b, option_c, option_d, difficulty
       FROM questions
       WHERE subject_id = $1 AND is_active = true ${diffFilter} ${gradeFilter}
       ORDER BY RANDOM()
       LIMIT $${params.length}`,
      params
    );
    res.json({ success: true, data: { config: cfg, questions } });
  } catch (err) { next(err); }
});

// ===== POST /api/test-configs  (teacherOrAdmin) =====
router.post('/', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject_id, title, description, grade_level, mode, time_limit, question_count, difficulty, target_classes } = req.body;
    if (!subject_id || !title?.trim()) throw new AppError('Fan va sarlavha majburiy', 400);

    if (req.user!.role === 'teacher') {
      const { rows } = await pool.query(
        'SELECT 1 FROM teacher_subjects WHERE teacher_id = $1 AND subject_id = $2',
        [req.user!.userId, Number(subject_id)]
      );
      if (!rows[0]) throw new AppError('Siz bu fanga ruxsatsiz', 403);
    }

    const classes: string[] = Array.isArray(target_classes) ? target_classes : [];

    const { rows } = await pool.query(
      `INSERT INTO test_configs
       (teacher_id, subject_id, title, description, grade_level, mode, time_limit, question_count, difficulty, target_classes)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [req.user!.userId, Number(subject_id), title.trim(), description || null,
       grade_level || null, mode || 'named', time_limit || 0, question_count || 10,
       difficulty || 0, classes]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== POST /api/test-configs/:id/upload-file  (teacherOrAdmin) =====
router.post(
  '/:id/upload-file',
  ...teacherOrAdmin,
  (req: Request, res: Response, next: NextFunction) => {
    examUpload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) return next(new AppError(`Yuklash xatosi: ${err.message}`, 400));
      if (err) return next(new AppError(err.message, 400));
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError('Fayl topilmadi', 400);
      const { rows: existing } = await pool.query('SELECT * FROM test_configs WHERE id = $1', [Number(req.params.id)]);
      if (!existing[0]) throw new AppError('Test topilmadi', 404);
      if (req.user!.role === 'teacher' && existing[0].teacher_id !== req.user!.userId) {
        throw new AppError('Ruxsat yo\'q', 403);
      }
      if (existing[0].file_url) {
        const oldFile = path.join(examUploadDir, path.basename(existing[0].file_url));
        if (fs.existsSync(oldFile)) fs.unlinkSync(oldFile);
      }
      const host = req.get('host') ?? 'localhost:3000';
      const protocol = req.get('x-forwarded-proto') ?? req.protocol ?? 'http';
      const fileUrl = `${protocol}://${host}/uploads/exams/${req.file.filename}`;
      const fileType = path.extname(req.file.originalname).replace('.', '').toLowerCase();
      await pool.query(
        'UPDATE test_configs SET file_url=$1, file_type=$2, updated_at=NOW() WHERE id=$3',
        [fileUrl, fileType, Number(req.params.id)]
      );
      res.json({ success: true, data: { file_url: fileUrl, file_type: fileType } });
    } catch (err) { next(err); }
  }
);

// ===== POST /api/test-configs/:id/answer-key  (teacherOrAdmin) =====
router.post('/:id/answer-key', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      answers: z.record(z.string().regex(/^\d+$/), z.enum(['A', 'B', 'C', 'D'])),
    });
    const { answers } = schema.parse(req.body);
    const { rows: existing } = await pool.query('SELECT * FROM test_configs WHERE id = $1', [Number(req.params.id)]);
    if (!existing[0]) throw new AppError('Test topilmadi', 404);
    if (req.user!.role === 'teacher' && existing[0].teacher_id !== req.user!.userId) {
      throw new AppError('Ruxsat yo\'q', 403);
    }
    if (!existing[0].file_url) throw new AppError('Avval fayl yuklang', 400);
    const count = Object.keys(answers).length;
    if (count === 0) throw new AppError('Kamida 1 ta savol kerak', 400);
    await pool.query(
      'UPDATE test_configs SET answer_key=$1, question_count=$2, updated_at=NOW() WHERE id=$3',
      [JSON.stringify(answers), count, Number(req.params.id)]
    );
    res.json({ success: true, data: { question_count: count } });
  } catch (err) { next(err); }
});

// ===== POST /api/test-configs/:id/submit =====
router.post('/:id/submit', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const schema = z.object({
      student_name: z.string().min(2),
      class_name:   z.string().optional(),
      answers:      z.record(z.string().regex(/^\d+$/), z.enum(['A', 'B', 'C', 'D'])),
    });
    const body = schema.parse(req.body);

    const { rows } = await pool.query(
      'SELECT * FROM test_configs WHERE id = $1 AND is_active = true',
      [Number(req.params.id)]
    );
    if (!rows[0]) throw new AppError('Test topilmadi', 404);
    if (!rows[0].answer_key) throw new AppError('Javob kaliti mavjud emas', 400);

    // Bir marta topshirish tekshiruvi
    const { rows: already } = await pool.query(
      'SELECT 1 FROM test_sessions WHERE config_id = $1 AND student_name = $2',
      [Number(req.params.id), body.student_name]
    );
    if (already[0]) throw new AppError('Bu testni allaqachon topshirgansiz', 409);

    const cfg = rows[0];
    const key: Record<string, string> = cfg.answer_key;
    let correct_q = 0;
    const total_q = Object.keys(key).length;

    for (const [num, correctAnswer] of Object.entries(key)) {
      if (body.answers[num] === correctAnswer) correct_q++;
    }

    const score = total_q > 0 ? Math.round((correct_q / total_q) * 100 * 100) / 100 : 0;

    const { rows: saved } = await pool.query(
      `INSERT INTO test_sessions
       (student_name, class_name, subject_id, grade_level, total_q, correct_q, score, config_id, finished_at)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,NOW())
       RETURNING id, score, correct_q, total_q`,
      [body.student_name, body.class_name || null, cfg.subject_id,
       cfg.grade_level || null, total_q, correct_q, score, cfg.id]
    );

    res.json({ success: true, data: saved[0] });
  } catch (err) { next(err); }
});

// ===== PUT /api/test-configs/:id =====
router.put('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: existing } = await pool.query('SELECT * FROM test_configs WHERE id = $1', [Number(req.params.id)]);
    if (!existing[0]) throw new AppError('Topilmadi', 404);
    if (req.user!.role === 'teacher' && existing[0].teacher_id !== req.user!.userId) throw new AppError('Ruxsat yo\'q', 403);

    const { title, description, grade_level, mode, time_limit, question_count, difficulty, is_active, target_classes } = req.body;
    const classes = Array.isArray(target_classes) ? target_classes : existing[0].target_classes;

    const { rows } = await pool.query(
      `UPDATE test_configs SET title=$1, description=$2, grade_level=$3, mode=$4,
       time_limit=$5, question_count=$6, difficulty=$7, is_active=$8, target_classes=$9, updated_at=NOW()
       WHERE id=$10 RETURNING *`,
      [title ?? existing[0].title, description ?? existing[0].description,
       grade_level ?? existing[0].grade_level, mode ?? existing[0].mode,
       time_limit ?? existing[0].time_limit, question_count ?? existing[0].question_count,
       difficulty ?? existing[0].difficulty, is_active ?? existing[0].is_active,
       classes, Number(req.params.id)]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== DELETE /api/test-configs/:id =====
router.delete('/:id', ...teacherOrAdmin, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('SELECT * FROM test_configs WHERE id = $1', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Topilmadi', 404);
    if (req.user!.role === 'teacher' && rows[0].teacher_id !== req.user!.userId) throw new AppError('Ruxsat yo\'q', 403);
    if (rows[0].file_url) {
      const filePath = path.join(examUploadDir, path.basename(rows[0].file_url));
      if (fs.existsSync(filePath)) fs.unlinkSync(filePath);
    }
    await pool.query('DELETE FROM test_configs WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
