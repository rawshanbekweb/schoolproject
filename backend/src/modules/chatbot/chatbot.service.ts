import crypto from 'crypto';
import { pool } from '../../config/db';
import { generateAnswer, ChatTurn } from '../../config/ai';
import { search, hasGrounding, MIN_SIMILARITY, RetrievedChunk } from './retrieval.service';
import { recordUsage, assertBudget } from './usage.service';
import {
  ChatLang, FALLBACK_ANSWER, buildSystemPrompt, buildContextBlock, buildUserTurn,
  buildToolContext,
} from './prompts';
import { detectScheduleIntent, runScheduleTool } from './tools/schedule.tool';

/** Kontekstga qo'shiladigan oldingi xabarlar soni (3 savol-javob). */
const HISTORY_LIMIT = 6;
/** Modelga uzatiladigan chunklar soni. */
const CONTEXT_CHUNKS = 6;
/** Javobda ko'rsatiladigan manbalar soni. */
const MAX_SOURCES = 3;

/**
 * Manba ro'yxatiga tushish uchun eng yaxshi natijadan qancha orqada
 * qolish mumkinligi. Chegaradan o'tgan hamma chunkni manba sifatida
 * ko'rsatish chalg'itadi — javobda ishlatilmagan hujjatlar ham ro'yxatga
 * tushib qoladi. Faqat eng yaxshi natijaga yaqinlari ko'rsatiladi.
 */
const SOURCE_MARGIN = 0.06;

const RETENTION_DAYS = Number(process.env.CHAT_RETENTION_DAYS) || 90;

export interface AskInput {
  sessionKey?: string | null;
  message: string;
  lang: ChatLang;
  ip?: string;
}

export interface AnswerSource {
  title: string | null;
  url_path: string | null;
  source_table: string;
}

export interface AskResult {
  session_key: string;
  answer: string;
  grounded: boolean;
  sources: AnswerSource[];
}

function hashIp(ip?: string): string | null {
  if (!ip) return null;
  const salt = process.env.IP_HASH_SALT || process.env.JWT_SECRET || '';
  return crypto.createHash('sha256').update(ip + salt).digest('hex');
}

/** Sessiyani topadi yoki yangisini ochadi. */
async function resolveSession(sessionKey: string | null | undefined, lang: ChatLang, ip?: string) {
  if (sessionKey) {
    const { rows } = await pool.query(
      `UPDATE chat_sessions SET last_active_at = NOW(), lang = $2
       WHERE session_key = $1 RETURNING id, session_key`,
      [sessionKey, lang]
    );
    if (rows[0]) return rows[0];
  }

  const { rows } = await pool.query(
    `INSERT INTO chat_sessions (session_key, lang, ip_hash)
     VALUES ($1, $2, $3) RETURNING id, session_key`,
    [crypto.randomUUID(), lang, hashIp(ip)]
  );
  return rows[0];
}

async function loadHistory(sessionId: number): Promise<ChatTurn[]> {
  const { rows } = await pool.query(
    `SELECT role, content FROM (
       SELECT role, content, created_at FROM chat_messages
       WHERE session_id = $1 ORDER BY created_at DESC LIMIT $2
     ) recent ORDER BY created_at ASC`,
    [sessionId, HISTORY_LIMIT]
  );
  return rows.map(r => ({
    role: r.role === 'assistant' ? ('model' as const) : ('user' as const),
    text: r.content,
  }));
}

function collectSources(chunks: RetrievedChunk[]): AnswerSource[] {
  const best = Math.max(...chunks.map(c => c.similarity), 0);
  const cutoff = Math.max(MIN_SIMILARITY, best - SOURCE_MARGIN);

  const seen = new Set<string>();
  const out: AnswerSource[] = [];
  for (const c of [...chunks].sort((a, b) => b.similarity - a.similarity)) {
    if (c.similarity < cutoff) continue;
    const key = `${c.source_table}:${c.source_id}`;
    if (seen.has(key)) continue;
    seen.add(key);
    out.push({ title: c.title, url_path: c.url_path, source_table: c.source_table });
    if (out.length >= MAX_SOURCES) break;
  }
  return out;
}

/** 90 kundan eski sessiyalar o'chiriladi (xabarlar CASCADE bilan ketadi). */
let lastCleanupAt = 0;
async function maybeCleanupOldSessions(): Promise<void> {
  const HOUR_MS = 60 * 60 * 1000;
  if (Date.now() - lastCleanupAt < HOUR_MS) return;
  lastCleanupAt = Date.now();
  try {
    await pool.query(
      `DELETE FROM chat_sessions WHERE last_active_at < NOW() - ($1 || ' days')::interval`,
      [RETENTION_DAYS]
    );
  } catch (err) {
    // Tozalash muvaffaqiyatsiz bo'lsa ham foydalanuvchi so'rovi to'xtamasligi kerak
    console.error('❌ Chat tarixini tozalashda xato:', err);
  }
}

