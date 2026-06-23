// ===== ROL TIZIMI =====
export type UserRole = 'super_admin' | 'content_manager' | 'teacher';

export interface User {
  id: number;
  login: string;
  full_name: string;
  role: UserRole;
  photo_url: string | null;
  phone: string | null;
  is_active: boolean;
  subjects?: Array<{ id: number; name: string; short_name?: string | null; icon?: string | null }>;
  created_at: string;
}

export interface AuthState {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
}

// ===== API RESPONSE =====
export interface ApiResponse<T> {
  success: boolean;
  data: T;
  message?: string;
  meta?: {
    page: number;
    limit: number;
    total: number;
  };
}

// ===== FANLAR =====
export interface Subject {
  id: number;
  name: string;
  short_name: string | null;
  icon: string | null;
}

// ===== SINFLAR =====
export interface Class {
  id: number;
  name: string;
  grade: number;
  letter: string;
  shift: 1 | 2;
  student_count: number;
}

// ===== TEST =====
export interface Question {
  id: number;
  subject_id: number;
  subject_name: string;
  grade_level: number | null;
  text: string;
  option_a: string;
  option_b: string;
  option_c: string;
  option_d: string;
  difficulty: 1 | 2 | 3;
  // correct faqat manage sahifasida keladi
  correct?: 'A' | 'B' | 'C' | 'D';
  teacher_id?: number;
  teacher_name?: string;
}

export interface TestResult {
  id: number;
  score: number;
  correct_q: number;
  total_q: number;
}

// ===== YANGILIKLAR =====
export type NewsCategory = 'news' | 'event' | 'announcement';

export interface News {
  id: number;
  title: string;
  slug: string;
  cover_url: string | null;
  category: NewsCategory;
  views: number;
  author: string | null;
  published_at: string;
  is_published?: boolean;
  content?: string;
}

// ===== YUTUQLAR =====
export interface Achievement {
  id: number;
  person_name: string;
  person_type: 'student' | 'teacher';
  class_name: string | null;
  subject_id?: number | null;
  title: string;
  description: string | null;
  photo_url: string | null;
  award_date: string | null;
  level: string | null;
  is_featured: boolean;
}

// ===== NAZORAT ISHLARI =====
export interface ControlWork {
  id: number;
  teacher_id: number;
  subject_id: number;
  class_id: number;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  title: string | null;
  work_date: string | null;
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
  student_count: number;
}

export interface ClassRanking {
  class_name: string;
  avg_score: number;
  subjects_count: number;
}

export interface OverviewStats {
  active_users: number;
  published_news: number;
  active_questions: number;
  test_sessions: number;
  achievements: number;
}

// ===== TEST KONFIGURATSIYASI =====
export interface TestConfig {
  id: number;
  teacher_id: number | null;
  subject_id: number;
  subject_name: string;
  teacher_name: string | null;
  title: string;
  description: string | null;
  grade_level: number | null;
  mode: 'anonymous' | 'named' | 'timed';
  time_limit: number;
  question_count: number;
  difficulty: 0 | 1 | 2 | 3;
  is_active: boolean;
  available_questions: number;
  created_at: string;
}

// ===== BLOK TEST (DTM uslubidagi) =====
export interface BlockTestSection {
  id: number;
  subject_id: number;
  subject_name: string;
  question_count: number;
  points_per_question: number;
  available_questions?: number;
}

export interface BlockTest {
  id: number;
  teacher_id: number | null;
  teacher_name?: string | null;
  title: string;
  description: string | null;
  grade_level: number | null;
  time_limit: number;
  target_classes: string[];
  is_active: boolean;
  sections: BlockTestSection[];
  total_questions: number;
  max_score: number;
  sessions_count?: number;
  created_at: string;
}

export interface BlockTestSectionResult {
  section_id: number;
  subject_id: number;
  subject_name: string;
  correct_q: number;
  total_q: number;
  score: number;
}

export interface BlockTestSessionResult {
  id: number;
  student_name: string;
  class_name: string | null;
  total_score: number;
  max_score: number;
  section_results: BlockTestSectionResult[];
  time_spent: number | null;
  finished_at: string;
}

// ===== MAKTAB HAQIDA =====
export interface SchoolInfo {
  id: number;
  key: string;
  title: string | null;
  content: string | null;
  updated_at: string;
}

export interface ManagementMember {
  id: number;
  full_name: string;
  position: string;
  photo_url: string | null;
  phone: string | null;
  email: string | null;
  order_num: number;
}

// ===== HUJJATLAR =====
export type DocumentCategory = 'orders' | 'regulations' | 'reports' | 'plans' | 'other';

export interface Document {
  id: number;
  title: string;
  description: string | null;
  file_url: string;
  file_size: number;
  file_type: string;
  category: DocumentCategory;
  download_count: number;
  uploader_name: string | null;
  created_at: string;
}

// ===== O'QITUVCHI PUBLIC PROFIL =====
export interface TeacherProfile {
  id: number;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  experience_years: number;
  education: string | null;
  achievements_text: string | null;
  subjects: Array<{ id: number; name: string; icon: string | null }>;
  rating: number;
}

// ===== DARS JADVALI =====
export interface ScheduleEntry {
  id: number;
  class_id: number;
  subject_id: number;
  teacher_id: number;
  day_of_week: number;
  lesson_num: number;
  shift: 1 | 2;
  room: string | null;
  subject_name: string;
  teacher_name: string;
  class_name: string;
}

// ===== SMART SHIFT =====
export interface CurrentLesson {
  is_lesson: boolean;
  lesson_num?: number;
  shift?: 1 | 2;
  start_time?: string;
  end_time?: string;
  current_time?: string;
  message?: string;
  classes?: {
    class_name: string;
    subject_name: string;
    teacher_name: string;
    room: string | null;
  }[];
  next_lesson?: {
    start_time: string;
    subject_name: string;
    class_name: string;
  } | null;
}
