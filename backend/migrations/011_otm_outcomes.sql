-- ============================================
-- Shomanay 14-Maktab — Migration 011
-- OTM tavsiya mexanizmi: haqiqiy natijalar va kalibratsiya
-- ============================================

CREATE TABLE IF NOT EXISTS otm_outcome_reports (
  id                    SERIAL PRIMARY KEY,
  student_name          VARCHAR(200) NOT NULL,
  class_name            VARCHAR(20),
  graduation_year       SMALLINT NOT NULL,
  major_id              INTEGER REFERENCES otm_majors(id) ON DELETE SET NULL,
  internal_weighted_pct NUMERIC(5,2) NOT NULL,
  real_dtm_score        NUMERIC(6,2) NOT NULL,
  real_dtm_max_score    NUMERIC(6,2) NOT NULL DEFAULT 189.9,
  was_admitted          BOOLEAN,
  notes                 TEXT,
  created_by            INTEGER REFERENCES users(id) ON DELETE SET NULL,
  created_at            TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS otm_calibration (
  id            SERIAL PRIMARY KEY,
  slope         NUMERIC(8,4) NOT NULL,
  intercept     NUMERIC(8,4) NOT NULL,
  sample_size   INTEGER NOT NULL,
  computed_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_otm_outcome_reports_major ON otm_outcome_reports (major_id);
CREATE INDEX IF NOT EXISTS idx_otm_calibration_computed ON otm_calibration (computed_at DESC);
