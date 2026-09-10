import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { getCurrentLesson } from './schedule.service';

const router = Router();

// ──────────────────── SINFLAR ────────────────────

// GET /api/schedule/classes — barcha sinflar (public)
router.get('/classes', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      'SELECT * FROM classes ORDER BY grade, letter'
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// POST /api/schedule/classes — yangi sinf (admin)
router.post('/classes', authenticate, authorize('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      name: z.string().min(1).max(20),
      grade: z.coerce.number().int().min(1).max(11),
      letter: z.string().max(2),
      shift: z.coerce.number().int().min(1).max(2).default(1),
      student_count: z.coerce.number().int().min(0).default(0),
    }).parse(req.body);

    const exists = await pool.query('SELECT id FROM classes WHERE name = $1', [body.name]);
    if (exists.rows.length) throw new AppError("Bu sinf allaqachon mavjud", 409);

    const { rows } = await pool.query(
      'INSERT INTO classes (name, grade, letter, shift, student_count) VALUES ($1,$2,$3,$4,$5) RETURNING *',
      [body.name, body.grade, body.letter, body.shift, body.student_count]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// POST /api/schedule/classes/seed — standart sinflarni yaratish (admin)
router.post('/classes/seed', authenticate, authorize('super_admin'), async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const grades = Array.from({ length: 11 }, (_, i) => i + 1);
    const letters = ['A', 'B'];
    let count = 0;
    for (const grade of grades) {
      const shift = grade <= 5 ? 1 : 2;
      for (const letter of letters) {
        const name = `${grade}-${letter}`;
        const res2 = await pool.query(
          `INSERT INTO classes (name, grade, letter, shift)
           SELECT $1,$2,$3,$4 WHERE NOT EXISTS (SELECT 1 FROM classes WHERE name = $1)`,
          [name, grade, letter, shift]
        );
        if (res2.rowCount) count++;
      }
    }
    res.json({ success: true, message: `${count} ta yangi sinf qo'shildi` });
  } catch (err) { next(err); }
});

// DELETE /api/schedule/classes/:id (admin)
router.delete('/classes/:id', authenticate, authorize('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM classes WHERE id = $1', [Number(req.params.id)]);
    if (!rowCount) throw new AppError('Sinf topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/schedule/current — Smart Shift Widget uchun
// Hozirgi vaqtga qarab qaysi dars o'tilayotganini qaytaradi.
// Mantiq schedule.service.ts da — chatbotning jadval tooli ham shundan foydalanadi.
router.get('/current', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const data = await getCurrentLesson();
    res.json({ success: true, data });
  } catch (err) {
    next(err);
  }
});

// GET /api/schedule/weather — Ob-havo (OpenWeather API)
router.get('/weather', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const key = process.env.OPENWEATHER_API_KEY;
    const lat = process.env.OPENWEATHER_LAT || '41.9579';
    const lon = process.env.OPENWEATHER_LON || '60.3592';

    if (!key || key === 'your_openweather_api_key') {
      res.json({ success: false, data: null });
      return;
    }

    const response = await fetch(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${key}&units=metric&lang=uz`
    );
    const data = await response.json() as any;

    res.json({
      success: true,
      data: {
        temp: Math.round(data.main?.temp ?? 0),
        feels_like: Math.round(data.main?.feels_like ?? 0),
        humidity: data.main?.humidity ?? 0,
        description: data.weather?.[0]?.description ?? '',
        icon: data.weather?.[0]?.icon ?? '',
        wind_speed: Math.round(data.wind?.speed ?? 0),
      },
    });
  } catch (err) {
    next(err);
  }
});

// POST /api/schedule — yangi yozuv (admin)
router.post('/', authenticate, authorize('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = z.object({
      class_id:    z.coerce.number().int(),
      subject_id:  z.coerce.number().int(),
      teacher_id:  z.coerce.number().int().nullable().optional(),
      day_of_week: z.coerce.number().int().min(1).max(6),
      lesson_num:  z.coerce.number().int().min(1).max(8),
      shift:       z.coerce.number().int().min(1).max(2).default(1),
      room:        z.string().max(20).optional(),
    }).parse(req.body);

    // Mavjud bo'lsa o'chirish (upsert)
    await pool.query(
      'DELETE FROM schedule WHERE class_id=$1 AND day_of_week=$2 AND lesson_num=$3',
      [body.class_id, body.day_of_week, body.lesson_num]
    );
    const { rows } = await pool.query(
      `INSERT INTO schedule (class_id, subject_id, teacher_id, day_of_week, lesson_num, shift, room)
       VALUES ($1,$2,$3,$4,$5,$6,$7) RETURNING *`,
      [body.class_id, body.subject_id, body.teacher_id ?? null,
       body.day_of_week, body.lesson_num, body.shift, body.room ?? null]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// DELETE /api/schedule/:id (admin)
router.delete('/:id', authenticate, authorize('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM schedule WHERE id=$1', [Number(req.params.id)]);
    if (!rowCount) throw new AppError('Topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// DELETE /api/schedule/class/:class_id — sinf jadvalini tozalash (admin)
router.delete('/class/:class_id', authenticate, authorize('super_admin'), async (req: Request, res: Response, next: NextFunction) => {
  try {
    await pool.query('DELETE FROM schedule WHERE class_id=$1', [Number(req.params.class_id)]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// GET /api/schedule?class_id=&day=
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const class_id = req.query.class_id ? Number(req.query.class_id) : undefined;
    const day = req.query.day ? Number(req.query.day) : undefined;

    let where = 'WHERE 1=1';
    const params: any[] = [];
    let idx = 1;

    if (class_id) { where += ` AND sch.class_id = $${idx++}`; params.push(class_id); }
    if (day)      { where += ` AND sch.day_of_week = $${idx++}`; params.push(day); }

    const { rows } = await pool.query(
      `SELECT
        sch.*,
        c.name AS class_name,
        s.name AS subject_name,
        u.full_name AS teacher_name,
        lt.start_time,
        lt.end_time
       FROM schedule sch
       JOIN classes c ON c.id = sch.class_id
       JOIN subjects s ON s.id = sch.subject_id
       LEFT JOIN users u ON u.id = sch.teacher_id
       LEFT JOIN lesson_times lt ON lt.shift = sch.shift AND lt.lesson_num = sch.lesson_num
       ${where}
       ORDER BY sch.day_of_week, sch.lesson_num`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
