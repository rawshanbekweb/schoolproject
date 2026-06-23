-- ============================================
-- Shomanay 14-Maktab — Database Migration
-- ============================================

-- 1. FOYDALANUVCHILAR (3 rol)
CREATE TABLE IF NOT EXISTS users (
  id            SERIAL PRIMARY KEY,
  login         VARCHAR(100) UNIQUE NOT NULL,
  password_hash TEXT NOT NULL,
  full_name     VARCHAR(200) NOT NULL,
  role          VARCHAR(20) NOT NULL CHECK (role IN ('super_admin', 'content_manager', 'teacher')),
  photo_url     TEXT,
  phone         VARCHAR(20),
  is_active     BOOLEAN DEFAULT true,
  created_at    TIMESTAMPTZ DEFAULT NOW(),
  updated_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 2. FANLAR
CREATE TABLE IF NOT EXISTS subjects (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(150) NOT NULL,
  short_name VARCHAR(20),
  icon       VARCHAR(50),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. O'QITUVCHI ↔ FAN
CREATE TABLE IF NOT EXISTS teacher_subjects (
  id         SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id) ON DELETE CASCADE,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  UNIQUE(teacher_id, subject_id)
);

-- 4. SINFLAR
CREATE TABLE IF NOT EXISTS classes (
  id            SERIAL PRIMARY KEY,
  name          VARCHAR(20) NOT NULL,
  grade         SMALLINT NOT NULL CHECK (grade BETWEEN 1 AND 11),
  letter        CHAR(2) NOT NULL,
  shift         SMALLINT DEFAULT 1 CHECK (shift IN (1, 2)),
  student_count SMALLINT DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT NOW()
);

-- 5. TEST SAVOLLARI
CREATE TABLE IF NOT EXISTS questions (
  id          SERIAL PRIMARY KEY,
  teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject_id  INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  grade_level SMALLINT CHECK (grade_level BETWEEN 1 AND 11),
  text        TEXT NOT NULL,
  option_a    TEXT NOT NULL,
  option_b    TEXT NOT NULL,
  option_c    TEXT NOT NULL,
  option_d    TEXT NOT NULL,
  correct     CHAR(1) NOT NULL CHECK (correct IN ('A','B','C','D')),
  difficulty  SMALLINT DEFAULT 1 CHECK (difficulty IN (1,2,3)),
  is_active   BOOLEAN DEFAULT true,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 6. TEST NATIJALARI
CREATE TABLE IF NOT EXISTS test_sessions (
  id           SERIAL PRIMARY KEY,
  student_name VARCHAR(200) NOT NULL,
  class_name   VARCHAR(20),
  subject_id   INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  grade_level  SMALLINT,
  total_q      SMALLINT NOT NULL,
  correct_q    SMALLINT NOT NULL,
  score        NUMERIC(5,2),
  time_spent   INTEGER,
  started_at   TIMESTAMPTZ DEFAULT NOW(),
  finished_at  TIMESTAMPTZ
);

-- 7. NAZORAT ISHLARI
CREATE TABLE IF NOT EXISTS control_works (
  id         SERIAL PRIMARY KEY,
  teacher_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject_id INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  class_id   INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  quarter    SMALLINT NOT NULL CHECK (quarter IN (1,2,3,4)),
  year       SMALLINT NOT NULL,
  work_date  DATE,
  title      VARCHAR(200),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. NAZORAT ISHI BALLARI
CREATE TABLE IF NOT EXISTS control_work_scores (
  id              SERIAL PRIMARY KEY,
  control_work_id INTEGER REFERENCES control_works(id) ON DELETE CASCADE,
  student_name    VARCHAR(200) NOT NULL,
  score           NUMERIC(4,1) NOT NULL CHECK (score BETWEEN 0 AND 5),
  created_at      TIMESTAMPTZ DEFAULT NOW()
);

-- 9. YANGILIKLAR
CREATE TABLE IF NOT EXISTS news (
  id           SERIAL PRIMARY KEY,
  author_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title        VARCHAR(300) NOT NULL,
  slug         VARCHAR(350) UNIQUE NOT NULL,
  content      TEXT NOT NULL,
  cover_url    TEXT,
  category     VARCHAR(20) DEFAULT 'news' CHECK (category IN ('news','event','announcement')),
  is_published BOOLEAN DEFAULT false,
  published_at TIMESTAMPTZ,
  views        INTEGER DEFAULT 0,
  created_at   TIMESTAMPTZ DEFAULT NOW(),
  updated_at   TIMESTAMPTZ DEFAULT NOW()
);

-- 10. YUTUQLAR / MAKTAB FAXRLARI
CREATE TABLE IF NOT EXISTS achievements (
  id          SERIAL PRIMARY KEY,
  person_name VARCHAR(200) NOT NULL,
  person_type VARCHAR(20) CHECK (person_type IN ('student','teacher')),
  class_name  VARCHAR(20),
  subject_id  INTEGER REFERENCES subjects(id) ON DELETE SET NULL,
  title       VARCHAR(300) NOT NULL,
  description TEXT,
  photo_url   TEXT,
  award_date  DATE,
  level       VARCHAR(50),
  is_featured BOOLEAN DEFAULT false,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- 11. DARS VAQTLARI (smena bo'yicha)
CREATE TABLE IF NOT EXISTS lesson_times (
  id         SERIAL PRIMARY KEY,
  shift      SMALLINT NOT NULL CHECK (shift IN (1, 2)),
  lesson_num SMALLINT NOT NULL,
  start_time TIME NOT NULL,
  end_time   TIME NOT NULL,
  UNIQUE(shift, lesson_num)
);

-- 12. DARS JADVALI
CREATE TABLE IF NOT EXISTS schedule (
  id          SERIAL PRIMARY KEY,
  class_id    INTEGER REFERENCES classes(id) ON DELETE CASCADE,
  subject_id  INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  teacher_id  INTEGER REFERENCES users(id) ON DELETE SET NULL,
  day_of_week SMALLINT NOT NULL CHECK (day_of_week BETWEEN 1 AND 6),
  lesson_num  SMALLINT NOT NULL CHECK (lesson_num BETWEEN 1 AND 8),
  shift       SMALLINT DEFAULT 1 CHECK (shift IN (1, 2)),
  room        VARCHAR(20)
);

-- 13. MEDIA / GALEREYA
CREATE TABLE IF NOT EXISTS media (
  id          SERIAL PRIMARY KEY,
  uploader_id INTEGER REFERENCES users(id) ON DELETE SET NULL,
  url         TEXT NOT NULL,
  thumb_url   TEXT,
  file_type   VARCHAR(20) CHECK (file_type IN ('image','video','document')),
  file_size   INTEGER,
  alt_text    VARCHAR(300),
  album       VARCHAR(100),
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================
-- INDEXES
-- ============================================
CREATE INDEX IF NOT EXISTS idx_news_slug ON news(slug);
CREATE INDEX IF NOT EXISTS idx_news_published ON news(is_published, published_at DESC);
CREATE INDEX IF NOT EXISTS idx_questions_subject ON questions(subject_id, is_active);
CREATE INDEX IF NOT EXISTS idx_control_works_class ON control_works(class_id, quarter, year);
CREATE INDEX IF NOT EXISTS idx_test_sessions_subject ON test_sessions(subject_id);
CREATE INDEX IF NOT EXISTS idx_schedule_class_day ON schedule(class_id, day_of_week);

-- ============================================
-- SEED: Dars vaqtlari
-- ============================================
INSERT INTO lesson_times (shift, lesson_num, start_time, end_time) VALUES
(1, 1, '08:00', '08:45'),
(1, 2, '08:50', '09:35'),
(1, 3, '09:45', '10:30'),
(1, 4, '10:45', '11:30'),
(1, 5, '11:35', '12:20'),
(1, 6, '12:25', '13:10'),
(2, 1, '13:30', '14:15'),
(2, 2, '14:20', '15:05'),
(2, 3, '15:15', '16:00'),
(2, 4, '16:05', '16:50'),
(2, 5, '16:55', '17:40'),
(2, 6, '17:45', '18:30')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Asosiy fanlar
-- ============================================
INSERT INTO subjects (name, short_name, icon) VALUES
('Matematika', 'Mat', '➕'),
('O''zbek tili va adabiyoti', 'O''zbek', '📖'),
('Ingliz tili', 'Ingliz', '🌐'),
('Rus tili', 'Rus', '🇷🇺'),
('Fizika', 'Fiz', '⚛️'),
('Kimyo', 'Kim', '🧪'),
('Biologiya', 'Bio', '🌿'),
('Tarix', 'Tar', '🏛️'),
('Geografiya', 'Geo', '🗺️'),
('Informatika', 'Info', '💻'),
('Jismoniy tarbiya', 'JT', '⚽'),
('Musiqa', 'Mus', '🎵'),
('Tasviriy san''at', 'TS', '🎨'),
('Texnologiya', 'Tex', '🔧'),
('Ona tili (QQ)', 'QQ', '📝')
ON CONFLICT DO NOTHING;

-- ============================================
-- SEED: Super admin
-- Login/parol endi migratsiyada qattiq yozilmaydi — backend ishga
-- tushganda backend/src/utils/seedSuperAdmin.ts orqali .env dagi
-- SUPERADMIN_LOGIN / SUPERADMIN_PASSWORD asosida avtomatik yaratiladi.
-- ============================================
