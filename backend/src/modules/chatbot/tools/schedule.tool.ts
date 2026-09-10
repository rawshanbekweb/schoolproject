import {
  findClass, getAllClassNames, getClassSchedule, getCurrentLesson, getLessonTimes,
  getTashkentNow,
} from '../../schedule/schedule.service';

/**
 * Jadval savollari uchun deterministik yo'l.
 *
 * Jadval — strukturaviy ma'lumot: "6-A" va "6-B" bir-biriga juda o'xshash matn,
 * vektor qidiruv ularni ishonchli ajrata olmaydi va noto'g'ri sinf jadvalini
 * qaytarishi mumkin. Shuning uchun bunday savollar embedding orqali emas,
 * to'g'ridan-to'g'ri SQL orqali javob oladi. Natija modelga kontekst sifatida
 * beriladi — model faqat uni tabiiy tilda ifodalaydi.
 */

export type ScheduleIntent =
  | { kind: 'current_lesson' }
  | { kind: 'class_schedule'; className: string; dayOfWeek: number | null }
  | { kind: 'lesson_times' };

const DAY_NAMES_UZ = ['', 'Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba'];

/** Hafta kunlari — to'rt tilda. Kalit: qidiriladigan matn, qiymat: 1=dushanba..6=shanba */
const DAY_WORDS: Array<[RegExp, number]> = [
  [/dushanba|понедельн|monday|duysenbi/i, 1],
  [/seshanba|вторник|tuesday|siyshembi/i, 2],
  [/chorshanba|сред[ауы]|wednesday|s[aá]rshembi/i, 3],
  [/payshanba|четверг|thursday|piyshembi/i, 4],
  [/juma|пятниц|friday/i, 5],
  [/shanba|суббот|saturday|shembi/i, 6],
];

const SCHEDULE_WORDS = /jadval|dars|kest[ae]|sabaq|расписан|урок|заняти|schedule|lesson|class/i;
const NOW_WORDS = /hozir|hozirgi|ayni|сейчас|текущ|now|current|h[aá]zir|qaysi dars|nechanchi dars|какой урок/i;

/**
 * Qo'ng'iroq jadvali savoli uchun ikkala shart ham bajarilishi kerak: darsga oid
 * so'z va vaqtga oid so'z. Faqat vaqt so'ziga qarash noto'g'ri natija berardi —
 * "Yangi o'quv yili qachon boshlanadi?" jadval savoli emas, u yangiliklarga oid.
 */
const LESSON_WORD = /dars|sabaq|урок|lesson/i;
const TIME_WORD = /vaqt|soat|qachon|boshlan|tugay|время|во сколько|when|time|waqt/i;

/**
 * "Qo'ng'iroq jadvali" o'zi qo'ng'iroq jadvalini bildiradi — qo'shimcha vaqt
 * so'zi shart emas. Apostrof turli ko'rinishda yozilishi mumkin (' ' ‘ ʻ).
 */
