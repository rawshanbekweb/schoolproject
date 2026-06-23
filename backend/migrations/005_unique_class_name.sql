-- Migration 005: Sinflar nomi takrorlanishini oldini olish
-- Avval mavjud bo'lgan dublikatlarni o'chiramiz (id si eng kichigini qoldiramiz)
DELETE FROM classes a USING classes b WHERE a.id > b.id AND a.name = b.name;

-- Keyin name ustuniga UNIQUE cheklovini qo'shamiz (avval bo'lsa o'chirib tashlaymiz idempotent bo'lishi uchun)
ALTER TABLE classes DROP CONSTRAINT IF EXISTS unique_classes_name;
ALTER TABLE classes ADD CONSTRAINT unique_classes_name UNIQUE (name);
