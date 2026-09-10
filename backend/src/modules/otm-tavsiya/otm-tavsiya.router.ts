import { Router, Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { pool } from '../../config/db';
import { authenticate, authorize } from '../../middleware/auth';
import { AppError } from '../../middleware/errorHandler';

const router = Router();
const adminOnly = [authenticate, authorize('super_admin')];

const MIN_CALIBRATION_SAMPLE = 8;

const DISCLAIMER =
  "Bu — o'quvchining test natijasi bilan yo'nalishning so'nggi yillardagi o'tish balli asosida " +
  "hisoblangan taxminiy moslik ko'rsatkichi. Rasmiy DTM balliga tenglashtirilmagan va kirishni kafolatlamaydi.";

const majorSchema = z.object({
  university_name: z.string().trim().min(1),
  major_name: z.string().trim().min(1),
});

const subjectLinkSchema = z.object({
  subject_id: z.number().int().positive(),
  weight: z.number().positive().max(10).optional(),
});

const cutoffSchema = z.object({
  year: z.number().int().min(2000).max(2100),
  cutoff_score: z.number().min(0),
  max_possible_score: z.number().positive().optional(),
});

const outcomeSchema = z.object({
  student_name: z.string().trim().min(1),
  class_name: z.string().trim().optional().nullable(),
  graduation_year: z.number().int().min(2000).max(2100),
  major_id: z.number().int().positive(),
  internal_weighted_pct: z.number().min(0).max(100),
  real_dtm_score: z.number().min(0),
  real_dtm_max_score: z.number().positive().optional(),
  was_admitted: z.boolean().optional().nullable(),
  notes: z.string().trim().optional().nullable(),
});

// ===== GET /api/otm-tavsiya/majors  (adminOnly — boshqaruv ro'yxati) =====
router.get('/majors', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT m.*,
        COALESCE((SELECT json_agg(json_build_object(
            'id', ms.id, 'subject_id', ms.subject_id, 'subject_name', s.name, 'weight', ms.weight
          )) FROM otm_major_subjects ms LEFT JOIN subjects s ON s.id = ms.subject_id
          WHERE ms.major_id = m.id), '[]') AS subjects,
        COALESCE((SELECT json_agg(json_build_object(
            'id', mc.id, 'year', mc.year, 'cutoff_score', mc.cutoff_score, 'max_possible_score', mc.max_possible_score
          ) ORDER BY mc.year DESC) FROM otm_major_cutoffs mc WHERE mc.major_id = m.id), '[]') AS cutoffs
       FROM otm_majors m
       ORDER BY m.university_name, m.major_name`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ===== POST /api/otm-tavsiya/majors  (adminOnly) =====
router.post('/majors', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = majorSchema.parse(req.body);
    const { rows } = await pool.query(
      `INSERT INTO otm_majors (university_name, major_name) VALUES ($1,$2) RETURNING *`,
      [body.university_name, body.major_name]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== PUT /api/otm-tavsiya/majors/:id  (adminOnly) =====
router.put('/majors/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = majorSchema.partial().extend({ is_active: z.boolean().optional() }).parse(req.body);
    const { rows: existing } = await pool.query('SELECT * FROM otm_majors WHERE id = $1', [Number(req.params.id)]);
    if (!existing[0]) throw new AppError('Yo\'nalish topilmadi', 404);

    const { rows } = await pool.query(
      `UPDATE otm_majors SET university_name=$1, major_name=$2, is_active=$3 WHERE id=$4 RETURNING *`,
      [
        body.university_name ?? existing[0].university_name,
        body.major_name ?? existing[0].major_name,
        body.is_active ?? existing[0].is_active,
        Number(req.params.id),
      ]
    );
    res.json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== DELETE /api/otm-tavsiya/majors/:id  (adminOnly) =====
router.delete('/majors/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('DELETE FROM otm_majors WHERE id=$1 RETURNING id', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Yo\'nalish topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ===== POST /api/otm-tavsiya/majors/:id/subjects  (adminOnly) =====
router.post('/majors/:id/subjects', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = subjectLinkSchema.parse(req.body);
    const majorId = Number(req.params.id);
    const { rows: major } = await pool.query('SELECT id FROM otm_majors WHERE id = $1', [majorId]);
    if (!major[0]) throw new AppError('Yo\'nalish topilmadi', 404);

    const { rows } = await pool.query(
      `INSERT INTO otm_major_subjects (major_id, subject_id, weight) VALUES ($1,$2,$3)
       ON CONFLICT (major_id, subject_id) DO UPDATE SET weight = EXCLUDED.weight
       RETURNING *`,
      [majorId, body.subject_id, body.weight ?? 1.0]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== DELETE /api/otm-tavsiya/majors/:id/subjects/:subjectId  (adminOnly) =====
router.delete('/majors/:id/subjects/:subjectId', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `DELETE FROM otm_major_subjects WHERE major_id=$1 AND subject_id=$2 RETURNING id`,
      [Number(req.params.id), Number(req.params.subjectId)]
    );
    if (!rows[0]) throw new AppError('Bog\'lanish topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ===== POST /api/otm-tavsiya/majors/:id/cutoffs  (adminOnly) =====
router.post('/majors/:id/cutoffs', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = cutoffSchema.parse(req.body);
    const majorId = Number(req.params.id);
    const { rows: major } = await pool.query('SELECT id FROM otm_majors WHERE id = $1', [majorId]);
    if (!major[0]) throw new AppError('Yo\'nalish topilmadi', 404);

    const { rows } = await pool.query(
      `INSERT INTO otm_major_cutoffs (major_id, year, cutoff_score, max_possible_score)
       VALUES ($1,$2,$3,$4)
       ON CONFLICT (major_id, year) DO UPDATE SET cutoff_score = EXCLUDED.cutoff_score,
         max_possible_score = EXCLUDED.max_possible_score
       RETURNING *`,
      [majorId, body.year, body.cutoff_score, body.max_possible_score ?? 189.9]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== DELETE /api/otm-tavsiya/cutoffs/:id  (adminOnly) =====
router.delete('/cutoffs/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('DELETE FROM otm_major_cutoffs WHERE id=$1 RETURNING id', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Ball ma\'lumoti topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ===== GET /api/otm-tavsiya/outcomes  (adminOnly) =====
router.get('/outcomes', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT o.*, m.university_name, m.major_name
       FROM otm_outcome_reports o LEFT JOIN otm_majors m ON m.id = o.major_id
       ORDER BY o.created_at DESC`
    );
    res.json({ success: true, data: rows });
  } catch (err) { next(err); }
});

