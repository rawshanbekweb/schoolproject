import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Trophy, Medal, TrendingUp, BookOpen, ChevronDown } from 'lucide-react';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from 'recharts';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { ClassRanking } from '../../types';

const QUARTERS = [1, 2, 3, 4];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const RANK_COLORS = ['#f59e0b', '#9ca3af', '#b45309'];
const BAR_COLORS = ['#1d4ed8', '#2563eb', '#3b82f6', '#60a5fa', '#93c5fd'];

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return (
    <div className="w-8 h-8 bg-amber-100 rounded-full flex items-center justify-center shrink-0">
      <Trophy className="w-4 h-4 text-amber-500" />
    </div>
  );
  if (rank === 2) return (
    <div className="w-8 h-8 bg-gray-100 rounded-full flex items-center justify-center shrink-0">
      <Medal className="w-4 h-4 text-gray-400" />
    </div>
  );
  if (rank === 3) return (
    <div className="w-8 h-8 bg-orange-50 rounded-full flex items-center justify-center shrink-0">
      <Medal className="w-4 h-4 text-orange-400" />
    </div>
  );
  return (
    <div className="w-8 h-8 bg-gray-50 rounded-full flex items-center justify-center shrink-0">
      <span className="text-xs font-bold text-gray-500">{rank}</span>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const pct = (score / 5) * 100;
  const color = score >= 4 ? 'bg-green-500' : score >= 3 ? 'bg-amber-500' : 'bg-red-400';
  return (
    <div className="flex items-center gap-2 flex-1">
      <div className="flex-1 h-2 bg-gray-100 rounded-full overflow-hidden">
        <div className={`h-full rounded-full transition-all duration-500 ${color}`} style={{ width: `${pct}%` }} />
      </div>
      <span className={`text-sm font-semibold w-8 text-right ${
        score >= 4 ? 'text-green-600' : score >= 3 ? 'text-amber-600' : 'text-red-500'
      }`}>
        {Number(score).toFixed(1)}
      </span>
    </div>
  );
}

export default function ControlWorksPage() {
  const { t } = useTranslation();
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(CURRENT_YEAR);

  const { data: ranking = [], isLoading } = useQuery<ClassRanking[]>({
    queryKey: ['class-ranking', quarter, year],
    queryFn: () =>
      apiClient.get('/analytics/class-ranking', {
        params: { quarter, year },
      }).then(r => r.data.data),
  });

  const chartData = ranking.slice(0, 10).map(r => ({
    name: r.class_name,
    ball: Number(r.avg_score),
  }));

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center gap-3 mb-2">
          <div className="bg-blue-100 p-2 rounded-xl">
            <TrendingUp className="w-6 h-6 text-blue-700" />
          </div>
          <h1 className="text-3xl font-bold text-gray-800">{t('public.controlWorks.title')}</h1>
        </div>
        <p className="text-gray-500">{t('public.controlWorks.subtitle')}</p>
      </div>

      {/* Filters */}
      <div className="flex flex-wrap gap-3 mb-8">
        {/* Quarter */}
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {QUARTERS.map(q => (
            <button
              key={q}
              onClick={() => setQuarter(q)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                quarter === q
                  ? 'bg-white text-blue-800 shadow-sm'
                  : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              {t('public.controlWorks.quarterLabel', { q })}
            </button>
          ))}
        </div>

        {/* Year */}
        <div className="relative">
          <select
            className="input pr-8 appearance-none"
            value={year}
            onChange={e => setYear(Number(e.target.value))}
          >
            {YEARS.map(y => (
              <option key={y} value={y}>{t('public.controlWorks.yearLabel', { y })}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card animate-pulse h-80" />
          <div className="card animate-pulse h-80" />
        </div>
      ) : ranking.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <BookOpen className="w-14 h-14 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">
            {t('public.controlWorks.emptyTitle', { quarter, year })}
          </p>
          <p className="text-sm mt-1">{t('public.controlWorks.emptySub')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Chart */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-blue-700" />
              {t('public.controlWorks.chartTitle')}
            </h2>
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={chartData} margin={{ top: 0, right: 0, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" vertical={false} />
                <XAxis
                  dataKey="name"
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  angle={-45}
                  textAnchor="end"
                  height={50}
                />
                <YAxis
                  tick={{ fontSize: 11, fill: '#6b7280' }}
                  domain={[0, 5]}
                  tickCount={6}
                />
                <Tooltip
                  contentStyle={{ borderRadius: 8, border: '1px solid #e5e7eb', fontSize: 12 }}
                  formatter={(v: any) => [`${Number(v).toFixed(2)} ball`, t('public.controlWorks.tooltipAvg')]}
                />
                <Bar dataKey="ball" radius={[4, 4, 0, 0]} maxBarSize={40}>
                  {chartData.map((_, i) => (
                    <Cell
                      key={i}
                      fill={BAR_COLORS[Math.min(i, BAR_COLORS.length - 1)]}
                      fillOpacity={i === 0 ? 1 : 0.75 - i * 0.04}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Ranking list */}
          <div className="card">
            <h2 className="font-semibold text-gray-800 mb-5 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500" />
              {t('public.controlWorks.rankingTitle')}
              <span className="ml-auto text-xs text-gray-400 font-normal">
                {t('public.controlWorks.quarterLabel', { q: quarter })}, {year}
              </span>
            </h2>

            <div className="space-y-3">
              {ranking.map((item, i) => (
                <div key={item.class_name} className={`flex items-center gap-3 p-3 rounded-xl transition-colors ${
                  i === 0 ? 'bg-amber-50 border border-amber-100'
                  : i === 1 ? 'bg-gray-50'
                  : i === 2 ? 'bg-orange-50/50'
                  : 'hover:bg-gray-50'
                }`}>
                  <RankBadge rank={i + 1} />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-1">
                      <span className="font-semibold text-gray-800 text-sm">{item.class_name}</span>
                      <span className="text-xs text-gray-400 ml-2 shrink-0">
                        {t('public.controlWorks.subjectsCount', { count: item.subjects_count })}
                      </span>
                    </div>
                    <ScoreBar score={Number(item.avg_score)} />
                  </div>
                </div>
              ))}
            </div>

            {ranking.length > 0 && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-xs text-gray-400">
                <span>{t('public.controlWorks.classesCount', { count: ranking.length })}</span>
                <span>
                  {t('public.controlWorks.average', { val: (ranking.reduce((s, r) => s + Number(r.avg_score), 0) / ranking.length).toFixed(2) })}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Legend */}
      <div className="mt-6 card">
        <p className="text-xs text-gray-500 font-medium mb-2">{t('public.controlWorks.legendTitle')}</p>
        <div className="flex gap-6 flex-wrap text-xs">
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-green-500" />{t('public.controlWorks.legendExcellent')}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-amber-500" />{t('public.controlWorks.legendOk')}</span>
          <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-red-400" />{t('public.controlWorks.legendBad')}</span>
        </div>
      </div>
    </div>
  );
}
