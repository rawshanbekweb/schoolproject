-- ============================================
-- Shomanay 14-Maktab — Migration 008
-- RAG chatbot: bilim bazasi (pgvector) va AI xarajat hisobi
-- ============================================

CREATE EXTENSION IF NOT EXISTS vector;

-- ============================================
-- BILIM BAZASI (chunk + embedding)
-- ============================================
-- Diqqat: vector(768) o'lchovi GEMINI_EMBEDDING_DIM ga mos bo'lishi shart.
-- O'lchovni o'zgartirish yangi migratsiya talab qiladi.
CREATE TABLE IF NOT EXISTS content_embeddings (
  id           SERIAL PRIMARY KEY,
  source_table VARCHAR(50)  NOT NULL,
  source_id    INTEGER      NOT NULL,
  chunk_index  SMALLINT     NOT NULL DEFAULT 0,
  title        VARCHAR(300),
  content      TEXT         NOT NULL,
  url_path     VARCHAR(300),
  content_hash CHAR(64)     NOT NULL,
  embedding    vector(768),
  tsv          tsvector GENERATED ALWAYS AS (
                 to_tsvector('simple', coalesce(title, '') || ' ' || content)
               ) STORED,
  updated_at   TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (source_table, source_id, chunk_index)
);

-- Vektor qidiruv indeksi (kosinus masofasi)
CREATE INDEX IF NOT EXISTS idx_embeddings_vec
  ON content_embeddings USING hnsw (embedding vector_cosine_ops);

-- Kalit so'z qidiruvi (gibrid qidiruvning ikkinchi yarmi)
CREATE INDEX IF NOT EXISTS idx_embeddings_tsv
  ON content_embeddings USING gin (tsv);

-- Manba bo'yicha tozalash/yangilash uchun
CREATE INDEX IF NOT EXISTS idx_embeddings_source
  ON content_embeddings (source_table, source_id);

-- ============================================
-- AI XARAJAT HISOBI (oylik, funksiya bo'yicha)
-- ============================================
CREATE TABLE IF NOT EXISTS ai_usage (
  id         SERIAL PRIMARY KEY,
  feature    VARCHAR(50) NOT NULL,   -- 'chatbot' | 'embedding' | keyinchalik boshqalar
  month      CHAR(7)     NOT NULL,   -- '2026-09'
  calls      INTEGER     DEFAULT 0,
  tokens_in  BIGINT      DEFAULT 0,
  tokens_out BIGINT      DEFAULT 0,
  cost_usd   NUMERIC(12,6) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (feature, month)
);
