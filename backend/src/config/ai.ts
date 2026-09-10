import dotenv from 'dotenv';
import { AppError } from '../middleware/errorHandler';

dotenv.config();

// Google Gen AI REST API — alohida SDK qo'shilmaydi (loyihada pg ham xom
// ishlatilgani kabi, bog'liqliklar minimal saqlanadi).
const API_BASE = 'https://generativelanguage.googleapis.com/v1beta';

export const EMBEDDING_MODEL = process.env.GEMINI_EMBEDDING_MODEL || 'gemini-embedding-2';
export const EMBEDDING_DIM = Number(process.env.GEMINI_EMBEDDING_DIM) || 768;
export const CHAT_MODEL = process.env.GEMINI_CHAT_MODEL || 'gemini-3.7-flash';

// 1 mln token uchun narx (AQSh dollarida).
// Chat narxlari loyiha hujjatidagi tariflardan olingan; embedding narxi
// tasdiqlangach GEMINI_EMBEDDING_PRICE_PER_1M orqali kiritiladi.
export const PRICING = {
  chatInputPer1M: Number(process.env.GEMINI_INPUT_PRICE_PER_1M) || 0.75,
  chatOutputPer1M: Number(process.env.GEMINI_OUTPUT_PRICE_PER_1M) || 3.75,
  embeddingPer1M: Number(process.env.GEMINI_EMBEDDING_PRICE_PER_1M) || 0,
};

export type EmbeddingTask = 'RETRIEVAL_DOCUMENT' | 'RETRIEVAL_QUERY';

function apiKey(): string {
  const key = process.env.GEMINI_API_KEY;
  if (!key) throw new AppError('GEMINI_API_KEY sozlanmagan', 503);
  return key;
}

async function callApi(path: string, body: unknown): Promise<any> {
  const res = await fetch(`${API_BASE}/${path}?key=${encodeURIComponent(apiKey())}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    // Kalitni log'ga tushirmaslik uchun faqat status va javob matni yoziladi
    console.error(`❌ Gemini API xatosi (${res.status}):`, text.slice(0, 500));
    if (res.status === 429) throw new AppError('AI xizmati band. Birozdan keyin urinib ko\'ring', 429);
    throw new AppError('AI xizmatiga ulanib bo\'lmadi', 502);
  }

  return res.json();
}

/**
 * Matnlarni vektorga aylantiradi.
 * taskType qidiruv sifatiga sezilarli ta'sir qiladi: indekslashda
 * RETRIEVAL_DOCUMENT, foydalanuvchi savolida RETRIEVAL_QUERY ishlatiladi.
 */
export async function embedTexts(
  texts: string[],
  taskType: EmbeddingTask
): Promise<number[][]> {
  if (texts.length === 0) return [];

  const data = await callApi(`models/${EMBEDDING_MODEL}:batchEmbedContents`, {
    requests: texts.map(text => ({
      model: `models/${EMBEDDING_MODEL}`,
      content: { parts: [{ text }] },
      taskType,
      outputDimensionality: EMBEDDING_DIM,
    })),
  });

  const embeddings: number[][] = (data.embeddings || []).map((e: any) => e.values || []);
  if (embeddings.length !== texts.length) {
    throw new AppError('Embedding javobi kutilgan hajmda emas', 502);
  }
  for (const vec of embeddings) {
    if (vec.length !== EMBEDDING_DIM) {
      throw new AppError(
        `Embedding o'lchovi mos emas: ${vec.length} keldi, ${EMBEDDING_DIM} kutilgan. ` +
        `GEMINI_EMBEDDING_DIM va migratsiyadagi vector(N) qiymatini tekshiring`,
        500
      );
    }
  }
  return embeddings.map(normalize);
}

/**
 * Vektorni birlik uzunlikka keltiradi.
 * Ba'zi modellar (masalan gemini-embedding-001) to'liq o'lchovdan kichik
 * o'lchov so'ralganda normallashtirilmagan vektor qaytaradi. Kosinus masofasi
 * uchun bu farq qilmasa-da, normallashtirish vektorlarni model tanlovidan
 * qat'i nazar bir xil holatda saqlaydi.
 */
function normalize(vec: number[]): number[] {
  let sum = 0;
  for (const v of vec) sum += v * v;
  const len = Math.sqrt(sum);
  return len > 0 ? vec.map(v => v / len) : vec;
}

export interface ChatTurn {
  role: 'user' | 'model';
  text: string;
}

export interface GenerateResult {
  text: string;
  tokensIn: number;
  tokensOut: number;
  costUsd: number;
  blocked: boolean;
}

/**
 * Javob generatsiyasi. Token soni API javobidagi usageMetadata dan olinadi —
 * bu taxminiy hisobdan aniqroq va xarajat hisobini to'g'ri saqlaydi.
 */
export async function generateAnswer(
  systemPrompt: string,
  history: ChatTurn[],
  userText: string,
  opts: { maxOutputTokens?: number; temperature?: number } = {}
): Promise<GenerateResult> {
  const data = await callApi(`models/${CHAT_MODEL}:generateContent`, {
    system_instruction: { parts: [{ text: systemPrompt }] },
    contents: [
      ...history.map(turn => ({ role: turn.role, parts: [{ text: turn.text }] })),
      { role: 'user', parts: [{ text: userText }] },
    ],
    generationConfig: {
      temperature: opts.temperature ?? 0.2,
      maxOutputTokens: opts.maxOutputTokens ?? 800,
    },
  });

  const usage = data.usageMetadata || {};
  const tokensIn = Number(usage.promptTokenCount) || 0;
  // Fikrlash (thinking) tokenlari ham chiqish sifatida hisoblanadi
  const tokensOut = (Number(usage.candidatesTokenCount) || 0) + (Number(usage.thoughtsTokenCount) || 0);
  const costUsd =
    (tokensIn / 1_000_000) * PRICING.chatInputPer1M +
    (tokensOut / 1_000_000) * PRICING.chatOutputPer1M;

  const candidate = data.candidates?.[0];
  const blockReason = data.promptFeedback?.blockReason;
  const finishReason = candidate?.finishReason;

  if (blockReason || finishReason === 'SAFETY' || finishReason === 'PROHIBITED_CONTENT') {
    return { text: '', tokensIn, tokensOut, costUsd, blocked: true };
  }

  const text: string = (candidate?.content?.parts || [])
    .map((p: any) => p.text || '')
    .join('')
    .trim();

  return { text, tokensIn, tokensOut, costUsd, blocked: false };
}

/** pgvector literal ko'rinishi: [0.1,0.2,...] */
export function toVectorLiteral(vec: number[]): string {
  return JSON.stringify(vec);
}

/** Taxminiy token hisobi (~4 belgi = 1 token). Aniq hisob API javobidan olinadi. */
export function estimateTokens(text: string): number {
  return Math.ceil(text.length / 4);
}
