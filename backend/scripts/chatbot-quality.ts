/**
 * RAG chatbot — qidiruv sifatini o'lchash.
 *
 * Nazorat savollari beriladi va har biri uchun kutilgan manba natijalarning
 * yuqori qismida chiqdimi tekshiriladi. Faza 1 ning qabul mezoni:
 * savollarning kamida 85% ida to'g'ri manba birinchi 3 ta natija ichida.
 *
 * Natijada o'xshashlik taqsimoti ham chiqadi — CHATBOT_MIN_SIMILARITY
 * chegarasini shu asosda sozlash mumkin.
 *
 * Ishga tushirish (haqiqiy Gemini kaliti talab qilinadi):
 *   npm run test:chatbot-quality
 */
import { pool } from '../src/config/db';
import { search } from '../src/modules/chatbot/retrieval.service';

interface Case {
  q: string;
  /** Kutilgan manba jadval nomi. */
  expect: string;
  /** Ixtiyoriy: sarlavhada uchrashi kerak bo'lgan matn. */
  titleLike?: string;
}

const CASES: Case[] = [
  { q: 'Maktab qachon tashkil etilgan?', expect: 'school_info' },
  { q: 'Maktabning missiyasi nima?', expect: 'school_info' },
  { q: 'Maktab manzili qayerda?', expect: 'school_info' },
  { q: 'Ish vaqtingiz qanday?', expect: 'school_info' },
  { q: 'Birinchi sinfga qanday hujjatlar kerak?', expect: 'school_info', titleLike: 'qabul' },
  { q: 'Qabul qachon boshlanadi?', expect: 'school_info', titleLike: 'qabul' },
  { q: 'Maktab formasi qanday bolishi kerak?', expect: 'school_info', titleLike: 'forma' },
  { q: 'Bolalarni bepul ovqatlantirasizmi?', expect: 'school_info', titleLike: 'Ovqat' },
  { q: 'Kutubxonada nechta kitob bor?', expect: 'school_info', titleLike: 'Kutubxona' },
  { q: 'Direktor kim?', expect: 'management' },
  { q: 'Ota-onalar yigilishi qachon?', expect: 'news' },
  { q: 'Yangi oquv yili qanday otdi?', expect: 'news' },
  { q: 'Kimyo laboratoriyasi haqida yangilik bormi?', expect: 'news' },
  { q: 'Ingliz tili togaragi bormi?', expect: 'news' },
  { q: 'Ichki tartib qoidalari hujjatini qayerdan olsam boladi?', expect: 'documents' },
  { q: 'Yillik ish rejasi hujjati bormi?', expect: 'documents' },
  { q: 'Matematikadan olimpiada golibi kim?', expect: 'achievements' },
  { q: 'Qaysi oquvchi respublika tanlovida sovrin oldi?', expect: 'achievements' },
  { q: 'Matematika oqituvchisi kim?', expect: 'teachers' },
  { q: 'Ingliz tili oqituvchisining tajribasi qancha?', expect: 'teachers' },
];

/** Bilim bazasida yo'q savollar — bularda past o'xshashlik kutiladi. */
const NEGATIVE_CASES = [
  'Yupiter sayyorasining massasi qancha?',
  'Menga uy vazifasini yechib ber: x^2 + 5x + 6 = 0',
  'Toshkentda bugun ob-havo qanday?',
];

async function main() {
  const { rows: cnt } = await pool.query('SELECT count(*)::int AS n FROM content_embeddings');
  if (cnt[0].n === 0) {
    console.error('❌ Bilim bazasi bo\'sh. Avval reindeks qiling.');
    process.exit(1);
  }
  console.log(`Bilim bazasi: ${cnt[0].n} ta chunk\n`);

  let top1 = 0, top3 = 0;
  const sims: number[] = [];

  for (const c of CASES) {
    const hits = await search(c.q, { limit: 5 });
    const idx = hits.findIndex(h =>
      h.source_table === c.expect &&
      (!c.titleLike || (h.title || '').toLowerCase().includes(c.titleLike.toLowerCase()))
    );
    const ok3 = idx >= 0 && idx < 3;
    if (idx === 0) top1++;
    if (ok3) top3++;
    sims.push(hits[0]?.similarity ?? 0);

    const mark = ok3 ? (idx === 0 ? '✅' : '🟡') : '❌';
    console.log(
      `${mark} ${c.q}\n` +
      `    kutilgan: ${c.expect}${c.titleLike ? ` (~${c.titleLike})` : ''} | topildi: #${idx >= 0 ? idx + 1 : '-'} | ` +
      `1-natija: ${hits[0]?.source_table}/${(hits[0]?.title || '').slice(0, 32)} (${hits[0]?.similarity.toFixed(3)})`
    );
  }

  console.log('\n=== Bilim bazasida yo\'q savollar (past o\'xshashlik kutiladi) ===');
  const negSims: number[] = [];
  for (const q of NEGATIVE_CASES) {
    const hits = await search(q, { limit: 3 });
    const s = hits[0]?.similarity ?? 0;
    negSims.push(s);
    console.log(`  "${q.slice(0, 45)}" -> eng yuqori o'xshashlik ${s.toFixed(3)} (${hits[0]?.source_table})`);
  }

  const pct = (n: number) => ((n / CASES.length) * 100).toFixed(0);
  const min = (a: number[]) => Math.min(...a).toFixed(3);
  const max = (a: number[]) => Math.max(...a).toFixed(3);
  const avg = (a: number[]) => (a.reduce((s, x) => s + x, 0) / a.length).toFixed(3);

  console.log('\n=== NATIJA ===');
  console.log(`Top-1 aniqlik: ${top1}/${CASES.length} (${pct(top1)}%)`);
  console.log(`Top-3 aniqlik: ${top3}/${CASES.length} (${pct(top3)}%)  <- qabul mezoni: >= 85%`);
  console.log(`\nTo'g'ri savollar o'xshashligi:  min ${min(sims)} | o'rtacha ${avg(sims)} | max ${max(sims)}`);
  console.log(`Begona savollar o'xshashligi:   min ${min(negSims)} | o'rtacha ${avg(negSims)} | max ${max(negSims)}`);
  console.log(`\nTavsiya: CHATBOT_MIN_SIMILARITY ni ${max(negSims)} dan yuqori, ${min(sims)} dan past qiling.`);

  await pool.end();
  process.exit(top3 / CASES.length >= 0.85 ? 0 : 1);
}

main().catch(async err => {
  console.error('XATO:', err);
  await pool.end();
  process.exit(1);
});