async function saveTurn(
  sessionId: number,
  userMessage: string,
  answer: string,
  sources: AnswerSource[],
  meta: { grounded: boolean; tokensIn: number; tokensOut: number; costUsd: number; latencyMs: number }
): Promise<void> {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    await client.query(
      `INSERT INTO chat_messages (session_id, role, content) VALUES ($1, 'user', $2)`,
      [sessionId, userMessage]
    );
    await client.query(
      `INSERT INTO chat_messages
         (session_id, role, content, sources, was_grounded, tokens_in, tokens_out, cost_usd, latency_ms)
       VALUES ($1, 'assistant', $2, $3, $4, $5, $6, $7, $8)`,
      [sessionId, answer, JSON.stringify(sources), meta.grounded,
       meta.tokensIn, meta.tokensOut, meta.costUsd, meta.latencyMs]
    );
    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

/**
 * Savolga javob beradi.
 *
 * Kontekst topilmasa modelga umuman murojaat qilinmaydi — tayyor "bilmayman"
 * javobi qaytariladi. Bu ham xarajatni tejaydi, ham to'qib chiqarish
 * ehtimolini yo'q qiladi.
 */
export async function ask(input: AskInput): Promise<AskResult> {
  const startedAt = Date.now();
  await assertBudget();
  void maybeCleanupOldSessions();

  const session = await resolveSession(input.sessionKey, input.lang, input.ip);

  // ===== Tool yo'li: jadval savollari =====
  // Jadval strukturaviy ma'lumot bo'lgani uchun vektor qidiruvga tayanmaydi.
  // Tool javob bermasa (masalan savol jadvalga oid emas) — odatdagi RAG yo'liga tushamiz.
  const intent = detectScheduleIntent(input.message);
  if (intent) {
    const tool = await runScheduleTool(intent);
    if (tool) {
      return finishWithModel({
        session,
        input,
        startedAt,
        userTurn: buildUserTurn(buildToolContext(tool.title, tool.content), input.message),
        sources: [{ title: tool.title, url_path: tool.url_path, source_table: 'schedule' }],
      });
    }
  }

  const results = await search(input.message, { limit: CONTEXT_CHUNKS });

  // ===== Kontekst yetarli emas =====
  if (!hasGrounding(results)) {
    const answer = FALLBACK_ANSWER[input.lang];
    await saveTurn(session.id, input.message, answer, [], {
      grounded: false, tokensIn: 0, tokensOut: 0, costUsd: 0,
      latencyMs: Date.now() - startedAt,
    });
    return { session_key: session.session_key, answer, grounded: false, sources: [] };
  }

  // ===== RAG yo'li: javob generatsiyasi =====
  return finishWithModel({
    session,
    input,
    startedAt,
    userTurn: buildUserTurn(buildContextBlock(results), input.message),
    sources: collectSources(results),
  });
}

/**
 * Modelga murojaat qilib javobni yakunlaydi — tool yo'li ham, RAG yo'li ham
 * shu funksiyaga keladi, shunda xarajat hisobi va saqlash mantiqi bir joyda turadi.
 */
async function finishWithModel(args: {
  session: { id: number; session_key: string };
  input: AskInput;
  startedAt: number;
  userTurn: string;
  sources: AnswerSource[];
}): Promise<AskResult> {
  const { session, input, startedAt, userTurn } = args;

  const history = await loadHistory(session.id);
  const generated = await generateAnswer(buildSystemPrompt(input.lang), history, userTurn);

  await recordUsage('chatbot', {
    calls: 1,
    tokensIn: generated.tokensIn,
    tokensOut: generated.tokensOut,
    costUsd: generated.costUsd,
  });

  // Model javob bermagan (xavfsizlik filtri yoki bo'sh javob) — zaxira matn
  const grounded = !generated.blocked && generated.text.length > 0;
  const answer = grounded ? generated.text : FALLBACK_ANSWER[input.lang];
  const sources = grounded ? args.sources : [];

  await saveTurn(session.id, input.message, answer, sources, {
    grounded,
    tokensIn: generated.tokensIn,
    tokensOut: generated.tokensOut,
    costUsd: generated.costUsd,
    latencyMs: Date.now() - startedAt,
  });

  return { session_key: session.session_key, answer, grounded, sources };
}
