import crypto from 'crypto';
import { pool } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';
import { embedTexts, toVectorLiteral, estimateTokens, PRICING } from '../../config/ai';
import { SOURCES, SOURCE_NAMES, SourceChunk } from './sources';
import { recordUsage } from './usage.service';

// Gemini batchEmbedContents bir so'rovda cheklangan sonli matnni qabul qiladi
const EMBED_BATCH_SIZE = 64;

export interface ReindexOptions {
  tables?: string[];
  /** true bo'lsa matn o'zgarmagan bo'lsa ham qayta embed qilinadi */
  full?: boolean;
}

export interface ReindexResult {
  tables: string[];
  collected: number;
  embedded: number;
  unchanged: number;
  deleted: number;
  tokens: number;
  costUsd: number;
  durationMs: number;
}

function hashChunk(chunk: SourceChunk): string {
  return crypto
    .createHash('sha256')
    .update(`${chunk.title ?? ''}\n${chunk.content}\n${chunk.url_path ?? ''}`)
    .digest('hex');
}

/**
 * Bilim bazasini qayta quradi.
 *
 * Xarajatni tejash mantiqi: har bir chunk matnining SHA-256 hash'i saqlanadi.
 * Reindeks paytida faqat yangi yoki matni o'zgargan chunklar embed qilinadi,
 * qolganlari tegilmaydi. Shu sababli takroriy reindeks deyarli bepul.
 */
export async function reindex(opts: ReindexOptions = {}): Promise<ReindexResult> {
  const startedAt = Date.now();
  const tables = opts.tables?.length ? opts.tables : SOURCE_NAMES;

  const unknown = tables.filter(t => !SOURCE_NAMES.includes(t));
  if (unknown.length) {
    throw new AppError(`Noma'lum manba: ${unknown.join(', ')}`, 400);
  }

  // 1. Barcha manbalardan chunklarni yig'amiz
  const chunks: SourceChunk[] = [];
  for (const table of tables) {
    chunks.push(...(await SOURCES[table]()));
  }

  // 2. Mavjud hash'lar bilan solishtiramiz
  const { rows: existingRows } = await pool.query(
    `SELECT source_table, source_id, chunk_index, content_hash
     FROM content_embeddings WHERE source_table = ANY($1::varchar[])`,
    [tables]
  );
  const existing = new Map<string, string>();
  for (const r of existingRows) {
    existing.set(`${r.source_table}:${r.source_id}:${r.chunk_index}`, r.content_hash);
  }

  const keyOf = (c: SourceChunk) => `${c.source_table}:${c.source_id}:${c.chunk_index}`;
  const hashes = new Map<string, string>();
  const toEmbed: SourceChunk[] = [];

  for (const chunk of chunks) {
    const hash = hashChunk(chunk);
    hashes.set(keyOf(chunk), hash);
    if (opts.full || existing.get(keyOf(chunk)) !== hash) toEmbed.push(chunk);
  }

  // 3. O'zgarganlarini embed qilib, bazaga yozamiz
  let tokens = 0;
  for (let i = 0; i < toEmbed.length; i += EMBED_BATCH_SIZE) {
    const batch = toEmbed.slice(i, i + EMBED_BATCH_SIZE);
    const vectors = await embedTexts(batch.map(c => c.content), 'RETRIEVAL_DOCUMENT');

    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      for (let j = 0; j < batch.length; j++) {
        const chunk = batch[j];
        tokens += estimateTokens(chunk.content);
        await client.query(
          `INSERT INTO content_embeddings
             (source_table, source_id, chunk_index, title, content, url_path, content_hash, embedding, updated_at)
           VALUES ($1,$2,$3,$4,$5,$6,$7,$8::vector,NOW())
           ON CONFLICT (source_table, source_id, chunk_index) DO UPDATE SET
             title        = EXCLUDED.title,
             content      = EXCLUDED.content,
             url_path     = EXCLUDED.url_path,
             content_hash = EXCLUDED.content_hash,
             embedding    = EXCLUDED.embedding,
             updated_at   = NOW()`,
          [chunk.source_table, chunk.source_id, chunk.chunk_index, chunk.title,
           chunk.content, chunk.url_path, hashes.get(keyOf(chunk)), toVectorLiteral(vectors[j])]
        );
      }
      await client.query('COMMIT');
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  // 4. Manbadan o'chirilgan yozuvlarni bilim bazasidan ham olib tashlaymiz
  let deleted = 0;
  for (const table of tables) {
    const tableChunks = chunks.filter(c => c.source_table === table);
    if (tableChunks.length === 0) {
      const { rowCount } = await pool.query(
        'DELETE FROM content_embeddings WHERE source_table = $1', [table]
      );
      deleted += rowCount ?? 0;
      continue;
    }
    const { rowCount } = await pool.query(
      `DELETE FROM content_embeddings
       WHERE source_table = $1
         AND (source_id, chunk_index) NOT IN (
           SELECT * FROM unnest($2::int[], $3::int[])
         )`,
      [table, tableChunks.map(c => c.source_id), tableChunks.map(c => c.chunk_index)]
    );
    deleted += rowCount ?? 0;
  }

  const costUsd = (tokens / 1_000_000) * PRICING.embeddingPer1M;
  if (toEmbed.length > 0) {
    await recordUsage('embedding', {
      calls: Math.ceil(toEmbed.length / EMBED_BATCH_SIZE),
      tokensIn: tokens,
      costUsd,
    });
  }

  return {
    tables,
    collected: chunks.length,
    embedded: toEmbed.length,
    unchanged: chunks.length - toEmbed.length,
    deleted,
    tokens,
    costUsd,
    durationMs: Date.now() - startedAt,
  };
}

/** Bilim bazasi holati — admin panel va diagnostika uchun. */
export async function getIndexStatus() {
  const { rows: bySource } = await pool.query(
    `SELECT source_table,
            COUNT(*)::int AS chunks,
            COUNT(*) FILTER (WHERE embedding IS NULL)::int AS missing_embedding,
            MAX(updated_at) AS last_indexed
     FROM content_embeddings
     GROUP BY source_table
     ORDER BY source_table`
  );
  const { rows: totals } = await pool.query(
    `SELECT COUNT(*)::int AS total, MAX(updated_at) AS last_indexed FROM content_embeddings`
  );
  return {
    total: totals[0].total,
    last_indexed: totals[0].last_indexed,
    known_sources: SOURCE_NAMES,
    by_source: bySource,
  };
}
