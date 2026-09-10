import { pool } from '../../config/db';

/**
 * Bilim bazasi manbalari.
 *
 * Muhim qoida: bu yerda faqat allaqachon ommaviy API orqali ochiq bo'lgan
 * ma'lumot indekslanadi. Shaxsiy ma'lumotlar — o'quvchi ballari, murojaat
 * xabarlari, foydalanuvchi telefon raqamlari — bilim bazasiga umuman tushmaydi.
 */

export interface SourceChunk {
  source_table: string;
  source_id: number;
  chunk_index: number;
  title: string | null;
  content: string;
  url_path: string | null;
}

const MAX_CHUNK_LEN = 1200;
const CHUNK_OVERLAP = 150;

/** HTML teglarini olib tashlaydi — yangilik matni boyitilgan matn bo'lishi mumkin. */
export function stripHtml(input: string): string {
  return input
    .replace(/<(script|style)[^>]*>[\s\S]*?<\/\1>/gi, ' ')
    .replace(/<br\s*\/?>/gi, '\n')
    .replace(/<\/(p|div|li|h[1-6])>/gi, '\n')
    .replace(/<[^>]+>/g, ' ')
    .replace(/&nbsp;/gi, ' ')
    .replace(/&amp;/gi, '&')
    .replace(/&lt;/gi, '<')
    .replace(/&gt;/gi, '>')
    .replace(/&quot;/gi, '"')
    .replace(/&#39;/gi, "'")
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

/**
 * Chegaradan uzun bo'lakni kesadi. So'z chegarasi qidiriladi, topilmasa
 * (masalan uzun havola yoki bo'sh joysiz matn) qattiq kesiladi —
 * asosiy shart: hech bir belgi yo'qolmasligi kerak.
 */
function hardSplit(text: string, maxLen: number): string[] {
  const out: string[] = [];
  let rest = text;
  while (rest.length > maxLen) {
    const boundary = rest.slice(0, maxLen).lastIndexOf(' ');
    const cut = boundary > maxLen * 0.6 ? boundary : maxLen;
    out.push(rest.slice(0, cut).trim());
    rest = rest.slice(cut).trim();
  }
  if (rest) out.push(rest);
  return out;
}

/**
 * Uzun matnni paragraf chegarasi bo'yicha bo'ladi.
 * Chunklar orasida ustma-ust qism qoldiriladi — shunda chegarada
 * bo'linib qolgan jumla ikkala chunkda ham to'liq uchraydi.
 */
export function chunkText(text: string, maxLen = MAX_CHUNK_LEN, overlap = CHUNK_OVERLAP): string[] {
  const clean = text.trim();
  if (clean.length <= maxLen) return clean ? [clean] : [];

  const paragraphs = clean.split(/\n{2,}/);
  const chunks: string[] = [];
  let current = '';

  const pushCurrent = () => {
    if (!current.trim()) return;
    chunks.push(current.trim());
    current = current.length > overlap ? current.slice(-overlap) : current;
  };

  for (const paragraph of paragraphs) {
    // Bitta paragrafning o'zi juda uzun bo'lsa — bo'laklarga ajratamiz
    const parts = paragraph.length > maxLen ? hardSplit(paragraph, maxLen) : [paragraph];

    for (const part of parts) {
      if (current && current.length + part.length + 2 > maxLen) pushCurrent();
      current += (current ? '\n\n' : '') + part.trim();
    }
  }
  if (current.trim()) chunks.push(current.trim());

  return chunks;
}

/**
 * Chunk boshiga kontekst sarlavhasi qo'shiladi — qidiruv aniqligini
 * sezilarli oshiradi, chunki matn parchasi o'zi qaysi mavzuga tegishli
 * ekanini vektor darajasida ham ko'rsatadi.
 */
function withContext(prefix: string, body: string): string {
  return `${prefix}\n\n${body}`.trim();
}

type Generator = () => Promise<SourceChunk[]>;

// ===== MAKTAB HAQIDA =====
const schoolInfo: Generator = async () => {
  const { rows } = await pool.query(
    `SELECT id, key, title, content FROM school_info WHERE content IS NOT NULL AND content <> ''`
  );
  return rows.map(r => ({
    source_table: 'school_info',
    source_id: r.id,
    chunk_index: 0,
    title: r.title || r.key,
    content: withContext(`Maktab haqida — ${r.title || r.key}`, stripHtml(r.content)),
    url_path: '/about',
  }));
};

// ===== RAHBARIYAT =====
// Telefon va email indekslanmaydi — javobda shaxsiy kontakt tarqalmasligi uchun.
const management: Generator = async () => {
  const { rows } = await pool.query(
    `SELECT id, full_name, position FROM management WHERE is_active = true ORDER BY order_num, id`
  );
  return rows.map(r => ({
    source_table: 'management',
    source_id: r.id,
    chunk_index: 0,
    title: r.position,
    content: withContext(
      'Maktab rahbariyati',
      `${r.full_name} — ${r.position}. Bog'lanish uchun maktabning murojaat sahifasidan foydalaning.`
    ),
    url_path: '/about',
  }));
};

// ===== YANGILIKLAR =====
const news: Generator = async () => {
  const { rows } = await pool.query(
    `SELECT id, title, slug, content, category, published_at
     FROM news WHERE is_published = true ORDER BY published_at DESC NULLS LAST`
  );
  const categoryLabel: Record<string, string> = {
    news: 'Yangilik',
    event: 'Tadbir',
    announcement: "E'lon",
  };

  const out: SourceChunk[] = [];
  for (const r of rows) {
    const label = categoryLabel[r.category] || 'Yangilik';
    const date = r.published_at ? new Date(r.published_at).toISOString().slice(0, 10) : null;
    const prefix = `${label}: ${r.title}${date ? ` (${date})` : ''}`;

    chunkText(stripHtml(r.content || '')).forEach((chunk, i) => {
      out.push({
        source_table: 'news',
        source_id: r.id,
        chunk_index: i,
        title: r.title,
        content: withContext(prefix, chunk),
        url_path: `/news/${r.slug}`,
      });
    });
  }
  return out;
};

// ===== HUJJATLAR =====
// Faqat sarlavha va tavsif — PDF ichidagi matn hozircha o'qilmaydi.
const documents: Generator = async () => {
  const { rows } = await pool.query(
    `SELECT id, title, description, category FROM documents WHERE is_public = true`
  );
  const categoryLabel: Record<string, string> = {
    orders: 'Buyruqlar',
    regulations: 'Nizomlar',
    reports: 'Hisobotlar',
    plans: 'Rejalar',
    other: 'Boshqa hujjatlar',
  };
  return rows.map(r => ({
    source_table: 'documents',
    source_id: r.id,
    chunk_index: 0,
    title: r.title,
    content: withContext(
      `Hujjat (${categoryLabel[r.category] || r.category}): ${r.title}`,
      `${stripHtml(r.description || '')}\nBu hujjatni maktab saytining hujjatlar bo'limidan yuklab olish mumkin.`
    ),
    url_path: '/documents',
  }));
};

// ===== YUTUQLAR =====
const achievements: Generator = async () => {
  const { rows } = await pool.query(
    `SELECT a.id, a.person_name, a.person_type, a.class_name, a.title,
            a.description, a.level, a.award_date, s.name AS subject_name
     FROM achievements a
     LEFT JOIN subjects s ON s.id = a.subject_id`
  );
  return rows.map(r => {
    const who = r.person_type === 'teacher' ? "o'qituvchi" : "o'quvchi";
    const parts = [
      `${r.person_name} — ${who}${r.class_name ? `, ${r.class_name} sinf` : ''}.`,
      `Yutuq: ${r.title}.`,
      r.level ? `Daraja: ${r.level}.` : '',
      r.subject_name ? `Fan: ${r.subject_name}.` : '',
      r.award_date ? `Sana: ${new Date(r.award_date).toISOString().slice(0, 10)}.` : '',
      stripHtml(r.description || ''),
    ].filter(Boolean);

    return {
      source_table: 'achievements',
      source_id: r.id,
      chunk_index: 0,
      title: r.title,
      content: withContext('Maktab yutug\'i', parts.join(' ')),
      url_path: '/achievements',
    };
  });
};

// ===== O'QITUVCHILAR =====
// Filtr ommaviy /api/teachers endpointi bilan bir xil: rol + faollik.
const teachers: Generator = async () => {
  const { rows } = await pool.query(
    `SELECT u.id, u.full_name, u.bio, u.education, u.experience_years, u.achievements_text,
            COALESCE(json_agg(s.name) FILTER (WHERE s.id IS NOT NULL), '[]') AS subjects
     FROM users u
     LEFT JOIN teacher_subjects ts ON ts.teacher_id = u.id
     LEFT JOIN subjects s ON s.id = ts.subject_id
     WHERE u.role = 'teacher' AND u.is_active = true
     GROUP BY u.id`
  );
  return rows.map(r => {
    const subjects: string[] = r.subjects || [];
    const parts = [
      `${r.full_name} — maktab o'qituvchisi.`,
      subjects.length ? `Fanlar: ${subjects.join(', ')}.` : '',
      r.experience_years ? `Ish tajribasi: ${r.experience_years} yil.` : '',
      r.education ? `Ma'lumoti: ${stripHtml(r.education)}.` : '',
      stripHtml(r.bio || ''),
      stripHtml(r.achievements_text || ''),
    ].filter(Boolean);

    return {
      source_table: 'teachers',
      source_id: r.id,
      chunk_index: 0,
      title: r.full_name,
      content: withContext("O'qituvchi profili", parts.join(' ')),
      url_path: `/teachers/${r.id}`,
    };
  });
};

// ===== FANLAR =====
const subjects: Generator = async () => {
  const { rows } = await pool.query(
    `SELECT id, name, description FROM subjects WHERE description IS NOT NULL AND description <> ''`
  );
  return rows.map(r => ({
    source_table: 'subjects',
    source_id: r.id,
    chunk_index: 0,
    title: r.name,
    content: withContext(`Fan: ${r.name}`, stripHtml(r.description)),
    url_path: null,
  }));
};

export const SOURCES: Record<string, Generator> = {
  school_info: schoolInfo,
  management,
  news,
  documents,
  achievements,
  teachers,
  subjects,
};

export const SOURCE_NAMES = Object.keys(SOURCES);
