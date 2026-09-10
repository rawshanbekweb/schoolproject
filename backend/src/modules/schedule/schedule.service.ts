import { pool } from '../../config/db';

/**
 * Dars jadvali bilan ishlash mantiqi.
 *
 * Bu yerdagi funksiyalar ikki joydan chaqiriladi: `/api/schedule/current`
 * endpointi va chatbotning jadval tooli. Mantiq bitta joyda saqlanadi —
 * aks holda ikkalasi vaqt o'tishi bilan bir-biridan farq qila boshlaydi.
 */

/** Toshkent vaqti (UTC+5). */
export function getTashkentNow(): { currentTime: string; dbDay: number | null } {
  const now = new Date();
  const tashkentOffset = 5 * 60;
  const utcMinutes = now.getUTCHours() * 60 + now.getUTCMinutes();
  const localMinutes = (utcMinutes + tashkentOffset) % (24 * 60);
  const currentTime =
    `${String(Math.floor(localMinutes / 60)).padStart(2, '0')}:` +
    `${String(localMinutes % 60).padStart(2, '0')}`;

  const dayOfWeek = (now.getUTCDay() + (utcMinutes + tashkentOffset >= 24 * 60 ? 1 : 0)) % 7;
  // 0 = yakshanba → dars yo'q; qolganlari 1=dushanba ... 6=shanba
  return { currentTime, dbDay: dayOfWeek === 0 ? null : dayOfWeek };
}

export interface CurrentLessonResult {
  is_lesson: boolean;
  message?: string;
  lesson_num?: number;
  shift?: number;
  start_time?: string;
  end_time?: string;
  current_time?: string;
  classes?: any[];
  next_lesson?: any;
}

/** Hozir qaysi dars ketayotganini aniqlaydi. */
export async function getCurrentLesson(): Promise<CurrentLessonResult> {
  const { currentTime, dbDay } = getTashkentNow();

  if (!dbDay) {
    return { is_lesson: false, message: 'Bugun dam olish kuni', current_time: currentTime };
  }

  const { rows: lessonTimes } = await pool.query(
    `SELECT * FROM lesson_times
     WHERE start_time <= $1::time AND end_time >= $1::time`,
    [currentTime]
  );

  if (!lessonTimes.length) {
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
    return { is_lesson: false, next_lesson: nextLesson[0] || null, current_time: currentTime };
  }

  const lt = lessonTimes[0];
  const { rows: classes } = await pool.query(
    `SELECT c.name AS class_name, c.shift, s.name AS subject_name,
            u.full_name AS teacher_name, sch.room,
            lt.start_time, lt.end_time, lt.lesson_num
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

  return {
    is_lesson: true,
    lesson_num: lt.lesson_num,
    shift: lt.shift,
    start_time: lt.start_time,
    end_time: lt.end_time,
    current_time: currentTime,
    classes,
  };
}

export interface ScheduleRow {
  day_of_week: number;
  lesson_num: number;
  subject_name: string;
  teacher_name: string | null;
  room: string | null;
  start_time: string;
  end_time: string;
}

/**
 * Kirill sinf harflarini lotinchaga o'giradi.
 * Sinf nomlari bazada lotin alifbosida saqlanadi, lekin ruszabon foydalanuvchi
 * "6-Б" deb yozadi — transliteratsiyasiz bunday sinf "topilmadi" bo'lib qolardi.
 */
const CYRILLIC_TO_LATIN: Record<string, string> = {
  'А': 'A', 'Б': 'B', 'В': 'V', 'Г': 'G', 'Д': 'D', 'Е': 'E', 'Ж': 'J', 'З': 'Z',
  'И': 'I', 'К': 'K', 'Л': 'L', 'М': 'M', 'Н': 'N', 'О': 'O', 'П': 'P', 'Р': 'R',
  'С': 'S', 'Т': 'T', 'У': 'U', 'Ф': 'F', 'Х': 'X',
};

function transliterate(s: string): string {
  return s.replace(/[А-Яа-я]/g, ch => CYRILLIC_TO_LATIN[ch.toUpperCase()] ?? ch);
}

/** Sinf nomini bazadagi haqiqiy yozuv bilan solishtiradi (masalan "6 a" -> "6-A"). */
export async function findClass(name: string): Promise<{ id: number; name: string; shift: number } | null> {
  const normalized = name.replace(/\s+/g, '').replace(/[-–—]/g, '-').toUpperCase();
  // Kirill variantini ham sinaymiz — "6-Б" bazadagi "6-B" ga mos kelishi kerak
  const candidates = [...new Set([normalized, transliterate(normalized)])];

  const { rows } = await pool.query(
    `SELECT id, name, shift FROM classes
     WHERE UPPER(REPLACE(name, ' ', '')) = ANY($1::varchar[])
        OR UPPER(REPLACE(REPLACE(name, ' ', ''), '-', '')) = ANY($2::varchar[])
     LIMIT 1`,
    [candidates, candidates.map(c => c.replace(/-/g, ''))]
  );
  return rows[0] || null;
}

/** Mavjud sinflar ro'yxati — sinf topilmaganda foydalanuvchiga variant ko'rsatish uchun. */
export async function getAllClassNames(): Promise<string[]> {
  const { rows } = await pool.query('SELECT name FROM classes ORDER BY grade, letter');
  return rows.map(r => r.name);
}

/** Sinf jadvali. dayOfWeek berilmasa — butun hafta. */
export async function getClassSchedule(classId: number, dayOfWeek?: number): Promise<ScheduleRow[]> {
  const { rows } = await pool.query(
    `SELECT sch.day_of_week, sch.lesson_num, s.name AS subject_name,
            u.full_name AS teacher_name, sch.room,
            lt.start_time, lt.end_time
     FROM schedule sch
     JOIN subjects s ON s.id = sch.subject_id
     LEFT JOIN users u ON u.id = sch.teacher_id
     LEFT JOIN lesson_times lt ON lt.shift = sch.shift AND lt.lesson_num = sch.lesson_num
     WHERE sch.class_id = $1
       AND ($2::smallint IS NULL OR sch.day_of_week = $2)
     ORDER BY sch.day_of_week, sch.lesson_num`,
    [classId, dayOfWeek ?? null]
  );
  return rows;
}

/** Qo'ng'iroq jadvali (dars vaqtlari). */
export async function getLessonTimes(shift?: number): Promise<any[]> {
  const { rows } = await pool.query(
    `SELECT shift, lesson_num, start_time, end_time FROM lesson_times
     WHERE ($1::smallint IS NULL OR shift = $1)
     ORDER BY shift, lesson_num`,
    [shift ?? null]
  );
  return rows;
}
