-- ============================================
-- Shomanay 14-Maktab — Migration 010
-- OTM tavsiya mexanizmi: yo'nalishlar, fanlar, o'tish ballari
-- ============================================

CREATE TABLE IF NOT EXISTS otm_majors (
  id               SERIAL PRIMARY KEY,
  university_name  VARCHAR(300) NOT NULL,
  major_name       VARCHAR(300) NOT NULL,
  is_active        BOOLEAN DEFAULT true,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otm_major_subjects (
  id         SERIAL PRIMARY KEY,
  major_id   INTEGER REFERENCES otm_majors(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  weight     NUMERIC(3,1) NOT NULL DEFAULT 1.0,
  UNIQUE (major_id, subject_id)
);

CREATE TABLE IF NOT EXISTS otm_major_cutoffs (
  id                 SERIAL PRIMARY KEY,
  major_id           INTEGER REFERENCES otm_majors(id) ON DELETE CASCADE,
  year               SMALLINT NOT NULL,
  cutoff_score       NUMERIC(6,2) NOT NULL,
  max_possible_score NUMERIC(6,2) NOT NULL DEFAULT 189.9,
  UNIQUE (major_id, year)
);

CREATE INDEX IF NOT EXISTS idx_otm_major_subjects_major ON otm_major_subjects (major_id);
CREATE INDEX IF NOT EXISTS idx_otm_major_cutoffs_major ON otm_major_cutoffs (major_id, year DESC);
