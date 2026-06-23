import { useMemo, useRef, useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  GraduationCap,
  Star,
  BookOpen,
  Search,
  Award,
  User,
  Clock,
  ChevronRight,
  X,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { TeacherProfile, Subject } from '../../types';

/* ── Colour tokens ─────────────────────────────────────────────────────── */
const SUBJECT_PALETTE = [
  '#6366F1', '#0EA5E9', '#10B981', '#F59E0B', '#EF4444',
  '#8B5CF6', '#EC4899', '#14B8A6', '#F97316', '#06B6D4',
];
const paletteFor = (id: number) => SUBJECT_PALETTE[id % SUBJECT_PALETTE.length];

/* ── Skeleton card ─────────────────────────────────────────────────────── */
function SkeletonCard() {
  return (
    <div className="bg-white rounded-xl border border-slate-100 overflow-hidden animate-pulse">
      <div className="w-full aspect-[3/4] bg-slate-100" />
      <div className="p-2.5 space-y-2">
        <div className="h-3 bg-slate-100 rounded-full w-3/4" />
        <div className="flex gap-1">
          <div className="h-4 bg-slate-100 rounded w-14" />
        </div>
        <div className="h-2.5 bg-slate-100 rounded-full w-1/2" />
      </div>
    </div>
  );
}

/* ── Detail panel ──────────────────────────────────────────────────────── */
function TeacherPanel({
  teacher,
  onClose,
}: {
  teacher: TeacherProfile;
  onClose: () => void;
}) {
  const { t } = useTranslation();
  const accent = teacher.subjects[0] ? paletteFor(teacher.subjects[0].id) : '#6366F1';

  useEffect(() => {
    const handler = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [onClose]);

  return (
    <>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-slate-900/30 backdrop-blur-[2px] z-40"
        onClick={onClose}
      />
      <motion.div
        key="panel"
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '100%' }}
        transition={{ duration: 0.32, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-y-0 right-0 w-full sm:w-[440px] bg-white z-50 shadow-2xl flex flex-col overflow-hidden"
        style={{ borderLeft: '1px solid #F1F5F9' }}
      >
        {/* Accent strip */}
        <div
          className="h-1 w-full shrink-0"
          style={{ background: `linear-gradient(90deg, ${accent} 0%, ${accent}55 100%)` }}
        />

        {/* Panel header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 text-slate-500">
            <GraduationCap className="w-4 h-4" strokeWidth={2} />
            <span className="text-xs font-semibold tracking-widest uppercase">{t('public.teachers.panelLabel')}</span>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" strokeWidth={2} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {/* Profile hero */}
          <div className="px-6 pt-6 pb-5 flex gap-4 items-start">
            <div className="relative shrink-0">
              <div
                className="w-20 h-20 rounded-2xl overflow-hidden bg-slate-100"
                style={{ boxShadow: `0 0 0 3px white, 0 0 0 5px ${accent}33` }}
              >
                {teacher.photo_url ? (
                  <img
                    src={teacher.photo_url}
                    alt={teacher.full_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-300">
                    <User className="w-8 h-8" strokeWidth={1.5} />
                  </div>
                )}
              </div>
              {teacher.rating > 0 && (
                <div
                  className="absolute -bottom-1.5 -right-1.5 w-6 h-6 rounded-full flex items-center justify-center shadow"
                  style={{ background: accent }}
                >
                  <Star className="w-3 h-3 fill-white text-white" strokeWidth={0} />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h2 className="text-[17px] font-bold text-slate-900 leading-tight">
                {teacher.full_name}
              </h2>
              {teacher.experience_years > 0 && (
                <p className="text-xs text-slate-500 font-medium mt-1 flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5 text-slate-400" strokeWidth={2} />
                  {teacher.experience_years} {t('public.teachers.experienceSuffix')}
                </p>
              )}
              {teacher.rating > 0 && (
                <div className="flex items-center gap-2 mt-2.5">
                  <div className="flex gap-0.5">
                    {[1, 2, 3, 4, 5].map(i => (
                      <Star
                        key={i}
                        className="w-3.5 h-3.5"
                        style={{
                          fill: i <= Math.round(teacher.rating) ? '#F59E0B' : 'transparent',
                          color: i <= Math.round(teacher.rating) ? '#F59E0B' : '#D1D5DB',
                        }}
                        strokeWidth={i <= Math.round(teacher.rating) ? 0 : 1.5}
                      />
                    ))}
                  </div>
                  <span className="text-[12px] font-bold" style={{ color: accent }}>
                    {Number(teacher.rating).toFixed(1)}
                  </span>
                </div>
              )}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {teacher.subjects.map(s => (
                  <span
                    key={s.id}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold px-2.5 py-1 rounded-full"
                    style={{ background: `${paletteFor(s.id)}15`, color: paletteFor(s.id) }}
                  >
                    {s.icon && <span>{s.icon}</span>}
                    {s.name}
                  </span>
                ))}
              </div>
            </div>
          </div>

          {/* Stats */}
          {(teacher.experience_years > 0 || teacher.rating > 0) && (
            <div className="mx-6 mb-5 rounded-2xl border border-slate-100 grid grid-cols-2 divide-x divide-slate-100">
              {teacher.experience_years > 0 && (
                <div className="px-4 py-3 text-center">
                  <p className="text-2xl font-black text-slate-900">{teacher.experience_years}</p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('public.teachers.statsExperience')}</p>
                </div>
              )}
              {teacher.rating > 0 && (
                <div className="px-4 py-3 text-center">
                  <p className="text-2xl font-black" style={{ color: accent }}>
                    {Number(teacher.rating).toFixed(1)}
                  </p>
                  <p className="text-[11px] font-medium text-slate-400 mt-0.5">{t('public.teachers.statsRating')}</p>
                </div>
              )}
            </div>
          )}

          <div className="px-6 space-y-5 pb-8">
            {teacher.bio && (
              <section>
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <BookOpen className="w-3.5 h-3.5" strokeWidth={2} />
                  {t('public.teachers.bio')}
                </h4>
                <p className="text-sm text-slate-600 leading-relaxed">{teacher.bio}</p>
              </section>
            )}
            {teacher.education && (
              <section className="pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <GraduationCap className="w-3.5 h-3.5" strokeWidth={2} />
                  {t('public.teachers.education')}
                </h4>
                <div className="flex items-start gap-2.5">
                  <div
                    className="mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm"
                    style={{ background: `${accent}15` }}
                  >
                    🎓
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{teacher.education}</p>
                </div>
              </section>
            )}
            {teacher.achievements_text && (
              <section className="pt-4 border-t border-slate-100">
                <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mb-2.5 flex items-center gap-1.5">
                  <Award className="w-3.5 h-3.5" strokeWidth={2} />
                  {t('public.teachers.achievements')}
                </h4>
                <div className="flex items-start gap-2.5">
                  <div className="mt-0.5 w-7 h-7 rounded-xl flex items-center justify-center shrink-0 text-sm bg-amber-50">
                    🏆
                  </div>
                  <p className="text-sm text-slate-700 leading-relaxed">{teacher.achievements_text}</p>
                </div>
              </section>
            )}
          </div>
        </div>
      </motion.div>
    </>
  );
}

/* ── Main page ─────────────────────────────────────────────────────────── */
export default function TeachersPage() {
  const { t } = useTranslation();
  const [activeSubject, setActiveSubject] = useState<number | 'all'>('all');
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherProfile | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const searchRef = useRef<HTMLInputElement>(null);

  const { data: teachers = [], isLoading } = useQuery<TeacherProfile[]>({
    queryKey: ['teachers-public', activeSubject],
    queryFn: () =>
      apiClient
        .get('/teachers', {
          params: activeSubject !== 'all' ? { subject_id: activeSubject } : {},
        })
        .then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/subjects').then(r => r.data.data),
  });

  const filteredTeachers = useMemo(() => {
    const q = searchQuery.trim().toLowerCase();
    if (!q) return teachers;
    return teachers.filter(t => {
      const nameMatch = t.full_name.toLowerCase().includes(q);
      const subjectMatch = t.subjects.some(s => s.name.toLowerCase().includes(q));
      return nameMatch || subjectMatch;
    });
  }, [teachers, searchQuery]);

  return (
    <div className="min-h-screen w-full min-w-0 bg-[#F8FAFC] pb-24 font-sans overflow-x-hidden">

      {/* ── Sticky header ── */}
      <header className="bg-white border-b border-slate-100 sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-5 sm:px-8 py-4 flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center shrink-0">
              <GraduationCap className="w-5 h-5 text-white" strokeWidth={2} />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold text-slate-900 leading-none">{t('public.teachers.headerTitle')}</h1>
              {!isLoading && (
                <p className="text-[11px] text-slate-400 mt-0.5">{t('public.teachers.countSuffix', { count: teachers.length })}</p>
              )}
            </div>
          </div>
          {/* Desktop search */}
          <div className="relative hidden sm:block w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={2} />
            <input
              ref={searchRef}
              type="text"
              placeholder={t('public.teachers.searchPlaceholder')}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-sm bg-slate-50 border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" strokeWidth={2} />
              </button>
            )}
          </div>
        </div>
      </header>

      <div className="max-w-6xl mx-auto px-5 sm:px-8 py-5">

        {/* Mobile search */}
        <div className="relative sm:hidden mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" strokeWidth={2} />
          <input
            type="text"
            placeholder={t('public.teachers.searchPlaceholderMobile')}
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-indigo-500/30 focus:border-indigo-400 transition-all"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3.5 h-3.5" strokeWidth={2} />
            </button>
          )}
        </div>

        {/* ── Subject filter pills ── */}
        {subjects.length > 0 && (
          <div
            className="flex items-center gap-2 overflow-x-auto pb-1 mb-6 -mx-1 px-1"
            style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
          >
            {[
              { id: 'all' as const, name: t('public.teachers.all'), icon: null, color: '#6366F1' },
              ...subjects,
            ].map(s => {
              const isActive = activeSubject === s.id;
              const color = s.id === 'all' ? '#6366F1' : paletteFor(s.id as number);
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSubject(s.id as number | 'all')}
                  className={`shrink-0 inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-[12px] font-semibold transition-all duration-200 ${
                    isActive
                      ? 'text-white shadow-md'
                      : 'bg-white text-slate-500 border border-slate-200 hover:border-slate-300 hover:text-slate-700'
                  }`}
                  style={isActive ? { background: color, boxShadow: `0 4px 12px ${color}44` } : {}}
                >
                  {s.icon && <span className="text-[11px] leading-none">{s.icon}</span>}
                  {s.name}
                </button>
              );
            })}
            {!isLoading && (
              <span className="ml-auto shrink-0 text-[11px] font-semibold text-slate-400 whitespace-nowrap pl-2">
                {t('public.teachers.foundSuffix', { count: filteredTeachers.length })}
              </span>
            )}
          </div>
        )}

        {/* ── Cards grid ── */}
        {isLoading ? (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {Array.from({ length: 10 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : filteredTeachers.length === 0 ? (
          <div className="bg-white rounded-2xl border border-slate-100 py-20 px-4 text-center">
            <div className="text-5xl mb-4">🔍</div>
            <h3 className="font-semibold text-slate-700 text-sm">{t('public.teachers.notFound')}</h3>
            <p className="text-xs text-slate-400 mt-1 max-w-xs mx-auto">
              {t('public.teachers.notFoundDesc')}
            </p>
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                className="mt-4 text-xs font-semibold text-indigo-600 hover:text-indigo-700 transition-colors"
              >
                {t('public.teachers.clearSearch')}
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredTeachers.map((teacher, i) => {
              const accent = teacher.subjects[0] ? paletteFor(teacher.subjects[0].id) : '#6366F1';
              return (
                <motion.button
                  key={teacher.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.28, delay: Math.min(i * 0.04, 0.24) }}
                  onClick={() => setSelectedTeacher(teacher)}
                  className="group text-left bg-white rounded-xl border border-slate-100 overflow-hidden hover:border-transparent hover:shadow-lg hover:shadow-slate-200/70 transition-all duration-300 flex flex-col"
                >
                  {/* Portrait */}
                  <div className="relative w-full aspect-[3/4] overflow-hidden bg-slate-100">
                    {teacher.photo_url ? (
                      <img
                        src={teacher.photo_url}
                        alt={teacher.full_name}
                        className="w-full h-full object-cover group-hover:scale-[1.05] transition-transform duration-500"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-slate-300">
                        <User className="w-8 h-8" strokeWidth={1.25} />
                      </div>
                    )}
                    {/* Subject accent bar */}
                    <div
                      className="absolute inset-x-0 bottom-0 h-[3px]"
                      style={{ background: `linear-gradient(90deg, ${accent}, ${accent}66)` }}
                    />
                    {/* Rating badge */}
                    {teacher.rating > 0 && (
                      <div className="absolute top-1.5 right-1.5 flex items-center gap-0.5 bg-black/60 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                        <Star className="w-2 h-2 fill-amber-400 text-amber-400" strokeWidth={0} />
                        <span className="text-[9px] font-bold text-white leading-none">
                          {Number(teacher.rating).toFixed(1)}
                        </span>
                      </div>
                    )}
                    {/* Experience badge */}
                    {teacher.experience_years > 0 && (
                      <div className="absolute bottom-2 left-2 bg-white/90 backdrop-blur-sm rounded-full px-1.5 py-0.5">
                        <span className="text-[9px] font-bold text-slate-700">{teacher.experience_years} {t('public.teachers.yearsShort')}</span>
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 flex flex-col p-2.5 gap-1.5">
                    <h3 className="font-bold text-[11px] text-slate-900 leading-tight line-clamp-1 group-hover:text-indigo-600 transition-colors">
                      {teacher.full_name}
                    </h3>
                    <div className="flex flex-wrap gap-0.5">
                      {teacher.subjects.slice(0, 1).map(s => (
                        <span
                          key={s.id}
                          className="inline-flex items-center gap-0.5 text-[9px] font-semibold px-1.5 py-0.5 rounded"
                          style={{ background: `${paletteFor(s.id)}13`, color: paletteFor(s.id) }}
                        >
                          {s.icon && <span>{s.icon}</span>}
                          {s.name}
                        </span>
                      ))}
                      {teacher.subjects.length > 1 && (
                        <span className="text-[9px] font-medium text-slate-400 px-0.5">
                          +{teacher.subjects.length - 1}
                        </span>
                      )}
                    </div>
                    <div className="mt-auto pt-2 border-t border-slate-50 flex items-center justify-between">
                      <div className="flex gap-0.5">
                        {[1, 2, 3, 4, 5].map(i => (
                          <Star
                            key={i}
                            className="w-2 h-2"
                            style={{
                              fill: i <= Math.round(teacher.rating) ? '#F59E0B' : '#E5E7EB',
                              color: 'transparent',
                            }}
                            strokeWidth={0}
                          />
                        ))}
                      </div>
                      <ChevronRight
                        className="w-3 h-3 text-slate-300 group-hover:text-indigo-500 group-hover:translate-x-0.5 transition-all"
                        strokeWidth={2.5}
                      />
                    </div>
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Detail panel ── */}
      <AnimatePresence>
        {selectedTeacher && (
          <TeacherPanel
            teacher={selectedTeacher}
            onClose={() => setSelectedTeacher(null)}
          />
        )}
      </AnimatePresence>
    </div>
  );
}