-- ============================================
-- Shomanay 14-Maktab — Migration 009
-- RAG chatbot: suhbat sessiyalari va xabarlar tarixi
-- ============================================

CREATE TABLE IF NOT EXISTS chat_sessions (
  id             SERIAL PRIMARY KEY,
  session_key    UUID UNIQUE NOT NULL,
  lang           VARCHAR(5) DEFAULT 'uz',
  ip_hash        CHAR(64),              -- xom IP saqlanmaydi, faqat hash
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  last_active_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS chat_messages (
  id           SERIAL PRIMARY KEY,
  session_id   INTEGER REFERENCES chat_sessions(id) ON DELETE CASCADE,
  role         VARCHAR(10) NOT NULL CHECK (role IN ('user', 'assistant')),
  content      TEXT NOT NULL,
  sources      JSONB DEFAULT '[]',
  was_grounded BOOLEAN,                 -- kontekst topildimi yoki "bilmayman" javobimi
  tokens_in    INTEGER DEFAULT 0,
  tokens_out   INTEGER DEFAULT 0,
  cost_usd     NUMERIC(12,6) DEFAULT 0,
  latency_ms   INTEGER,
  created_at   TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_chat_messages_session
  ON chat_messages (session_id, created_at);

-- Chatbot javob bera olmagan savollar — maktabga saytda qaysi ma'lumot
-- yetishmayotganini ko'rsatadigan eng qimmatli signal.
CREATE INDEX IF NOT EXISTS idx_chat_messages_ungrounded
  ON chat_messages (created_at DESC) WHERE was_grounded = false;

CREATE INDEX IF NOT EXISTS idx_chat_sessions_activity
  ON chat_sessions (last_active_at);
