import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { GraduationCap, Star, BookOpen, Briefcase } from 'lucide-react';
import { apiClient } from '../../api/client';
import { TeacherProfile, Subject } from '../../types';

const fade = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function RatingStars({ rating }: { rating: number }) {
  const pct = Math.min(rating / 10, 1);
  const color = rating >= 7 ? 'text-green-500' : rating >= 4 ? 'text-amber-500' : 'text-red-400';
  return (
    <div className="flex items-center gap-1.5">
      <Star className={`w-4 h-4 fill-current ${color}`} />
      <span className={`text-sm font-semibold ${color}`}>{Number(rating).toFixed(1)}</span>
      <span className="text-xs text-gray-400">/ 10</span>
    </div>
  );
}

export default function TeachersPage() {
  const [activeSubject, setActiveSubject] = useState<number | null>(null);
  const [expanded, setExpanded] = useState<number | null>(null);

  const { data: teachers = [], isLoading } = useQuery<TeacherProfile[]>({
    queryKey: ['teachers-public', activeSubject],
    queryFn: () => apiClient.get('/teachers', {
      params: activeSubject ? { subject_id: activeSubject } : {},
    }).then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/subjects').then(r => r.data.data),
  });

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <motion.div {...fade} className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">O'qituvchilar</h1>
        <p className="text-gray-500">Maktabimizning tajribali pedagog jamoasi</p>
      </motion.div>

      {/* Subject filter */}
      {subjects.length > 0 && (
        <motion.div {...fade} transition={{ delay: 0.1 }} className="flex flex-wrap gap-2 justify-center">
          <button
            onClick={() => setActiveSubject(null)}
            className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
              activeSubject === null ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
            }`}
          >
            Barchasi
          </button>
          {subjects.map(s => (
            <button
              key={s.id}
              onClick={() => setActiveSubject(activeSubject === s.id ? null : s.id)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                activeSubject === s.id ? 'bg-blue-700 text-white border-blue-700' : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {s.icon && <span className="mr-1">{s.icon}</span>}{s.name}
            </button>
          ))}
        </motion.div>
      )}

      {/* Teachers grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card h-64 animate-pulse" />
          ))}
        </div>
      ) : !teachers.length ? (
        <div className="text-center py-16 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>O'qituvchilar topilmadi</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
          {teachers.map((t, i) => (
            <motion.div
              key={t.id}
              {...fade}
              transition={{ delay: i * 0.05 }}
              className="card hover:shadow-md transition-shadow cursor-pointer"
              onClick={() => setExpanded(expanded === t.id ? null : t.id)}
            >
              {/* Avatar */}
              <div className="flex flex-col items-center text-center mb-4">
                <div className="w-20 h-20 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center mb-3 ring-2 ring-blue-100">
                  {t.photo_url
                    ? <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-blue-700">{t.full_name[0]}</span>}
                </div>
                <h3 className="font-semibold text-gray-800 text-sm">{t.full_name}</h3>
                <div className="mt-1">
                  <RatingStars rating={t.rating} />
                </div>
              </div>

              {/* Subjects */}
              <div className="flex flex-wrap gap-1 justify-center mb-3">
                {t.subjects.slice(0, 3).map(s => (
                  <span key={s.id} className="badge badge-blue text-xs">
                    {s.icon && <span className="mr-1">{s.icon}</span>}{s.name}
                  </span>
                ))}
                {t.subjects.length > 3 && (
                  <span className="text-xs text-gray-400">+{t.subjects.length - 3}</span>
                )}
              </div>

              {/* Experience */}
              {t.experience_years > 0 && (
                <div className="flex items-center justify-center gap-1 text-xs text-gray-500">
                  <Briefcase className="w-3 h-3" />
                  <span>{t.experience_years} yil tajriba</span>
                </div>
              )}

              {/* Expanded info */}
              {expanded === t.id && (
                <div className="mt-4 pt-4 border-t border-gray-100 space-y-2 text-left">
                  {t.bio && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1 flex items-center gap-1">
                        <BookOpen className="w-3 h-3" /> Bio
                      </p>
                      <p className="text-xs text-gray-600">{t.bio}</p>
                    </div>
                  )}
                  {t.education && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Ta'lim</p>
                      <p className="text-xs text-gray-600">{t.education}</p>
                    </div>
                  )}
                  {t.achievements_text && (
                    <div>
                      <p className="text-xs font-medium text-gray-500 mb-1">Yutuqlar</p>
                      <p className="text-xs text-gray-600">{t.achievements_text}</p>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
