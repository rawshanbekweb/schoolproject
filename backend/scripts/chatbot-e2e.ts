/**
 * RAG chatbot — uchdan-uchgacha sinov.
 *
 * Gemini API o'rniga fetch stub qilinadi (leksik soxta embedding), baza esa
 * haqiqiy. Indeksatsiya, hash orqali tejash, gibrid qidiruv, javob berish
 * oqimi va xarajat hisobi tekshiriladi.
 *
 * Ishga tushirish:
 *   docker run -d --rm --name ragtest -e POSTGRES_PASSWORD=test \
 *     -e POSTGRES_DB=maktab_test -p 55432:5432 pgvector/pgvector:pg16
 *   # migratsiyalarni qo'llash:
 *   for f in migrations/*.sql; do docker exec -i ragtest \
 *     psql -U postgres -d maktab_test -q < "$f"; done
 *   DB_HOST=localhost DB_PORT=55432 DB_USER=postgres DB_PASSWORD=test \
 *     DB_NAME=maktab_test GEMINI_API_KEY=fake npm run test:chatbot
 */
import crypto from 'crypto';

// ===== XAVFSIZLIK TO'SIG'I =====
// Skript jadvallarni tozalaydi. Ishchi (production) yoki lokal ish bazasida
// tasodifan ishga tushmasligi uchun baza nomida "test" bo'lishi majburiy.
const dbName = process.env.DB_NAME || '';
if (!/test/i.test(dbName)) {
  console.error(
    `❌ Bu skript ma'lumotlarni o'chiradi va faqat sinov bazasida ishlaydi.\n` +
    `   DB_NAME nomida "test" bo'lishi shart (hozir: "${dbName || 'belgilanmagan'}").`
  );
  process.exit(1);
}
if (process.env.NODE_ENV === 'production') {
  console.error('❌ Production muhitida ishga tushirib bo\'lmaydi.');
  process.exit(1);
}

// Soxta embedding leksik (so'z mosligiga asoslangan) bo'lgani uchun haqiqiy
// semantik modeldan past o'xshashlik beradi. Ishlab chiqarish chegarasi (0.64)
// bu yerda mos kelmaydi, shuning uchun sinov uchun pastroq chegara qo'yiladi.
process.env.CHATBOT_MIN_SIMILARITY = process.env.CHATBOT_MIN_SIMILARITY || '0.40';

// ===== Gemini API stub — modullar import qilinishidan oldin o'rnatiladi =====
const DIM = 768;
function fakeEmbed(text: string): number[] {
  const vec = new Array(DIM).fill(0);
  for (const word of text.toLowerCase().split(/[^\p{L}\p{N}]+/u)) {
    if (!word) continue;
    const h = crypto.createHash('md5').update(word).digest();
    vec[h.readUInt16BE(0) % DIM] += 1;
  }
  const norm = Math.sqrt(vec.reduce((s, v) => s + v * v, 0)) || 1;
  return vec.map(v => v / norm);
}

let embedCalls = 0;
let generateCalls = 0;

globalThis.fetch = (async (url: any, init: any) => {
  const u = String(url);
  const body = JSON.parse(init.body);
  if (u.includes(':batchEmbedContents')) {
    embedCalls++;
    return {
      ok: true,
      json: async () => ({
        embeddings: body.requests.map((r: any) => ({ values: fakeEmbed(r.content.parts[0].text) })),
      }),
    };
  }
  if (u.includes(':generateContent')) {
    generateCalls++;
    const userText = body.contents[body.contents.length - 1].parts[0].text;
    return {
      ok: true,
      json: async () => ({
        candidates: [{
          content: { parts: [{ text: 'Maktab 1985-yilda tashkil etilgan.' }] },
          finishReason: 'STOP',
        }],
        usageMetadata: { promptTokenCount: userText.length / 4 | 0, candidatesTokenCount: 12 },
      }),
    };
  }
  throw new Error('Kutilmagan URL: ' + u);
}) as any;

