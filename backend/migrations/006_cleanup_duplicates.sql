-- Migration 006: Fanlar va rahbariyat dublikatlarini tozalash va cheklov qo'shish

-- 1. teacher_subjects dagi dublikatlarni o'chirish (remap qilishda UNIQUE cheklovi buzilmasligi uchun)
DELETE FROM teacher_subjects ts1
WHERE ts1.id > (
  SELECT MIN(ts2.id)
  FROM teacher_subjects ts2
  JOIN subjects s1 ON s1.id = ts1.subject_id
  JOIN subjects s2 ON s2.id = ts2.subject_id
  WHERE ts1.teacher_id = ts2.teacher_id AND s1.name = s2.name
);

-- 2. Boshqa jadvallardagi fan ID larini eng birinchi yaratilgan fan ID siga yo'naltirish (remap)
UPDATE teacher_subjects ts
SET subject_id = (SELECT MIN(s.id) FROM subjects s WHERE s.name = (SELECT name FROM subjects WHERE id = ts.subject_id))
WHERE ts.subject_id NOT IN (SELECT MIN(id) FROM subjects GROUP BY name);

UPDATE questions q
SET subject_id = (SELECT MIN(s.id) FROM subjects s WHERE s.name = (SELECT name FROM subjects WHERE id = q.subject_id))
WHERE q.subject_id NOT IN (SELECT MIN(id) FROM subjects GROUP BY name);

UPDATE test_sessions ts
SET subject_id = (SELECT MIN(s.id) FROM subjects s WHERE s.name = (SELECT name FROM subjects WHERE id = ts.subject_id))
WHERE ts.subject_id NOT IN (SELECT MIN(id) FROM subjects GROUP BY name);

UPDATE control_works cw
SET subject_id = (SELECT MIN(s.id) FROM subjects s WHERE s.name = (SELECT name FROM subjects WHERE id = cw.subject_id))
WHERE cw.subject_id NOT IN (SELECT MIN(id) FROM subjects GROUP BY name);

UPDATE achievements a
SET subject_id = (SELECT MIN(s.id) FROM subjects s WHERE s.name = (SELECT name FROM subjects WHERE id = a.subject_id))
WHERE a.subject_id NOT IN (SELECT MIN(id) FROM subjects GROUP BY name);

UPDATE schedule s
SET subject_id = (SELECT MIN(sub.id) FROM subjects sub WHERE sub.name = (SELECT name FROM subjects WHERE id = s.subject_id))
WHERE s.subject_id NOT IN (SELECT MIN(id) FROM subjects GROUP BY name);

-- 3. Endi dublikat fanlarni havotirsiz o'chirish mumkin
DELETE FROM subjects WHERE id NOT IN (SELECT MIN(id) FROM subjects GROUP BY name);

-- 4. Kelajakda takrorlanmasligi uchun subjects(name) ustuniga UNIQUE cheklovini qo'shamiz
ALTER TABLE subjects DROP CONSTRAINT IF EXISTS unique_subject_name;
ALTER TABLE subjects ADD CONSTRAINT unique_subject_name UNIQUE (name);

-- 5. Rahbariyat (management) jadvalidagi dublikatlarni o'chirish
DELETE FROM management a USING management b WHERE a.id > b.id AND a.full_name = b.full_name AND a.position = b.position;
