-- ============================================
-- Migration 003: Fayl asosidagi test tizimi
-- ============================================

-- test_configs ga fayl va javob kaliti ustunlari
ALTER TABLE test_configs ADD COLUMN IF NOT EXISTS file_url   TEXT;
ALTER TABLE test_configs ADD COLUMN IF NOT EXISTS file_type  VARCHAR(10);
ALTER TABLE test_configs ADD COLUMN IF NOT EXISTS answer_key JSONB;