// DIQQAT: modullar dinamik import qilinadi. Statik import hoisting sababli
// yuqoridagi process.env o'rnatishlaridan OLDIN bajarilardi va modul darajasida
// o'qiladigan sozlamalar (MIN_SIMILARITY) eski qiymatni olib qolardi.
type Pool = Awaited<typeof import('../src/config/db')>['pool'];
let pool: Pool;
let reindex: typeof import('../src/modules/chatbot/indexer.service')['reindex'];
let getIndexStatus: typeof import('../src/modules/chatbot/indexer.service')['getIndexStatus'];
let search: typeof import('../src/modules/chatbot/retrieval.service')['search'];
let hasGrounding: typeof import('../src/modules/chatbot/retrieval.service')['hasGrounding'];
let ask: typeof import('../src/modules/chatbot/chatbot.service')['ask'];

async function loadModules() {
  ({ pool } = await import('../src/config/db'));
  ({ reindex, getIndexStatus } = await import('../src/modules/chatbot/indexer.service'));
  ({ search, hasGrounding } = await import('../src/modules/chatbot/retrieval.service'));
  ({ ask } = await import('../src/modules/chatbot/chatbot.service'));
  const { MIN_SIMILARITY } = await import('../src/modules/chatbot/retrieval.service');
  console.log(`Sinov chegarasi MIN_SIMILARITY = ${MIN_SIMILARITY}\n`);
}

let failed = 0;
const check = (name: string, cond: boolean, extra = '') => {
  console.log(`${cond ? '✅' : '❌'} ${name}${extra ? ' — ' + extra : ''}`);
  if (!cond) failed++;
};

async function seed() {
  await pool.query(`TRUNCATE content_embeddings, ai_usage, chat_sessions, chat_messages RESTART IDENTITY CASCADE`);
  await pool.query(`DELETE FROM news; DELETE FROM achievements; DELETE FROM documents; DELETE FROM management;`);

  await pool.query(
    `INSERT INTO school_info (key, title, content) VALUES
     ('history','Maktab tarixi','Shomanay tumani 14-maktab 1985-yilda tashkil etilgan va yillar davomida minglab oquvchilarga talim bergan.'),
     ('work_hours','Ish vaqti','Dushanba dan Shanba gacha 08:00 dan 18:00 gacha ishlaymiz.')
     ON CONFLICT (key) DO UPDATE SET content = EXCLUDED.content`
  );
  await pool.query(
    `INSERT INTO news (title, slug, content, category, is_published, published_at)
     VALUES ('Yangi oquv yili boshlandi','yangi-oquv-yili',
             $1, 'news', true, NOW())`,
    ['Maktabda yangi oquv yili tantanali marosim bilan ochildi. ' + 'Tadbirda oqituvchilar, otaonalar va mehmonlar ishtirok etdi. '.repeat(40)]
  );
  await pool.query(
    `INSERT INTO news (title, slug, content, is_published) VALUES
     ('Nashr qilinmagan yangilik','yashirin','Bu matn bilim bazasiga tushmasligi kerak', false)`
  );
  await pool.query(
    `INSERT INTO management (full_name, position, phone, email, is_active)
     VALUES ('Karimov Bek','Maktab direktori','+998901234567','dir@edu.uz', true)`
  );
  await pool.query(
    `INSERT INTO documents (title, description, file_url, category, is_public) VALUES
     ('Ichki tartib qoidalari','Maktab ichki tartib qoidalari hujjati','/u/1.pdf','regulations', true),
     ('Maxfiy hujjat','Korinmasligi kerak','/u/2.pdf','other', false)`
  );
  await pool.query(
    `INSERT INTO achievements (person_name, person_type, class_name, title, description, level)
     VALUES ('Aliyeva Nilufar','student','9-A','Matematika olimpiadasi galabasi','Viloyat bosqichida birinchi orin','viloyat')`
  );
  await pool.query(
    `INSERT INTO users (login, password_hash, full_name, role, bio, education, experience_years, is_active)
     VALUES ('teacher_test','x','Aliyev Aziz','teacher','Tajribali matematika oqituvchisi','Oliy malumot', 12, true)
     ON CONFLICT (login) DO NOTHING`
  );
}

