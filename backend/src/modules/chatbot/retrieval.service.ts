import { pool } from '../../config/db';
import { embedTexts, toVectorLiteral } from '../../config/ai';

/**
 * Gibrid qidiruv: vektor o'xshashligi + kalit so'z qidiruvi.
 *
 * Faqat vektor qidiruv ism-familiya va aniq atamalarda (masalan hujjat raqami,
 * fan nomi) xato qiladi; faqat FTS esa o'zbek tilida morfologiya sababli zaif —
 * Postgres'da o'zbek tili uchun stemmer yo'q, shuning uchun 'simple' konfiguratsiya
 * ishlatiladi. Ikkala ro'yxat RRF (reciprocal rank fusion) orqali birlashtiriladi.
 */

const RRF_K = 60;
const DEFAULT_CANDIDATES = 10;

/**
 * Shu chegaradan past o'xshashlik "kontekst topilmadi" deb hisoblanadi.
 *
 * Qiymat o'lchov asosida tanlangan (scripts/chatbot-quality.ts, gemini-embedding-2,
 * 768 o'lchov): maktabga oid savollar 0.665–0.843 oralig'ida, begona savollar
 * ("Yupiterning massasi", "uy vazifasini yechib ber") 0.557–0.628 oralig'ida ball
 * to'playdi. 0.64 shu ikki guruhni ajratadi.
 *
 * DIQQAT: bu chegara modelga va kontent hajmiga bog'liq. Bilim bazasi sezilarli
 * o'sganda yoki embedding modeli almashtirilganda qayta o'lchash kerak.
 */
export const MIN_SIMILARITY = Number(process.env.CHATBOT_MIN_SIMILARITY) || 0.64;

export interface RetrievedChunk {
  id: number;
  source_table: string;
  source_id: number;
  title: string | null;
  content: string;
  url_path: string | null;
  similarity: number;
  fts_rank: number;
  score: number;
}

export interface SearchOptions {
  limit?: number;
  candidates?: number;
}

export async function search(query: string, opts: SearchOptions = {}): Promise<RetrievedChunk[]> {
  const limit = opts.limit ?? 6;
  const candidates = opts.candidates ?? DEFAULT_CANDIDATES;

  const [queryVector] = await embedTexts([query], 'RETRIEVAL_QUERY');

  const [vectorHits, ftsHits] = await Promise.all([
    pool.query(
      `SELECT id, source_table, source_id, title, content, url_path,
              1 - (embedding <=> $1::vector) AS similarity
       FROM content_embeddings
       WHERE embedding IS NOT NULL
       ORDER BY embedding <=> $1::vector
       LIMIT $2`,
      [toVectorLiteral(queryVector), candidates]
    ),
    pool.query(
      `SELECT ce.id, ce.source_table, ce.source_id, ce.title, ce.content, ce.url_path,
              ts_rank(ce.tsv, q) AS fts_rank
       FROM content_embeddings ce, plainto_tsquery('simple', $1) q
       WHERE ce.tsv @@ q
       ORDER BY fts_rank DESC
       LIMIT $2`,
      [query, candidates]
    ),
  ]);

  const merged = new Map<number, RetrievedChunk>();

  const addHit = (row: any, rank: number) => {
    const existing = merged.get(row.id);
    const rrf = 1 / (RRF_K + rank);
    if (existing) {
      existing.score += rrf;
      existing.similarity = Math.max(existing.similarity, Number(row.similarity) || 0);
      existing.fts_rank = Math.max(existing.fts_rank, Number(row.fts_rank) || 0);
      return;
    }
    merged.set(row.id, {
      id: row.id,
      source_table: row.source_table,
      source_id: row.source_id,
      title: row.title,
      content: row.content,
      url_path: row.url_path,
      similarity: Number(row.similarity) || 0,
      fts_rank: Number(row.fts_rank) || 0,
      score: rrf,
    });
  };

  vectorHits.rows.forEach((row, i) => addHit(row, i + 1));
  ftsHits.rows.forEach((row, i) => addHit(row, i + 1));

  return [...merged.values()]
    .sort((a, b) => b.score - a.score)
    .slice(0, limit);
}

/**
 * Topilgan kontekst javob berish uchun yetarlimi.
 * Yetarli bo'lmasa model "bilmayman" javobini beradi — to'qib chiqarmaydi.
 */
export function hasGrounding(results: RetrievedChunk[]): boolean {
  return results.some(r => r.similarity >= MIN_SIMILARITY);
}
