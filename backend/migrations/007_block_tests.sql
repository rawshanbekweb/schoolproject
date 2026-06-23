-- Migration 007: Blok testlar (DTM uslubidagi ko'p fanli test)

CREATE TABLE IF NOT EXISTS block_tests (
  id             SERIAL PRIMARY KEY,
  teacher_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title          VARCHAR(300) NOT NULL,
  description    TEXT,
  grade_level    SMALLINT,
  time_limit     SMALLINT DEFAULT 0,
  target_classes TEXT[] DEFAULT '{}',
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS block_test_sections (
  id                   SERIAL PRIMARY KEY,
  block_test_id        INTEGER REFERENCES block_tests(id) ON DELETE CASCADE,
  subject_id           INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  question_count       SMALLINT NOT NULL DEFAULT 5 CHECK (question_count BETWEEN 1 AND 100),
  points_per_question  NUMERIC(4,2) NOT NULL DEFAULT 1.0,
  order_index          SMALLINT NOT NULL DEFAULT 0,
  UNIQUE (block_test_id, subject_id)
);

CREATE TABLE IF NOT EXISTS block_test_sessions (
  id              SERIAL PRIMARY KEY,
  block_test_id   INTEGER REFERENCES block_tests(id) ON DELETE CASCADE,
  student_name    VARCHAR(200) NOT NULL,
  class_name      VARCHAR(20),
  question_set    JSONB NOT NULL,
  status          VARCHAR(20) DEFAULT 'in_progress' CHECK (status IN ('in_progress','finished')),
  total_score     NUMERIC(6,2),
  max_score       NUMERIC(6,2),
  section_results JSONB,
  time_spent      INTEGER,
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  finished_at     TIMESTAMPTZ
);