async function main() {
  await loadModules();
  await seed();

  // ===== 1. Birinchi indeksatsiya =====
  const r1 = await reindex();
  check('reindex: chunklar yigildi', r1.collected > 0, `${r1.collected} chunk, ${r1.embedded} embed qilindi`);
  check('reindex: hammasi embed qilindi', r1.embedded === r1.collected);
  check('reindex: embedding API chaqirildi', embedCalls > 0, `${embedCalls} batch`);

  // ===== 2. Nashr qilinmagan/maxfiy kontent tushmaganini tekshirish =====
  const { rows: leak } = await pool.query(
    `SELECT count(*)::int AS n FROM content_embeddings
     WHERE content ILIKE '%tushmasligi kerak%' OR content ILIKE '%Korinmasligi kerak%'`
  );
  check('xavfsizlik: nashr qilinmagan va maxfiy kontent indekslanmadi', leak[0].n === 0);

  const { rows: phone } = await pool.query(
    `SELECT count(*)::int AS n FROM content_embeddings WHERE content LIKE '%998901234567%'`
  );
  check('xavfsizlik: rahbariyat telefoni indekslanmadi', phone[0].n === 0);

  // ===== 3. Uzun yangilik bir nechta chunkga bolindi =====
  const { rows: newsChunks } = await pool.query(
    `SELECT count(*)::int AS n FROM content_embeddings WHERE source_table='news'`
  );
  check('chunking: uzun yangilik bolindi', newsChunks[0].n > 1, `${newsChunks[0].n} chunk`);

  // ===== 4. Takroriy reindeks — hash orqali ozgarmagan =====
  const callsBefore = embedCalls;
  const r2 = await reindex();
  check('hash: ikkinchi reindeksda qayta embed qilinmadi',
    r2.embedded === 0 && embedCalls === callsBefore, `unchanged=${r2.unchanged}`);

  // ===== 5. Kontent ozgarsa — faqat osha chunk qayta embed qilinadi =====
  await pool.query(`UPDATE school_info SET content='Maktab 1985-yilda ochilgan, yangilangan matn' WHERE key='history'`);
  const r3 = await reindex({ tables: ['school_info'] });
  check('hash: ozgargan chunk qayta embed qilindi', r3.embedded === 1, `embedded=${r3.embedded}`);

  // ===== 6. Manbadan ochirilgan yozuv bazadan ham ketadi =====
  await pool.query(`DELETE FROM documents WHERE title='Ichki tartib qoidalari'`);
  const r4 = await reindex({ tables: ['documents'] });
  check('tozalash: ochirilgan hujjat bilim bazasidan ketdi', r4.deleted >= 1, `deleted=${r4.deleted}`);

  // ===== 7. Qidiruv =====
  const hits = await search('Maktab qachon tashkil etilgan');
  check('qidiruv: natija topildi', hits.length > 0, `${hits.length} ta`);
  check('qidiruv: birinchi natija maktab tarixi',
    hits[0]?.source_table === 'school_info', `${hits[0]?.source_table} / ${hits[0]?.title}`);
  check('qidiruv: grounding aniqlandi', hasGrounding(hits), `eng yuqori similarity=${hits[0]?.similarity.toFixed(3)}`);

  const teacherHits = await search('Aliyev Aziz matematika oqituvchisi');
  check('qidiruv: oqituvchi topildi',
    teacherHits[0]?.source_table === 'teachers', `${teacherHits[0]?.source_table}`);

  // ===== 8. ask() — grounded yol =====
  const genBefore = generateCalls;
  const a1 = await ask({ message: 'Maktab qachon tashkil etilgan?', lang: 'uz' });
  check('ask: javob qaytdi', a1.answer.length > 0, JSON.stringify(a1.answer));
  check('ask: grounded = true', a1.grounded === true);
  check('ask: manba korsatildi', a1.sources.length > 0, JSON.stringify(a1.sources[0]));
  check('ask: model chaqirildi', generateCalls === genBefore + 1);
  check('ask: sessiya kaliti berildi', !!a1.session_key);

  // ===== 9. ask() — sessiya davom etadi =====
  const a2 = await ask({ sessionKey: a1.session_key, message: 'Ish vaqti qanday?', lang: 'uz' });
  check('ask: sessiya saqlanib qoldi', a2.session_key === a1.session_key);
  const { rows: sess } = await pool.query('SELECT count(*)::int AS n FROM chat_sessions');
  check('ask: yangi sessiya ochilmadi', sess[0].n === 1, `${sess[0].n} sessiya`);
  const { rows: msgs } = await pool.query('SELECT count(*)::int AS n FROM chat_messages');
  check('ask: xabarlar saqlandi', msgs[0].n === 4, `${msgs[0].n} xabar`);

  // ===== 10. ask() — kontekst yoq, model chaqirilmasligi kerak =====
  const genBefore2 = generateCalls;
  const a3 = await ask({ message: 'Yupiter sayyorasining massasi qancha?', lang: 'ru' });
  check('ask: kontekstsiz savolda grounded = false', a3.grounded === false);
  check('ask: kontekstsiz savolda model CHAQIRILMADI (xarajat tejaldi)',
    generateCalls === genBefore2, `generateCalls=${generateCalls}`);
  check('ask: javob rus tilida qaytdi', /[А-Яа-я]/.test(a3.answer), a3.answer.slice(0, 40));

  // Kutilgan qiymatlar haqiqiy natijadan hisoblanadi: soxta (leksik) embedding
  // bilan qaysi savol grounded bo'lishi oldindan aniq emas.
  const asks = [a1, a2, a3];
  const expectedUngrounded = asks.filter(a => !a.grounded).length;
  const expectedModelCalls = asks.filter(a => a.grounded).length;
  console.log(`   (grounded holati: ${asks.map(a => a.grounded).join(', ')})`);

  const { rows: ungrounded } = await pool.query(
    `SELECT count(*)::int AS n FROM chat_messages WHERE was_grounded = false`
  );
  check('ask: javobsiz savollar bazaga yozildi',
    ungrounded[0].n === expectedUngrounded, `${ungrounded[0].n} ta (kutilgan ${expectedUngrounded})`);

  // ===== 11. Xarajat hisobi =====
  const { rows: usage } = await pool.query(`SELECT feature, calls, cost_usd::float FROM ai_usage ORDER BY feature`);
  const chatbotUsage = usage.find(u => u.feature === 'chatbot');
  check('xarajat: faqat model chaqirilgan savollar hisoblandi',
    chatbotUsage?.calls === expectedModelCalls,
    `calls=${chatbotUsage?.calls}, kutilgan=${expectedModelCalls}`);
  check('xarajat: chatbot xarajati nolga teng emas', (chatbotUsage?.cost_usd ?? 0) > 0,
    `$${chatbotUsage?.cost_usd}`);

  // ===== 12. Status =====
  const status = await getIndexStatus();
  check('status: manbalar boyicha statistika', status.by_source.length > 0,
    status.by_source.map((s: any) => `${s.source_table}:${s.chunks}`).join(' '));

  console.log(failed === 0 ? '\n✅ Barcha e2e sinovlar otdi.' : `\n❌ ${failed} ta sinov muvaffaqiyatsiz.`);
  await pool.end();
  process.exit(failed === 0 ? 0 : 1);
}

main().catch(async err => {
  console.error('XATO:', err);
  if (pool) await pool.end();
  process.exit(1);
});
