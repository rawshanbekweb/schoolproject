-- ============================================
-- Shomanay 14-Maktab — Extended Migration 002
-- ============================================

-- users jadvaliga qo'shimcha ustunlar
ALTER TABLE users ADD COLUMN IF NOT EXISTS bio TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS experience_years SMALLINT DEFAULT 0;
ALTER TABLE users ADD COLUMN IF NOT EXISTS education TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS achievements_text TEXT;
ALTER TABLE users ADD COLUMN IF NOT EXISTS is_public BOOLEAN DEFAULT false;

-- subjects jadvaliga description
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS description TEXT;
ALTER TABLE subjects ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- news jadvaliga updated_at
ALTER TABLE news ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- control_works jadvaliga updated_at
ALTER TABLE control_works ADD COLUMN IF NOT EXISTS updated_at TIMESTAMPTZ DEFAULT NOW();

-- TEST KONFIGURATSIYALARI
CREATE TABLE IF NOT EXISTS test_configs (
  id             SERIAL PRIMARY KEY,
  teacher_id     INTEGER REFERENCES users(id) ON DELETE SET NULL,
  subject_id     INTEGER REFERENCES subjects(id) ON DELETE CASCADE,
  title          VARCHAR(300) NOT NULL,
  description    TEXT,
  grade_level    SMALLINT,
  mode           VARCHAR(20) DEFAULT 'named' CHECK (mode IN ('anonymous', 'named', 'timed')),
  time_limit     SMALLINT DEFAULT 0,  -- daqiqada, 0=chegarasiz
  question_count SMALLINT DEFAULT 10,
  difficulty     SMALLINT DEFAULT 0 CHECK (difficulty BETWEEN 0 AND 3),  -- 0=aralash
  is_active      BOOLEAN DEFAULT true,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- test_sessions jadvaliga config_id
ALTER TABLE test_sessions ADD COLUMN IF NOT EXISTS config_id INTEGER REFERENCES test_configs(id) ON DELETE SET NULL;

-- MAKTAB HAQIDA MA'LUMOT (kalit-qiymat)
CREATE TABLE IF NOT EXISTS school_info (
  id         SERIAL PRIMARY KEY,
  key        VARCHAR(100) UNIQUE NOT NULL,
  title      VARCHAR(200),
  content    TEXT,
  updated_by INTEGER REFERENCES users(id) ON DELETE SET NULL,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boshlang'ich ma'lumotlar
INSERT INTO school_info (key, title, content) VALUES
  ('history',   'Maktab tarixi',   'Shomanay tumani 14-umumiy o''rta ta''lim maktabi 1985-yilda tashkil etilgan. Maktab O''zbekiston Respublikasining Qoraqalpog''iston Respublikasi Shomanay tumanida joylashgan bo''lib, yillar davomida minglab o''quvchilarga ta''lim bergan.'),
  ('mission',   'Missiyamiz',      'Har bir o''quvchini zamonaviy bilim va ko''nikmalar bilan qurollantirish, milliy qadriyatlarni asrash va yosh avlodni barkamol inson sifatida tarbiyalash.'),
  ('vision',    'Maqsadimiz',      '2030 yilga kelib viloyatdagi eng nufuzli maktabga aylanish, o''quvchilarning xalqaro olimpiadalardagi ishtirokini kengaytirish.'),
  ('address',   'Manzil',          'Qoraqalpog''iston Respublikasi, Shomanay tumani, Markaziy ko''cha, 14-maktab'),
  ('phone',     'Telefon',         '+998 61 XXX-XX-XX'),
  ('email',     'Email',           'maktab14shomanay@edu.uz'),
  ('work_hours','Ish vaqti',       'Dushanba–Shanba: 08:00–18:00'),
  ('founded',   'Tashkil etilgan', '1985-yil')
ON CONFLICT (key) DO NOTHING;

-- RAHBARIYAT
CREATE TABLE IF NOT EXISTS management (
  id         SERIAL PRIMARY KEY,
  full_name  VARCHAR(200) NOT NULL,
  position   VARCHAR(200) NOT NULL,
  photo_url  TEXT,
  phone      VARCHAR(20),
  email      VARCHAR(100),
  order_num  SMALLINT DEFAULT 0,
  is_active  BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Boshlang'ich rahbariyat
INSERT INTO management (full_name, position, order_num) VALUES
  ('Direktoring Ismi Familiyasi', 'Maktab direktori', 1),
  ('Mudir Ismi Familiyasi', "O'quv ishlari bo'yicha direktor o'rinbosari", 2),
  ('Tarbiya Mudir Ismi', "Tarbiya ishlari bo'yicha direktor o'rinbosari", 3)
ON CONFLICT DO NOTHING;

-- MUROJAAT XABARLARI
CREATE TABLE IF NOT EXISTS contact_messages (
  id          SERIAL PRIMARY KEY,
  full_name   VARCHAR(200) NOT NULL,
  phone       VARCHAR(20),
  email       VARCHAR(100),
  subject     VARCHAR(300) NOT NULL,
  message     TEXT NOT NULL,
  status      VARCHAR(20) DEFAULT 'new' CHECK (status IN ('new', 'read', 'replied')),
  replied_at  TIMESTAMPTZ,
  created_at  TIMESTAMPTZ DEFAULT NOW()
);

-- HUJJATLAR
CREATE TABLE IF NOT EXISTS documents (
  id             SERIAL PRIMARY KEY,
  uploader_id    INTEGER REFERENCES users(id) ON DELETE SET NULL,
  title          VARCHAR(300) NOT NULL,
  description    TEXT,
  file_url       TEXT NOT NULL,
  file_size      INTEGER DEFAULT 0,
  file_type      VARCHAR(20) DEFAULT 'pdf',
  category       VARCHAR(50) DEFAULT 'other' CHECK (category IN ('orders', 'regulations', 'reports', 'plans', 'other')),
  is_public      BOOLEAN DEFAULT true,
  download_count INTEGER DEFAULT 0,
  created_at     TIMESTAMPTZ DEFAULT NOW()
);

-- GALEREYA (media jadvaliga is_cover ustuni)
ALTER TABLE media ADD COLUMN IF NOT EXISTS is_cover BOOLEAN DEFAULT false;
