import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Users, Newspaper, BookOpen, BarChart3,
  Trophy, ClipboardCheck, TrendingUp, ArrowRight,
} from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { OverviewStats, TeacherRating } from '../../types';

// ===== Stat card =====
interface StatCardProps {
  label: string;
  value: number;
  icon: React.ElementType;
  color: string;
  to: string;
}

function StatCard({ label, value, icon: Icon, color, to }: StatCardProps) {
  return (
    <Link to={to} className="card hover:shadow-md transition-shadow group">
      <div className="flex items-center justify-between mb-3">
        <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5" />
        </div>
        <ArrowRight className="w-4 h-4 text-gray-200 group-hover:text-blue-500 transition-colors" />
      </div>
      <p className="text-3xl font-bold text-gray-800">{value.toLocaleString()}</p>
      <p className="text-sm text-gray-500 mt-1">{label}</p>
    </Link>
  );
}

export default function AdminDashboard() {
  const { t } = useTranslation();
  const { data: stats, isLoading: statsLoading } = useQuery<OverviewStats>({
    queryKey: ['analytics-overview'],
    queryFn: () => apiClient.get('/analytics/overview').then(r => r.data.data),
  });

  const { data: teachers } = useQuery<TeacherRating[]>({
    queryKey: ['teacher-ratings'],
    queryFn: () => apiClient.get('/analytics/teacher-ratings').then(r => r.data.data),
  });

  const statCards = stats
    ? [
        { label: t('admin.dashboard.statActiveUsers'), value: stats.active_users, icon: Users, color: 'bg-blue-50 text-blue-700', to: '/admin/users' },
        { label: t('admin.dashboard.statPublishedNews'), value: stats.published_news, icon: Newspaper, color: 'bg-amber-50 text-amber-700', to: '/admin/news' },
        { label: t('admin.dashboard.statActiveQuestions'), value: stats.active_questions, icon: BookOpen, color: 'bg-violet-50 text-violet-700', to: '/admin/analytics' },
        { label: t('admin.dashboard.statTestSessions'), value: stats.test_sessions, icon: ClipboardCheck, color: 'bg-green-50 text-green-700', to: '/admin/analytics' },
        { label: t('admin.dashboard.statAchievements'), value: stats.achievements, icon: Trophy, color: 'bg-rose-50 text-rose-700', to: '/admin/achievements' },
      ]
    : [];

  const chartData = teachers?.slice(0, 8).map(t => ({
    name: t.full_name.split(' ')[0],
    reyting: Number(t.rating),
    savollar: Number(t.questions_count),
  })) ?? [];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.dashboard.title')}</h1>
        <p className="text-sm text-gray-500 mt-1">{t('admin.dashboard.subtitle')}</p>
      </div>

      {/* Stats cards */}
      {statsLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse">
              <div className="w-10 h-10 bg-gray-100 rounded-xl mb-3" />
              <div className="h-8 bg-gray-100 rounded w-16 mb-1" />
              <div className="h-4 bg-gray-100 rounded w-24" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {statCards.map(card => (
            <StatCard key={card.label} {...card} />
          ))}
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Teacher ratings chart */}
        <div className="card lg:col-span-2">
          <div className="flex items-center gap-2 mb-5">
            <BarChart3 className="w-4 h-4 text-blue-700" />
            <h2 className="font-semibold text-gray-800">{t('admin.dashboard.ratingChartTitle')}</h2>
          </div>

          {chartData.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-gray-400">
              <TrendingUp className="w-10 h-10 mb-2 opacity-30" />
              <p className="text-sm">{t('admin.dashboard.noData')}</p>
              <p className="text-xs mt-1">{t('admin.dashboard.noDataSub')}</p>
            </div>
          ) : (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                <XAxis dataKey="name" tick={{ fontSize: 12, fill: '#6b7280' }} />
                <YAxis tick={{ fontSize: 12, fill: '#6b7280' }} domain={[0, 10]} />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(value: any, name: string) => [
                    value,
                    name === 'reyting' ? t('admin.dashboard.tooltipRating') : t('admin.dashboard.tooltipQuestions'),
                  ]}
                />
                <Bar dataKey="reyting" fill="#1d4ed8" radius={[4, 4, 0, 0]} maxBarSize={40} />
              </BarChart>
            </ResponsiveContainer>
          )}
        </div>

        {/* Teacher list */}
        <div className="card">
          <div className="flex items-center gap-2 mb-4">
            <Users className="w-4 h-4 text-blue-700" />
            <h2 className="font-semibold text-gray-800">{t('admin.dashboard.topTeachers')}</h2>
          </div>

          {!teachers?.length ? (
            <div className="text-center text-gray-400 py-8">
              <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
              <p className="text-sm">{t('admin.dashboard.noTeachers')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teachers.slice(0, 6).map((teacher, i) => (
                <div key={teacher.teacher_id} className="flex items-center gap-3">
                  <div className="w-7 h-7 rounded-full bg-blue-50 flex items-center justify-center text-xs font-bold text-blue-800 shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-800 truncate">{teacher.full_name}</p>
                    <p className="text-xs text-gray-400">{teacher.questions_count} {t('admin.dashboard.questionsCountSuffix')}</p>
                  </div>
                  <span className="text-sm font-semibold text-blue-700 shrink-0">{teacher.rating}</span>
                </div>
              ))}
            </div>
          )}

          <Link to="/admin/analytics" className="block text-center text-xs text-blue-600 hover:text-blue-800 mt-4 pt-3 border-t border-gray-100">
            {t('admin.dashboard.moreAnalytics')}
          </Link>
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h2 className="font-semibold text-gray-800 mb-4">{t('admin.dashboard.quickActions')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/admin/users', label: t('admin.dashboard.actionAddUser'), icon: Users, color: 'text-blue-700 bg-blue-50' },
            { to: '/admin/news', label: t('admin.dashboard.actionWriteNews'), icon: Newspaper, color: 'text-amber-700 bg-amber-50' },
            { to: '/admin/achievements', label: t('admin.dashboard.actionAddAchievement'), icon: Trophy, color: 'text-green-700 bg-green-50' },
            { to: '/admin/analytics', label: t('admin.dashboard.actionReports'), icon: BarChart3, color: 'text-violet-700 bg-violet-50' },
          ].map(action => {
            const Icon = action.icon;
            return (
              <Link
                key={action.to}
                to={action.to}
                className="flex items-center gap-3 p-3 rounded-xl border border-gray-100 hover:border-blue-200 hover:bg-blue-50/30 transition-all group"
              >
                <div className={`w-8 h-8 rounded-lg flex items-center justify-center ${action.color}`}>
                  <Icon className="w-4 h-4" />
                </div>
                <span className="text-sm font-medium text-gray-700 group-hover:text-blue-800">{action.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </div>
  );
}
