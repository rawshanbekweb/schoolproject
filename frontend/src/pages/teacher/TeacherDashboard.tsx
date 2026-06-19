import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  BookOpen, ClipboardList, Star, TrendingUp,
  ChevronRight, GraduationCap, Plus,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Question, Subject } from '../../types';

interface MyStats {
  subjects: Subject[];
  questions_count: number;
  control_works_count: number;
  rating: number;
}

function RatingRing({ rating }: { rating: number }) {
  const pct = Math.min(rating / 10, 1);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = rating >= 7 ? '#16a34a' : rating >= 4 ? '#d97706' : '#dc2626';

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{rating}</span>
        <span className="text-xs text-gray-400">/ 10</span>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { user } = useAuthStore();

  const { data: stats, isLoading } = useQuery<MyStats>({
    queryKey: ['my-stats'],
    queryFn: () => apiClient.get('/analytics/my-stats').then(r => r.data.data),
  });

  const { data: recentQuestions = [] } = useQuery<Question[]>({
    queryKey: ['questions-manage'],
    queryFn: () => apiClient.get('/questions/manage').then(r => r.data.data),
    select: data => data.slice(0, 5),
  });

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div>
            <p className="text-blue-200 text-sm mb-1">Xush kelibsiz,</p>
            <h1 className="text-2xl font-bold">{user?.full_name}</h1>
            <p className="text-blue-200 text-sm mt-1">O'qituvchi kabineti</p>
          </div>
          <div className="bg-white/10 rounded-xl p-3">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="card flex items-center gap-4">
            <div className="bg-blue-50 p-3 rounded-xl">
              <BookOpen className="w-6 h-6 text-blue-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{stats?.questions_count ?? 0}</p>
              <p className="text-sm text-gray-500">Test savollari</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <div className="bg-green-50 p-3 rounded-xl">
              <ClipboardList className="w-6 h-6 text-green-700" />
            </div>
            <div>
              <p className="text-3xl font-bold text-gray-800">{stats?.control_works_count ?? 0}</p>
              <p className="text-sm text-gray-500">Nazorat ishlari</p>
            </div>
          </div>

          <div className="card flex items-center gap-4">
            <RatingRing rating={stats?.rating ?? 0} />
            <div>
              <p className="font-semibold text-gray-800">Reyting ball</p>
              <p className="text-xs text-gray-500 mt-0.5">
                {(stats?.rating ?? 0) >= 7 ? 'A\'lo' : (stats?.rating ?? 0) >= 4 ? 'Yaxshi' : 'Faollik kerak'}
              </p>
              <p className="text-xs text-gray-400 mt-1">Ball + savollar asosida</p>
            </div>
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Subjects */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Star className="w-4 h-4 text-amber-500" />
            <h2 className="font-semibold text-gray-800">Biriktirilgan fanlar</h2>
          </div>

          {!stats?.subjects?.length ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Fan biriktirilmagan</p>
              <p className="text-xs mt-1">Admin fanni biriktirishi kerak</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 gap-2">
              {stats.subjects.map(s => (
                <div key={s.id} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                  <span className="text-xl">{s.icon ?? '📚'}</span>
                  <div>
                    <p className="text-sm font-medium text-gray-700">{s.name}</p>
                    {s.short_name && <p className="text-xs text-gray-400">{s.short_name}</p>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent questions */}
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-700" />
              <h2 className="font-semibold text-gray-800">So'nggi savollar</h2>
            </div>
            <Link to="/teacher/questions" className="text-xs text-blue-600 hover:text-blue-800">
              Barchasi →
            </Link>
          </div>

          {!recentQuestions.length ? (
            <div className="text-center py-8 text-gray-400">
              <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p className="text-sm">Savollar yo'q</p>
            </div>
          ) : (
            <div className="space-y-2">
              {recentQuestions.map((q, i) => (
                <div key={q.id} className="flex items-start gap-3 p-2.5 hover:bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 w-5 text-right shrink-0 mt-0.5">{i + 1}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-700 line-clamp-1">{q.text}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{q.subject_name}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link to="/teacher/questions" className="card hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="bg-blue-50 p-3 rounded-xl">
            <BookOpen className="w-6 h-6 text-blue-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 group-hover:text-blue-800">Test savollari</p>
            <p className="text-sm text-gray-500 mt-0.5">Savol qo'shish va tahrirlash</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </Link>

        <Link to="/teacher/control-works" className="card hover:shadow-md transition-shadow group flex items-center gap-4">
          <div className="bg-green-50 p-3 rounded-xl">
            <ClipboardList className="w-6 h-6 text-green-700" />
          </div>
          <div className="flex-1">
            <p className="font-semibold text-gray-800 group-hover:text-blue-800">Nazorat ishlari</p>
            <p className="text-sm text-gray-500 mt-0.5">Natijalarni kiritish</p>
          </div>
          <ChevronRight className="w-5 h-5 text-gray-300 group-hover:text-blue-500 transition-colors" />
        </Link>
      </div>
    </div>
  );
}
