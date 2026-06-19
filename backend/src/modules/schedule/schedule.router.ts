import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

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
        const name = `${grade}${letter}`;
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
// Hozirgi vaqtga qarab qaysi dars o'tilayotganini qaytaradi
router.get('/current', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const now = new Date();
    // Toshkent vaqti (UTC+5)
    const tashkentOffset = 5 * 60;
    const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
    const localMinutes = (utcMinutes + tashkentOffset) % (24 * 60);
    const currentTime = `${String(Math.floor(localMinutes / 60)).padStart(2, '0')}:${String(localMinutes % 60).padStart(2, '0')}`;
    const dayOfWeek = ((now.getUTCDay() + (utcMinutes + tashkentOffset >= 24 * 60 ? 1 : 0)) % 7);
    // 0=Yakshanba → bizda 1=Dushanba...6=Shanba
    const dbDay = dayOfWeek === 0 ? null : dayOfWeek; // Yakshanba bo'lsa dars yo'q

    if (!dbDay) {
      res.json({ success: true, data: { is_lesson: false, message: 'Bugun dam olish kuni' } });
      return;
    }

    // Hozirgi dars vaqtini topish
    const { rows: lessonTimes } = await pool.query(
      `SELECT * FROM lesson_times
       WHERE start_time <= $1::time AND end_time >= $1::time`,
      [currentTime]
    );

    if (!lessonTimes.length) {
      // Keyingi darsni topish
      const { rows: nextLesson } = await pool.query(
        `SELECT lt.*, s.name AS subject_name, c.name AS class_name
         FROM lesson_times lt
         JOIN schedule sch ON sch.shift = lt.shift AND sch.lesson_num = lt.lesson_num
         JOIN subjects s ON s.id = sch.subject_id
         JOIN classes c ON c.id = sch.class_id
         WHERE lt.start_time > $1::time AND sch.day_of_week = $2
         ORDER BY lt.start_time ASC
         LIMIT 1`,
        [currentTime, dbDay]
      );

      res.json({
        success: true,
        data: {
          is_lesson: false,
          next_lesson: nextLesson[0] || null,
          current_time: currentTime,
        },
      });
      return;
    }

    const lt = lessonTimes[0];

    // Bu darsni o'tayotgan sinflarni topish
    const { rows: currentClasses } = await pool.query(
      `SELECT
        c.name AS class_name,
        c.shift,
        s.name AS subject_name,
        u.full_name AS teacher_name,
        sch.room,
        lt.start_time,
        lt.end_time,
        lt.lesson_num
       FROM schedule sch
       JOIN classes c ON c.id = sch.class_id
       JOIN subjects s ON s.id = sch.subject_id
       LEFT JOIN users u ON u.id = sch.teacher_id
       JOIN lesson_times lt ON lt.shift = sch.shift AND lt.lesson_num = sch.lesson_num
       WHERE sch.day_of_week = $1
         AND lt.start_time <= $2::time
         AND lt.end_time >= $2::time
       ORDER BY c.grade, c.letter`,
      [dbDay, currentTime]
    );

    res.json({
      success: true,
      data: {
        is_lesson: true,
        lesson_num: lt.lesson_num,
        shift: lt.shift,
        start_time: lt.start_time,
        end_time: lt.end_time,
        current_time: currentTime,
        classes: currentClasses,
      },
    });
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
       JOIN lesson_times lt ON lt.shift = sch.shift AND lt.lesson_num = sch.lesson_num
       ${where}
       ORDER BY sch.day_of_week, lt.start_time`,
      params
    );

    res.json({ success: true, data: rows });
  } catch (err) {
    next(err);
  }
});

export default router;
