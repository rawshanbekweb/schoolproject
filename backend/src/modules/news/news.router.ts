import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';
import { uniqueSlug } from '../../utils/slugify';

const router = Router();

const adminOrContent = [authenticate, authorize('super_admin', 'content_manager')];

const newsSchema = z.object({
  title: z.string().min(3).max(300),
  content: z.string().min(10),
  cover_url: z.union([z.string().url(), z.literal(''), z.undefined()]),
  category: z.enum(['news', 'event', 'announcement']).default('news'),
  is_published: z.boolean().default(false),
});

// GET /api/news (public)
router.get('/', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const page = Math.max(1, Number(req.query.page) || 1);
    const limit = Math.min(20, Number(req.query.limit) || 10);
    const offset = (page - 1) * limit;
    const category = req.query.category as string | undefined;

    const where = category
      ? `WHERE n.is_published = true AND n.category = $3`
      : `WHERE n.is_published = true`;

    const params: any[] = [limit, offset];
    if (category) params.push(category);

    const { rows } = await pool.query(
      `SELECT n.id, n.title, n.slug, n.cover_url, n.category, n.views,
              n.published_at, u.full_name AS author
       FROM news n
       LEFT JOIN users u ON u.id = n.author_id
       ${where}
       ORDER BY n.published_at DESC
       LIMIT $1 OFFSET $2`,
      params
    );

    const countRes = await pool.query(
      `SELECT COUNT(*) FROM news WHERE is_published = true ${category ? 'AND category = $1' : ''}`,
      category ? [category] : []
    );

    res.json({
      success: true,
      data: rows,
      meta: { page, limit, total: Number(countRes.rows[0].count) },
    });
  } catch (err) {
    next(err);
  }
});

// GET /api/news/:slug (public)
router.get('/:slug', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT n.*, u.full_name AS author
       FROM news n
       LEFT JOIN users u ON u.id = n.author_id
       WHERE n.slug = $1 AND n.is_published = true`,
      [req.params.slug]
    );
    if (!rows[0]) throw new AppError('Yangilik topilmadi', 404);

    // Ko'rishlar sonini oshirish
    await pool.query('UPDATE news SET views = views + 1 WHERE slug = $1', [req.params.slug]);

    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// POST /api/news
router.post('/', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = newsSchema.parse(req.body);
    const slug = uniqueSlug(body.title);

    const { rows } = await pool.query(
      `INSERT INTO news (author_id, title, slug, content, cover_url, category, is_published, published_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
       RETURNING *`,
      [
        req.user!.userId,
        body.title,
        slug,
        body.content,
        body.cover_url || null,
        body.category,
        body.is_published,
        body.is_published ? new Date() : null,
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// PUT /api/news/:id
router.put('/:id', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const id = Number(req.params.id);
    const body = newsSchema.partial().parse(req.body);

    const existing = await pool.query('SELECT * FROM news WHERE id = $1', [id]);
    if (!existing.rows[0]) throw new AppError('Yangilik topilmadi', 404);

    const merged = { ...existing.rows[0], ...body };
    const publishedAt =
      body.is_published && !existing.rows[0].is_published ? new Date() : existing.rows[0].published_at;

    const { rows } = await pool.query(
      `UPDATE news SET title=$1, content=$2, cover_url=$3, category=$4,
       is_published=$5, published_at=$6, updated_at=NOW()
       WHERE id=$7 RETURNING *`,
      [merged.title, merged.content, merged.cover_url, merged.category,
       merged.is_published, publishedAt, id]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) {
    next(err);
  }
});

// DELETE /api/news/:id
router.delete('/:id', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rowCount } = await pool.query('DELETE FROM news WHERE id = $1', [Number(req.params.id)]);
    if (!rowCount) throw new AppError('Yangilik topilmadi', 404);
    res.json({ success: true, message: 'O\'chirildi' });
  } catch (err) {
    next(err);
  }
});

export default router;
