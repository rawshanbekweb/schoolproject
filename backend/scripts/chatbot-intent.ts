/**
 * Jadval savollarini aniqlash (intent routing) sinovi.
 *
 * Baza ham, API kaliti ham talab qilinmaydi — sof mantiq tekshiriladi.
 * Ishga tushirish: npm run test:chatbot-intent
 */
import { detectScheduleIntent } from '../src/modules/chatbot/tools/schedule.tool';

type Expected = 'class_schedule' | 'current_lesson' | 'lesson_times' | null;

const CASES: Array<[string, Expected, string?]> = [
  // ===== Sinf jadvali =====
  ['6-A sinfning payshanba kuni jadvali qanday?', 'class_schedule', '6-A'],
  ['6A sinf jadvali', 'class_schedule', '6-A'],
  ['6 a sinfida bugun qanday darslar bor?', 'class_schedule', '6-A'],
  ['11-B sinf uchun juma kuni dars jadvali', 'class_schedule', '11-B'],
  ['Расписание 9-Б класса на среду', 'class_schedule', '9-Б'],
  ['Расписание 11-А класса', 'class_schedule', '11-А'],
  ['What is the schedule for 11-A on Monday?', 'class_schedule', '11-A'],

  // ===== Hozirgi dars =====
  ['Hozir nechanchi dars ketyapti?', 'current_lesson'],
  ['Ayni paytda qaysi dars bo\'lyapti?', 'current_lesson'],
  ['Сейчас какой урок идёт?', 'current_lesson'],

  // ===== Dars vaqtlari =====
  ['Dars vaqtlari qanday?', 'lesson_times'],
  ['Darslar necha soatda boshlanadi?', 'lesson_times'],
  ['Darslar soat 8 da boshlanadimi?', 'lesson_times'],
  ['Время уроков', 'lesson_times'],
  ['Qo\'ng\'iroq jadvali', 'lesson_times'],

  // ===== Jadvalga oid emas — RAG yo'liga ketishi kerak =====
  ['Maktab qachon tashkil etilgan?', null],
  ['Direktor kim?', null],
  ['Kutubxonada nechta kitob bor?', null],
  ['Bugun ob-havo qanday?', null],
  ['Yangi o\'quv yili qachon boshlanadi?', null],
  ['Ingliz tili to\'garagi qachon boshlanadi?', null],
  ['2026-yilda maktabda nima o\'zgardi?', null],
  ['Birinchi sinfga qanday hujjatlar kerak?', null],
  ['Maktabga qabul soat nechada boshlanadi?', null],
];

let failed = 0;
for (const [question, expected, expectedClass] of CASES) {
  const result = detectScheduleIntent(question);
  const kind = result ? result.kind : null;
  let ok = kind === expected;

  let detail = '';
  if (result && result.kind === 'class_schedule') {
    detail = `  [${result.className}${result.dayOfWeek ? `, kun=${result.dayOfWeek}` : ''}]`;
    if (expectedClass && result.className !== expectedClass) {
      ok = false;
      detail += ` — kutilgan sinf: ${expectedClass}`;
    }
  }

  if (!ok) failed++;
  console.log(`${ok ? '✅' : '❌'} ${question}\n     -> ${kind ?? 'RAG yo\'li'}${detail}`);
}

console.log(
  failed === 0
    ? `\n✅ ${CASES.length} ta intent sinovi o'tdi.`
    : `\n❌ ${failed}/${CASES.length} ta sinov muvaffaqiyatsiz.`
);
process.exit(failed === 0 ? 0 : 1);
