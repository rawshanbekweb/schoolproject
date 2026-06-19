import { Router, Request, Response, NextFunction } from 'express';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const adminOrContent = [authenticate, authorize('super_admin', 'content_manager')];
const adminOnly = [authenticate, authorize('super_admin')];

// ===== MAKTAB HAQIDA (school-info) =====

// GET /api/school-info
router.get('/school-info', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('SELECT * FROM school_info ORDER BY id');
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/school-info/management/list  — must be before /:key to avoid param match
router.get('/school-info/management/list', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM management WHERE is_active = true ORDER BY order_num, id'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/school-info/management
router.post('/school-info/management', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, position, photo_url, phone, email, order_num } = req.body;
    if (!full_name?.trim() || !position?.trim()) throw new AppError('Ism va lavozim majburiy', 400);
    const { rows } = await pool.query(
      `INSERT INTO management (full_name, position, photo_url, phone, email, order_num)
       VALUES ($1,$2,$3,$4,$5,$6) RETURNING *`,
      [full_name.trim(), position.trim(), photo_url || null, phone || null, email || null, order_num || 0]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/school-info/management/:id
router.delete('/school-info/management/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query('DELETE FROM management WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/school-info/:key  — after management/* routes to avoid shadowing
router.get('/school-info/:key', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('SELECT * FROM school_info WHERE key = $1', [req.params.key]);
    if (!rows[0]) throw new AppError('Ma\'lumot topilmadi', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/school-info/:key
router.put('/school-info/:key', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, content } = req.body;
    const { rows } = await pool.query(
      `INSERT INTO school_info (key, title, content, updated_by, updated_at)
       VALUES ($1, $2, $3, $4, NOW())
       ON CONFLICT (key) DO UPDATE SET title=$2, content=$3, updated_by=$4, updated_at=NOW()
       RETURNING *`,
      [req.params.key, title, content, req.user!.userId]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== MUROJAAT (contacts) =====

// POST /api/contacts  (public)
router.post('/contacts', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { full_name, phone, email, subject, message } = req.body;
    if (!full_name?.trim() || !subject?.trim() || !message?.trim()) {
      throw new AppError('Ism, mavzu va xabar majburiy', 400);
    }
    if (message.length < 10) throw new AppError('Xabar kamida 10 belgi bo\'lishi kerak', 400);
    const { rows } = await pool.query(
      `INSERT INTO contact_messages (full_name, phone, email, subject, message)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [full_name.trim(), phone || null, email || null, subject.trim(), message.trim()]
    );
    res.status(201).json({ success: true, data: rows[0], message: 'Xabaringiz qabul qilindi' });
  } catch (err) { next(err); }
});

// GET /api/contacts  (admin)
router.get('/contacts', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.query;
    let where = '';
    const params: any[] = [];
    if (status) { params.push(status); where = `WHERE status = $1`; }
    const { rows } = await pool.query(
      `SELECT * FROM contact_messages ${where} ORDER BY created_at DESC LIMIT 100`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// PATCH /api/contacts/:id/status
router.patch('/contacts/:id/status', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { status } = req.body;
    if (!['new', 'read', 'replied'].includes(status)) throw new AppError('Noto\'g\'ri status', 400);
    await pool.query(
      `UPDATE contact_messages SET status=$1, replied_at = CASE WHEN $1='replied' THEN NOW() ELSE replied_at END WHERE id=$2`,
      [status, Number(req.params.id)]
    );
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ===== HUJJATLAR (documents) =====

// GET /api/documents  (public)
router.get('/documents', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { category } = req.query;
    let where = 'WHERE is_public = true';
    const params: any[] = [];
    if (category) { params.push(category); where += ` AND category = $${params.length}`; }
    const { rows } = await pool.query(
      `SELECT d.*, u.full_name AS uploader_name FROM documents d
       LEFT JOIN users u ON u.id = d.uploader_id
       ${where}
       ORDER BY d.created_at DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/documents  (adminOrContent)
router.post('/documents', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { title, description, file_url, file_size, file_type, category, is_public } = req.body;
    if (!title?.trim() || !file_url?.trim()) throw new AppError('Sarlavha va fayl URL majburiy', 400);
    const { rows } = await pool.query(
      `INSERT INTO documents (uploader_id, title, description, file_url, file_size, file_type, category, is_public)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8) RETURNING *`,
      [req.user!.userId, title.trim(), description || null, file_url.trim(),
       file_size || 0, file_type || 'pdf', category || 'other', is_public ?? true]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// PATCH /api/documents/:id/download  (public — yuklab olishlar++)
router.patch('/documents/:id/download', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      'UPDATE documents SET download_count = download_count + 1 WHERE id = $1 RETURNING file_url',
      [Number(req.params.id)]
    );
    if (!rows[0]) throw new AppError('Hujjat topilmadi', 404);
    res.json({ success: true, data: { file_url: rows[0].file_url } });
  } catch (err) { next(err); }
});

// DELETE /api/documents/:id  (adminOrContent)
router.delete('/documents/:id', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('DELETE FROM documents WHERE id = $1 RETURNING id', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ===== O'QITUVCHILAR PUBLIC PROFIL =====

// GET /api/teachers
router.get('/teachers', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { subject_id } = req.query;
    let where = "WHERE u.role = 'teacher' AND u.is_active = true";
    const params: any[] = [];

    if (subject_id) {
      params.push(Number(subject_id));
      where += ` AND EXISTS (SELECT 1 FROM teacher_subjects ts WHERE ts.teacher_id = u.id AND ts.subject_id = $1)`;
    }

    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.photo_url, u.bio, u.experience_years, u.education, u.achievements_text,
              COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'icon', s.icon))
                FILTER (WHERE s.id IS NOT NULL), '[]') AS subjects,
              ROUND(
                (COALESCE(AVG(cws.score),0)/5.0*0.6 +
                 LEAST(COUNT(DISTINCT q.id)::float/50.0,1.0)*0.4)*10, 1
              ) AS rating
       FROM users u
       LEFT JOIN teacher_subjects tss ON tss.teacher_id = u.id
       LEFT JOIN subjects s ON s.id = tss.subject_id
       LEFT JOIN control_works cw ON cw.teacher_id = u.id
       LEFT JOIN control_work_scores cws ON cws.control_work_id = cw.id
       LEFT JOIN questions q ON q.teacher_id = u.id AND q.is_active = true
       ${where}
       GROUP BY u.id, u.full_name, u.photo_url, u.bio, u.experience_years, u.education, u.achievements_text
       ORDER BY rating DESC`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// GET /api/teachers/:id
router.get('/teachers/:id', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT u.id, u.full_name, u.photo_url, u.bio, u.experience_years, u.education, u.achievements_text,
              COALESCE(json_agg(json_build_object('id', s.id, 'name', s.name, 'icon', s.icon))
                FILTER (WHERE s.id IS NOT NULL), '[]') AS subjects
       FROM users u
       LEFT JOIN teacher_subjects tss ON tss.teacher_id = u.id
       LEFT JOIN subjects s ON s.id = tss.subject_id
       WHERE u.id = $1 AND u.role = 'teacher' AND u.is_active = true
       GROUP BY u.id`,
      [Number(req.params.id)]
    );
    if (!rows[0]) throw new AppError('O\'qituvchi topilmadi', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== SINFLAR (classes) =====

// GET /api/classes
router.get('/classes', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { grade, shift } = req.query;
    let where = 'WHERE 1=1';
    const params: any[] = [];
    if (grade)  { params.push(Number(grade));  where += ` AND grade = $${params.length}`; }
    if (shift)  { params.push(Number(shift));  where += ` AND shift = $${params.length}`; }
    const { rows } = await pool.query(
      `SELECT * FROM classes ${where} ORDER BY grade, letter`,
      params
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/classes  (admin)
router.post('/classes', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, grade, letter, shift, student_count } = req.body;
    if (!name?.trim() || !grade || !letter?.trim()) throw new AppError('Sinf nomi, daraja va harfi majburiy', 400);
    const { rows } = await pool.query(
      `INSERT INTO classes (name, grade, letter, shift, student_count)
       VALUES ($1,$2,$3,$4,$5) RETURNING *`,
      [name.trim(), Number(grade), letter.trim().toUpperCase(), shift || 1, student_count || 0]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// PUT /api/classes/:id
router.put('/classes/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { name, grade, letter, shift, student_count } = req.body;
    const { rows } = await pool.query(
      `UPDATE classes SET name=$1, grade=$2, letter=$3, shift=$4, student_count=$5
       WHERE id=$6 RETURNING *`,
      [name, Number(grade), letter?.toUpperCase(), shift, student_count, Number(req.params.id)]
    );
    if (!rows[0]) throw new AppError('Sinf topilmadi', 404);
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/classes/:id
router.delete('/classes/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('DELETE FROM classes WHERE id=$1 RETURNING id', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Sinf topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// POST /api/classes/seed  (admin — barcha sinflarni yaratish)
router.post('/classes/seed', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const created: string[] = [];
    for (let g = 1; g <= 11; g++) {
      for (const letter of ['A', 'B']) {
        const name = `${g}-${letter}`;
        const shift = g <= 6 ? 1 : 2;
        const { rows } = await pool.query(
          `INSERT INTO classes (name, grade, letter, shift) VALUES ($1,$2,$3,$4)
           ON CONFLICT DO NOTHING RETURNING name`,
          [name, g, letter, shift]
        );
        if (rows[0]) created.push(rows[0].name);
      }
    }
    res.json({ success: true, data: { created, count: created.length } });
  } catch (err) { next(err); }
});

export default router;