// ===== POST /api/otm-tavsiya/outcomes  (adminOnly) =====
router.post('/outcomes', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = outcomeSchema.parse(req.body);
    const { rows: major } = await pool.query('SELECT id FROM otm_majors WHERE id = $1', [body.major_id]);
    if (!major[0]) throw new AppError('Yo\'nalish topilmadi', 404);

    const { rows } = await pool.query(
      `INSERT INTO otm_outcome_reports
         (student_name, class_name, graduation_year, major_id, internal_weighted_pct,
          real_dtm_score, real_dtm_max_score, was_admitted, notes, created_by)
       VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9,$10) RETURNING *`,
      [
        body.student_name, body.class_name || null, body.graduation_year, body.major_id,
        body.internal_weighted_pct, body.real_dtm_score, body.real_dtm_max_score ?? 189.9,
        body.was_admitted ?? null, body.notes || null, req.user!.userId,
      ]
    );
    res.status(201).json({ success: true, data: rows[0] });
  } catch (err) { next(err); }
});

// ===== DELETE /api/otm-tavsiya/outcomes/:id  (adminOnly) =====
router.delete('/outcomes/:id', ...adminOnly, async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query('DELETE FROM otm_outcome_reports WHERE id=$1 RETURNING id', [Number(req.params.id)]);
    if (!rows[0]) throw new AppError('Hisobot topilmadi', 404);
    res.json({ success: true });
  } catch (err) { next(err); }
});

// ===== GET /api/otm-tavsiya/calibration  (adminOnly) =====
router.get('/calibration', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows: calibration } = await pool.query(
      `SELECT * FROM otm_calibration ORDER BY computed_at DESC LIMIT 1`
    );
    const { rows: count } = await pool.query(`SELECT COUNT(*)::int AS n FROM otm_outcome_reports`);
    res.json({
      success: true,
      data: { calibration: calibration[0] ?? null, outcome_count: count[0].n, min_required: MIN_CALIBRATION_SAMPLE },
    });
  } catch (err) { next(err); }
});

