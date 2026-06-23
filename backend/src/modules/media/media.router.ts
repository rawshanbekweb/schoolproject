import { Router, Request, Response, NextFunction } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const adminOrContent = [authenticate, authorize('super_admin', 'content_manager')];

// Uploads papkasi
const uploadDir = path.resolve(process.env.UPLOAD_DIR || './uploads');
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${Math.random().toString(36).slice(2, 8)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: Number(process.env.MAX_FILE_SIZE) || 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
    if (!allowed.includes(file.mimetype)) {
      return cb(new Error('Faqat rasm fayllar (JPEG, PNG, WebP, GIF)'));
    }
    cb(null, true);
  },
});

// POST /api/media/upload
router.post(
  '/upload',
  ...adminOrContent,
  (req: Request, res: Response, next: NextFunction) => {
    upload.single('file')(req, res, (err) => {
      if (err instanceof multer.MulterError) {
        return next(new AppError(`Yuklash xatosi: ${err.message}`, 400));
      }
      if (err) return next(new AppError(err.message, 400));
      next();
    });
  },
  async (req: Request, res: Response, next: NextFunction) => {
    try {
      if (!req.file) throw new AppError('Fayl topilmadi', 400);

      const host = req.get('host') ?? 'localhost:3000';
      const protocol = req.get('x-forwarded-proto') ?? req.protocol ?? 'http';
      const fileUrl = `${protocol}://${host}/uploads/${req.file.filename}`;

      await pool.query(
        `INSERT INTO media (uploader_id, url, file_type, file_size, alt_text)
         VALUES ($1,$2,'image',$3,$4)`,
        [req.user!.userId, fileUrl, req.file.size, req.file.originalname]
      );

      res.json({
        success: true,
        data: { url: fileUrl, filename: req.file.filename, size: req.file.size },
      });
    } catch (err) {
      next(err);
    }
  }
);

// GET /api/media (public - galereya uchun)
router.get('/', async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*, u.full_name AS uploader_name
       FROM media m LEFT JOIN users u ON u.id = m.uploader_id
       WHERE m.file_type = 'image'
       ORDER BY m.created_at DESC LIMIT 60`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// DELETE /api/media/:id
router.delete('/:id', ...adminOrContent, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('SELECT * FROM media WHERE id = $1', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Fayl topilmadi', 404);

    const filename = path.basename(rows[0].url);
    const filePath = path.join(uploadDir, filename);
    if (filePath.startsWith(uploadDir) && fs.existsSync(filePath)) fs.unlinkSync(filePath);

    await pool.query('DELETE FROM media WHERE id = $1', [Number(req.params.id)]);
    res.json({ success: true });
  } catch (err) { next(err); }
});

export default router;
