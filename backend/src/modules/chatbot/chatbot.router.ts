import { Router, Request, Response, NextFunction } from 'express';
import rateLimit from 'express-rate-limit';
import { z } from 'zod';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { reindex, getIndexStatus } from './indexer.service';
import { search, hasGrounding, MIN_SIMILARITY } from './retrieval.service';
import { getMonthlyBreakdown, getMonthlySpend, assertBudget } from './usage.service';
import { SOURCE_NAMES } from './sources';
import { ask } from './chatbot.service';
import { SUPPORTED_LANGS, normalizeLang } from './prompts';

const router = Router();
const adminOnly = [authenticate, authorize('super_admin')];

// Ommaviy endpoint — har bir chaqiruv pul turadi, shuning uchun IP bo'yicha
// alohida (app.ts dagi umumiy limitdan qat'iy nazar) cheklov qo'yiladi.
const askLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: Number(process.env.CHATBOT_RATE_LIMIT) || 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Juda ko\'p savol yubordingiz. 15 daqiqadan keyin qayta urinib ko\'ring',
  },
});

// Bir vaqtning o'zida ikkita reindeks ishlamasligi uchun —
// takroriy bosish embedding xarajatini ikki barobar oshirmasin.
let reindexRunning = false;

const reindexSchema = z.object({
  tables: z.array(z.enum(SOURCE_NAMES as [string, ...string[]])).optional(),
  full: z.boolean().optional().default(false),
});

const searchSchema = z.object({
  query: z.string().trim().min(2).max(500),
  limit: z.number().int().min(1).max(20).optional().default(6),
});

const askSchema = z.object({
  session_key: z.string().uuid().optional().nullable(),
  message: z.string().trim().min(2).max(500),
  lang: z.enum(SUPPORTED_LANGS).optional(),
});

// ===== POST /api/chatbot/ask  (public, rate-limited) =====
router.post('/ask', askLimiter, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = askSchema.parse(req.body);
    const result = await ask({
      sessionKey: body.session_key ?? null,
      message: body.message,
      lang: normalizeLang(body.lang),
      ip: req.ip,
    });
    res.json({ success: true, data: result });
  } catch (err) { next(err); }
});

// ===== POST /api/chatbot/reindex  (super_admin) =====
router.post('/reindex', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  if (reindexRunning) {
    return next(new AppError('Indekslash allaqachon ketmoqda. Tugashini kuting', 409));
  }
  reindexRunning = true;
  try {
    const body = reindexSchema.parse(req.body ?? {});
    await assertBudget();
    const result = await reindex({ tables: body.tables, full: body.full });
    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  } finally {
    reindexRunning = false;
  }
});

// ===== POST /api/chatbot/search  (super_admin — qidiruv sifatini tekshirish) =====
router.post('/search', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = searchSchema.parse(req.body);
    await assertBudget();
    const results = await search(body.query, { limit: body.limit });

    res.json({
      success: true,
      data: {
        query: body.query,
        grounded: hasGrounding(results),
        min_similarity: MIN_SIMILARITY,
        results: results.map(r => ({
          source_table: r.source_table,
          source_id: r.source_id,
          title: r.title,
          url_path: r.url_path,
          similarity: Number(r.similarity.toFixed(4)),
          fts_rank: Number(r.fts_rank.toFixed(4)),
          score: Number(r.score.toFixed(5)),
          preview: r.content.slice(0, 300),
        })),
      },
    });
  } catch (err) { next(err); }
});

// ===== GET /api/chatbot/status  (super_admin) =====
router.get('/status', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const [index, usage, spent] = await Promise.all([
      getIndexStatus(),
      getMonthlyBreakdown(),
      getMonthlySpend(),
    ]);
    res.json({
      success: true,
      data: {
        index,
        usage: {
          month_spend_usd: Number(spent.toFixed(6)),
          budget_usd: Number(process.env.AI_MONTHLY_BUDGET_USD) || null,
          by_feature: usage,
        },
      },
    });
  } catch (err) { next(err); }
});

export default router;
