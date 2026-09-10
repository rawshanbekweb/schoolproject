import { pool } from '../../config/db';
import { AppError } from '../../middleware/errorHandler';

/** Joriy oy — 'YYYY-MM' ko'rinishida. */
export function currentMonth(): string {
  return new Date().toISOString().slice(0, 7);
}

export interface UsageDelta {
  calls?: number;
  tokensIn?: number;
  tokensOut?: number;
  costUsd?: number;
}

/** Oylik xarajat hisobini to'ldiradi (feature + month bo'yicha jamlanadi). */
export async function recordUsage(feature: string, delta: UsageDelta): Promise<void> {
  await pool.query(
    `INSERT INTO ai_usage (feature, month, calls, tokens_in, tokens_out, cost_usd, updated_at)
     VALUES ($1, $2, $3, $4, $5, $6, NOW())
     ON CONFLICT (feature, month) DO UPDATE SET
       calls      = ai_usage.calls + EXCLUDED.calls,
       tokens_in  = ai_usage.tokens_in + EXCLUDED.tokens_in,
       tokens_out = ai_usage.tokens_out + EXCLUDED.tokens_out,
       cost_usd   = ai_usage.cost_usd + EXCLUDED.cost_usd,
       updated_at = NOW()`,
    [feature, currentMonth(), delta.calls ?? 0, delta.tokensIn ?? 0,
     delta.tokensOut ?? 0, delta.costUsd ?? 0]
  );
}

/** Joriy oyda barcha AI funksiyalari bo'yicha sarflangan mablag'. */
export async function getMonthlySpend(): Promise<number> {
  const { rows } = await pool.query(
    `SELECT COALESCE(SUM(cost_usd), 0)::float AS total FROM ai_usage WHERE month = $1`,
    [currentMonth()]
  );
  return rows[0].total;
}

/** Oylik statistika — admin panel uchun. */
export async function getMonthlyBreakdown(): Promise<any[]> {
  const { rows } = await pool.query(
    `SELECT feature, calls, tokens_in, tokens_out, cost_usd::float, updated_at
     FROM ai_usage WHERE month = $1 ORDER BY cost_usd DESC`,
    [currentMonth()]
  );
  return rows;
}

/**
 * Oylik byudjet chegarasini tekshiradi.
 * Chegara oshgan bo'lsa AI chaqiruvi umuman amalga oshirilmaydi —
 * bu kutilmagan hisobning oldini oladigan asosiy himoya.
 */
export async function assertBudget(): Promise<void> {
  const limit = Number(process.env.AI_MONTHLY_BUDGET_USD);
  if (!limit || limit <= 0) return; // chegara belgilanmagan

  const spent = await getMonthlySpend();
  if (spent >= limit) {
    throw new AppError(
      'AI xizmati uchun oylik byudjet chegarasi tugadi. Administrator bilan bog\'laning',
      503
    );
  }
}
