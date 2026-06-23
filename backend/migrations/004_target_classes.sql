-- Migration 004: Test uchun maqsad sinflar
ALTER TABLE test_configs ADD COLUMN IF NOT EXISTS target_classes TEXT[] DEFAULT '{}';
