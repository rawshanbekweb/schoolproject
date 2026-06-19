// ===== ROL TIZIMI =====
export type UserRole = 'super_admin' | 'content_manager' | 'teacher';

export interface User {
  id: number;
  login: string;
  password_hash: string;
  full_name: string;
  role: UserRole;
  photo_url: string | null;
  phone: string | null;
  is_active: boolean;
  created_at: Date;
  updated_at: Date;
}

export interface UserPublic extends Omit<User, 'password_hash'> {}

// ===== JWT PAYLOAD =====
export interface JwtPayload {
  userId: number;
  role: UserRole;
}

// ===== FANLAR =====
export interface Subject {
  id: number;
  name: string;
  short_name: string | null;
  icon: string | null;
  created_at: Date;
}

// ===== SINFLAR =====
export interface Class {
  id: number;
  name: string;
  grade: number;
  letter: string;
  shift: 1 | 2;
  student_count: number;
  created_at: Date;
}

// ===== SAVOLLAR =====
export type Difficulty = 1 | 2 | 3;
export type CorrectOption = 'A' | 'B' | 'C' | 'D';

export interface Question {
  id: number;
  teacher_id: number | null;
  subject_id: number;
  grade_level: number | null;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  correct: CorrectOption;
  difficulty: Difficulty;
  is_active: boolean;
  created_at: Date;
}

// ===== TEST SESSION =====
export interface TestSession {
  id: number;
  student_name: string;
  class_name: string | null;
  subject_id: number | null;
  grade_level: number | null;
  total_q: number;
  correct_q: number;
  score: number;
  time_spent: number | null;
  started_at: Date;
  finished_at: Date | null;
}

// ===== NAZORAT ISHLARI =====
export interface ControlWork {
  id: number;
  teacher_id: number;
  subject_id: number;
  class_id: number;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  work_date: Date | null;
  title: string | null;
  created_at: Date;
}

export interface ControlWorkScore {
  id: number;
  control_work_id: number;
  student_name: string;
  score: number;
  created_at: Date;
}

// ===== YANGILIKLAR =====
export type NewsCategory = 'news' | 'event' | 'announcement';

export interface News {
  id: number;
  author_id: number | null;
  title: string;
  slug: string;
  content: string;
  cover_url: string | null;
  category: NewsCategory;
  is_published: boolean;
  published_at: Date | null;
  views: number;
  created_at: Date;
  updated_at: Date;
}

// ===== YUTUQLAR =====
export type PersonType = 'student' | 'teacher';

export interface Achievement {
  id: number;
  person_name: string;
  person_type: PersonType;
  class_name: string | null;
  subject_id: number | null;
  title: string;
  description: string | null;
  photo_url: string | null;
  award_date: Date | null;
  level: string | null;
  is_featured: boolean;
  created_at: Date;
}

// ===== JADVAL =====
export interface Schedule {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number | null;
  day_of_week: number;
  lesson_num: number;
  shift: 1 | 2;
  room: string | null;
}

export interface LessonTime {
  id: number;
  shift: 1 | 2;
  lesson_num: number;
  start_time: string;
  end_time: string;
}

// ===== MEDIA =====
export type FileType = 'image' | 'video' | 'document';

export interface Media {
  id: number;
  uploader_id: number | null;
  url: string;
  thumb_url: string | null;
  file_type: FileType;
  file_size: number | null;
  alt_text: string | null;
  album: string | null;
  created_at: Date;
}

// ===== ANALYTICS =====
export interface TeacherRating {
  teacher_id: number;
  full_name: string;
  photo_url: string | null;
  avg_score: number;
  questions_count: number;
  rating: number;
  subjects: string[];
}

export interface ClassAverage {
  class_id: number;
  class_name: string;
  subject_name: string;
  quarter: number;
  avg_score: number;
}
