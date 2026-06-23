import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Star, GraduationCap, BookOpen, Calendar, ChevronLeft, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { Achievement } from '../../types';
import { getDateLocale } from '../../i18n/dateLocale';

type FilterType = '' | 'student' | 'teacher';

const LEVEL_COLORS: Record<string, string> = {
  xalqaro: 'badge-blue',
  respublika: 'badge-green',
  viloyat: 'badge-amber',
  tuman: 'bg-violet-100 text-violet-700',
  maktab: 'bg-gray-100 text-gray-700',
};

function getLevelColor(level: string | null) {
  if (!level) return 'bg-gray-100 text-gray-500';
  const key = Object.keys(LEVEL_COLORS).find(k => level.toLowerCase().includes(k));
  return key ? LEVEL_COLORS[key] : 'bg-gray-100 text-gray-600';
}

function formatDate(iso: string | null) {
  if (!iso) return null;
  return new Date(iso).toLocaleDateString(getDateLocale(), {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function AchievementCard({ item }: { item: Achievement }) {
  const { t } = useTranslation();
  return (
    <div className={`card hover:shadow-md transition-all duration-200 relative ${item.is_featured ? 'ring-2 ring-amber-300 ring-offset-1' : ''}`}>
      {item.is_featured && (
        <div className="absolute -top-2 -right-2 bg-amber-400 text-white rounded-full p-1">
          <Star className="w-3.5 h-3.5 fill-white" />
        </div>
      )}

      <div className="flex gap-4">
        {/* Avatar */}
        <div className="shrink-0">
          {item.photo_url ? (
            <img
              src={item.photo_url}
              alt={item.person_name}
              className="w-16 h-16 rounded-xl object-cover border border-gray-100"
            />
          ) : (
            <div className={`w-16 h-16 rounded-xl flex items-center justify-center ${
              item.person_type === 'student' ? 'bg-blue-50' : 'bg-amber-50'
            }`}>
              {item.person_type === 'student'
                ? <GraduationCap className="w-7 h-7 text-blue-600" />
                : <BookOpen className="w-7 h-7 text-amber-600" />
              }
            </div>
          )}
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 flex-wrap mb-1.5">
            <h3 className="font-semibold text-gray-800 text-sm leading-tight">{item.person_name}</h3>
            <div className="flex items-center gap-1.5 shrink-0">
              <span className={`badge ${item.person_type === 'student' ? 'badge-blue' : 'badge-amber'}`}>
                {item.person_type === 'student' ? t('public.achievements.student') : t('public.achievements.teacher')}
              </span>
            </div>
          </div>

          <p className="text-gray-700 font-medium text-sm mb-2 leading-snug">{item.title}</p>

          {item.description && (
            <p className="text-gray-500 text-xs mb-2 line-clamp-2">{item.description}</p>
          )}

          <div className="flex items-center gap-2 flex-wrap">
            {item.level && (
              <span className={`badge text-xs ${getLevelColor(item.level)}`}>
                {item.level}
              </span>
            )}
            {item.class_name && (
              <span className="text-xs text-gray-400">{item.class_name}{t('public.achievements.gradeSuffix')}</span>
            )}
            {item.award_date && (
              <span className="text-xs text-gray-400 flex items-center gap-0.5">
                <Calendar className="w-3 h-3" />
                {formatDate(item.award_date)}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function AchievementsPage() {
  const { t } = useTranslation();
  const [filter, setFilter] = useState<FilterType>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['achievements', filter, page],
    queryFn: () =>
      apiClient.get('/achievements', {
        params: { person_type: filter || undefined, page, limit: 12 },
      }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const items: Achievement[] = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;
  const total: number = meta?.total ?? 0;

  const handleFilter = (f: FilterType) => {
    setFilter(f);
    setPage(1);
  };

  const featured = items.filter(i => i.is_featured);
  const rest = items.filter(i => !i.is_featured);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-amber-100 p-2 rounded-xl">
            <Trophy className="w-6 h-6 text-amber-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{t('public.achievements.title')}</h1>
        </div>
        <p className="text-gray-500">
          {total > 0 ? t('public.achievements.subtitleCount', { count: total }) : t('public.achievements.subtitleEmpty')}
        </p>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6">
        {[
          { value: '' as FilterType, labelKey: 'public.achievements.filterAll' },
          { value: 'student' as FilterType, labelKey: 'public.achievements.filterStudents' },
          { value: 'teacher' as FilterType, labelKey: 'public.achievements.filterTeachers' },
        ].map(f => (
          <button
            key={f.value}
            onClick={() => handleFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f.value
                ? 'bg-blue-800 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-700'
            }`}
          >
            {t(f.labelKey)}
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="flex gap-4">
                <div className="w-16 h-16 bg-gray-100 rounded-xl shrink-0" />
                <div className="flex-1 space-y-2">
                  <div className="h-4 bg-gray-100 rounded w-2/3" />
                  <div className="h-3 bg-gray-100 rounded w-full" />
                  <div className="h-3 bg-gray-100 rounded w-1/2" />
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : items.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Trophy className="w-14 h-14 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">{t('public.achievements.empty')}</p>
          <p className="text-sm mt-1">{t('public.achievements.emptySub')}</p>
        </div>
      ) : (
        <>
          {/* Featured */}
          {page === 1 && featured.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center gap-2 mb-3">
                <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                <h2 className="font-semibold text-gray-700 text-sm">{t('public.achievements.featured')}</h2>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {featured.map(item => (
                  <AchievementCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Rest */}
          {rest.length > 0 && (
            <div>
              {page === 1 && featured.length > 0 && (
                <h2 className="font-semibold text-gray-700 text-sm mb-3">{t('public.achievements.others')}</h2>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {rest.map(item => (
                  <AchievementCard key={item.id} item={item} />
                ))}
              </div>
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 disabled:opacity-40"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <span className="text-sm text-gray-600 px-3">
                {page} / {totalPages}
              </span>
              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 disabled:opacity-40"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