// ===== POST /api/otm-tavsiya/recalibrate  (adminOnly) =====
router.post('/recalibrate', ...adminOnly, async (_req: Request, res: Response, next: NextFunction) => {
  try {
    const { rows } = await pool.query(
      `SELECT regr_slope(real_pct, internal_weighted_pct) AS slope,
              regr_intercept(real_pct, internal_weighted_pct) AS intercept,
              COUNT(*)::int AS n
       FROM (
         SELECT internal_weighted_pct, (real_dtm_score / real_dtm_max_score * 100) AS real_pct
         FROM otm_outcome_reports
       ) t`
    );
    const { slope, intercept, n } = rows[0];
    if (n < MIN_CALIBRATION_SAMPLE) {
      throw new AppError(`Kalibratsiya uchun kamida ${MIN_CALIBRATION_SAMPLE} ta natija kerak (hozir: ${n})`, 400);
    }

    const { rows: saved } = await pool.query(
      `INSERT INTO otm_calibration (slope, intercept, sample_size) VALUES ($1,$2,$3) RETURNING *`,
      [slope, intercept, n]
    );
    res.status(201).json({ success: true, data: saved[0] });
  } catch (err) { next(err); }
});

type SectionResult = { subject_id: number; correct_q: number; total_q: number };

// ===== GET /api/otm-tavsiya/session/:sessionId  (public) =====
router.get('/session/:sessionId', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const sessionId = Number(req.params.sessionId);
    const { rows: sessionRows } = await pool.query(
      `SELECT id, status, section_results FROM block_test_sessions WHERE id = $1`,
      [sessionId]
    );
    if (!sessionRows[0]) throw new AppError('Sessiya topilmadi', 404);
    const session = sessionRows[0];
    if (session.status !== 'finished') throw new AppError('Test hali yakunlanmagan', 409);

    const results: SectionResult[] = session.section_results || [];
    const pctBySubject = new Map<number, number>();
    for (const r of results) {
      if (r.total_q > 0) pctBySubject.set(r.subject_id, (r.correct_q / r.total_q) * 100);
    }

    const { rows: calibrationRows } = await pool.query(
      `SELECT slope, intercept, sample_size FROM otm_calibration ORDER BY computed_at DESC LIMIT 1`
    );
    const calibration = calibrationRows[0] && calibrationRows[0].sample_size >= MIN_CALIBRATION_SAMPLE
      ? calibrationRows[0]
      : null;

    const { rows: majors } = await pool.query(
      `SELECT m.id, m.university_name, m.major_name,
        COALESCE((SELECT json_agg(json_build_object('subject_id', ms.subject_id, 'weight', ms.weight))
          FROM otm_major_subjects ms WHERE ms.major_id = m.id), '[]') AS subjects,
        COALESCE((SELECT json_agg(json_build_object('year', mc.year, 'cutoff_score', mc.cutoff_score,
            'max_possible_score', mc.max_possible_score))
          FROM otm_major_cutoffs mc WHERE mc.major_id = m.id), '[]') AS cutoffs
       FROM otm_majors m WHERE m.is_active = true`
    );

    const recommendations = majors
      .map((major: any) => {
        const requiredSubjects: { subject_id: number; weight: number }[] = major.subjects;
        if (requiredSubjects.length === 0) return null;

        const hasAllSubjects = requiredSubjects.every((rs) => pctBySubject.has(rs.subject_id));
        if (!hasAllSubjects) return null;

        const weightSum = requiredSubjects.reduce((sum, rs) => sum + Number(rs.weight), 0);
        const weightedPct =
          requiredSubjects.reduce((sum, rs) => sum + pctBySubject.get(rs.subject_id)! * Number(rs.weight), 0) /
          weightSum;

        const cutoffs: { year: number; cutoff_score: number; max_possible_score: number }[] = major.cutoffs;
        if (cutoffs.length === 0) return null;
        const avgCutoffPct =
          cutoffs.reduce((sum, c) => sum + (Number(c.cutoff_score) / Number(c.max_possible_score)) * 100, 0) /
          cutoffs.length;

        const comparedPct = calibration
          ? Math.min(100, Math.max(0, Number(calibration.slope) * weightedPct + Number(calibration.intercept)))
          : weightedPct;

        const diff = comparedPct - avgCutoffPct;
        const category = diff >= 5 ? 'yuqori_ehtimol' : diff >= -5 ? 'chegara_oldi' : 'past_ehtimol';

        return {
          major_id: major.id,
          university_name: major.university_name,
          major_name: major.major_name,
          weighted_pct: Math.round(weightedPct * 10) / 10,
          avg_cutoff_pct: Math.round(avgCutoffPct * 10) / 10,
          diff: Math.round(diff * 10) / 10,
          category,
          calibrated: !!calibration,
          calibration_sample_size: calibration ? calibration.sample_size : 0,
        };
      })
      .filter((r): r is NonNullable<typeof r> => r !== null)
      .sort((a, b) => b.diff - a.diff);

    res.json({ success: true, data: { recommendations, disclaimer: DISCLAIMER } });
  } catch (err) { next(err); }
});

export default router;