const BELL_WORD = /qo['’‘ʻ`]?ng['’‘ʻ`]?iroq|звонк|bell/i;
const TODAY_WORDS = /bugun|сегодня|today|b[uú]gin/i;
const TOMORROW_WORDS = /ertaga|завтра|tomorrow|erten/i;

/**
 * Sinf nomi: "6-A", "6A", "6 a", "6-А" (kirill). Sinf raqami 1..11 bilan
 * cheklangan, shunda "08:00" yoki "2026-yil" kabi matnlar sinf deb qabul qilinmaydi.
 *
 * Chegara sifatida \b emas, unicode lookahead ishlatiladi: JavaScript'da \b
 * faqat lotin harflariga tayanadi va "9-Б" kabi kirill sinf nomidan keyin
 * ishlamaydi. Bu lookahead bir vaqtda "soat 8 da" kabi soxta mosliklarni ham
 * to'sadi — harfdan keyin yana harf kelsa, moslik bekor bo'ladi.
 */
const CLASS_RE = /(?<![\p{L}\p{N}])(1[01]|[1-9])\s*[-–—]?\s*([A-Za-zА-Яа-я])(?![\p{L}\p{N}])/u;

function detectDay(text: string): number | null {
  for (const [re, day] of DAY_WORDS) {
    if (re.test(text)) return day;
  }
  const { dbDay } = getTashkentNow();
  if (TODAY_WORDS.test(text)) return dbDay;
  if (TOMORROW_WORDS.test(text)) {
    if (dbDay === null) return 1;          // yakshanbadan keyin dushanba
    return dbDay === 6 ? null : dbDay + 1; // shanbadan keyin yakshanba — dars yo'q
  }
  return null;
}

/** Savol jadvalga oidmi va qanday turdaligini aniqlaydi. */
export function detectScheduleIntent(message: string): ScheduleIntent | null {
  const text = message.toLowerCase();

  const classMatch = message.match(CLASS_RE);
  const hasScheduleWord = SCHEDULE_WORDS.test(text);

  // "6-A sinf jadvali", "6-A da bugun qanday darslar"
  if (classMatch && hasScheduleWord) {
    return {
      kind: 'class_schedule',
      className: `${classMatch[1]}-${classMatch[2].toUpperCase()}`,
      dayOfWeek: detectDay(text),
    };
  }

  // "hozir nechanchi dars ketyapti?"
  if (hasScheduleWord && NOW_WORDS.test(text)) return { kind: 'current_lesson' };

  // "qo'ng'iroq jadvali" / "darslar necha soatda boshlanadi?"
  if (BELL_WORD.test(text)) return { kind: 'lesson_times' };
  if (LESSON_WORD.test(text) && TIME_WORD.test(text)) return { kind: 'lesson_times' };

  return null;
}

function fmtTime(t: string | null): string {
  return t ? String(t).slice(0, 5) : '—';
}

export interface ToolResult {
  title: string;
  content: string;
  url_path: string;
}

/** Aniqlangan savol turiga qarab bazadan ma'lumot oladi va matn ko'rinishiga keltiradi. */
export async function runScheduleTool(intent: ScheduleIntent): Promise<ToolResult | null> {
  if (intent.kind === 'lesson_times') {
    const times = await getLessonTimes();
    if (!times.length) return null;
    const byShift = new Map<number, string[]>();
    for (const t of times) {
      const line = `${t.lesson_num}-dars: ${fmtTime(t.start_time)}–${fmtTime(t.end_time)}`;
      byShift.set(t.shift, [...(byShift.get(t.shift) || []), line]);
    }
    const parts = [...byShift.entries()].map(([shift, lines]) =>
      `${shift}-smena:\n${lines.join('\n')}`
    );
    return {
      title: 'Dars vaqtlari',
      content: `Maktabdagi dars vaqtlari (qo'ng'iroq jadvali):\n\n${parts.join('\n\n')}`,
      url_path: '/schedule',
    };
  }

  if (intent.kind === 'current_lesson') {
    const now = await getCurrentLesson();
    if (!now.is_lesson) {
      if (now.message) {
        return { title: 'Hozirgi dars', content: `Hozir dars yo'q: ${now.message}.`, url_path: '/schedule' };
      }
      const next = now.next_lesson;
      const content = next
        ? `Hozir (soat ${now.current_time}) dars vaqti emas — tanaffus yoki darslar orasidagi vaqt. ` +
          `Keyingi dars: ${next.class_name} sinfida ${next.subject_name}, ` +
          `soat ${fmtTime(next.start_time)} da boshlanadi.`
        : `Hozir (soat ${now.current_time}) dars ketmayapti va bugun uchun keyingi dars topilmadi.`;
      return { title: 'Hozirgi dars', content, url_path: '/schedule' };
    }

    const lines = (now.classes || []).map(
      (c: any) => `${c.class_name}: ${c.subject_name}` +
        (c.teacher_name ? ` (${c.teacher_name})` : '') +
        (c.room ? `, ${c.room}-xona` : '')
    );
    return {
      title: 'Hozirgi dars',
      content:
        `Hozir soat ${now.current_time}. ${now.shift}-smenaning ${now.lesson_num}-darsi ketmoqda ` +
        `(${fmtTime(now.start_time!)}–${fmtTime(now.end_time!)}).\n\n` +
        (lines.length ? `Hozir dars o'tayotgan sinflar:\n${lines.join('\n')}` : 'Bu vaqtda jadvalga kiritilgan sinf yo\'q.'),
      url_path: '/schedule',
    };
  }

  // class_schedule
  const cls = await findClass(intent.className);
  if (!cls) {
    // Mavjud sinflarni ko'rsatamiz — shunda foydalanuvchi to'g'ri nomni tanlay oladi
    const available = await getAllClassNames();
    return {
      title: 'Sinf topilmadi',
      content: `"${intent.className}" nomli sinf maktab bazasida topilmadi.` +
        (available.length
          ? ` Bazadagi sinflar: ${available.join(', ')}.`
          : ' Bazaga hali sinflar kiritilmagan.'),
      url_path: '/schedule',
    };
  }

  const rows = await getClassSchedule(cls.id, intent.dayOfWeek ?? undefined);
  if (!rows.length) {
    const dayText = intent.dayOfWeek ? ` ${DAY_NAMES_UZ[intent.dayOfWeek]} kuni uchun` : '';
    return {
      title: `${cls.name} sinf jadvali`,
      content: `${cls.name} sinfi uchun${dayText} jadvalga dars kiritilmagan.`,
      url_path: '/schedule',
    };
  }

  const byDay = new Map<number, string[]>();
  for (const r of rows) {
    const line = `${r.lesson_num}-dars (${fmtTime(r.start_time)}–${fmtTime(r.end_time)}): ${r.subject_name}` +
      (r.teacher_name ? ` — ${r.teacher_name}` : '') +
      (r.room ? `, ${r.room}-xona` : '');
    byDay.set(r.day_of_week, [...(byDay.get(r.day_of_week) || []), line]);
  }
  const parts = [...byDay.entries()].map(([day, lines]) =>
    `${DAY_NAMES_UZ[day]}:\n${lines.join('\n')}`
  );

  return {
    title: `${cls.name} sinf jadvali`,
    content: `${cls.name} sinfi (${cls.shift}-smena) dars jadvali:\n\n${parts.join('\n\n')}`,
    url_path: '/schedule',
  };
}
