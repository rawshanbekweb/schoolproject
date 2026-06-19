import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, Cell,
} from 'recharts';
import { Trophy, BarChart2, Users, BookOpen, Star } from 'lucide-react';
import { apiClient } from '../../api/client';

interface TeacherRating {
  teacher_id: number;
  full_name: string;
  photo_url?: string;
  avg_score: number;
  questions_count: number;
  rating: number;
  subjects: string[];
}

interface ClassAvg {
  class_id: number;
  class_name: string;
  subject_name: string;
  quarter: number;
  avg_score: number;
  student_count: number;
}

const QUARTERS = [1, 2, 3, 4];
const CURRENT_YEAR = new Date().getFullYear();
const YEARS = [CURRENT_YEAR, CURRENT_YEAR - 1, CURRENT_YEAR - 2];

const RATING_COLORS = ['#16a34a', '#16a34a', '#16a34a', '#65a30d', '#65a30d', '#d97706', '#d97706', '#dc2626', '#dc2626', '#dc2626', '#dc2626'];
const SCORE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f97316', '#22c55e', '#14b8a6', '#eab308'];

function RatingBadge({ rating }: { rating: number }) {
  const color = rating >= 7 ? 'bg-green-100 text-green-700' : rating >= 4 ? 'bg-amber-100 text-amber-700' : 'bg-red-100 text-red-700';
  return <span className={`px-2 py-0.5 rounded-full text-xs font-semibold ${color}`}>{Number(rating).toFixed(1)}</span>;
}

export default function AnalyticsPage() {
  const [quarter, setQuarter] = useState(1);
  const [year, setYear] = useState(CURRENT_YEAR);

  const { data: teachers = [], isLoading: tLoad } = useQuery<TeacherRating[]>({
    queryKey: ['teacher-ratings'],
    queryFn: () => apiClient.get('/analytics/teacher-ratings').then(r => r.data.data),
  });

  const { data: classAvgs = [], isLoading: cLoad } = useQuery<ClassAvg[]>({
    queryKey: ['class-averages', quarter, year],
    queryFn: () => apiClient.get(`/analytics/class-averages?quarter=${quarter}&year=${year}`).then(r => r.data.data),
  });

  // Group class averages by subject for chart
  const subjectMap = new Map<string, { name: string; avgs: Record<string, number> }>();
  const classNames = new Set<string>();

  classAvgs.forEach(row => {
    classNames.add(row.class_name);
    if (!subjectMap.has(row.subject_name)) {
      subjectMap.set(row.subject_name, { name: row.subject_name, avgs: {} });
    }
    subjectMap.get(row.subject_name)!.avgs[row.class_name] = Number(row.avg_score);
  });

  const classNamesArr = Array.from(classNames).sort();
  const subjectsArr = Array.from(subjectMap.values());

  // Build chart data: one bar per class, grouped by subject
  const classChartData = classNamesArr.map(cn => {
    const entry: Record<string, any> = { class: cn };
    subjectsArr.forEach(s => {
      entry[s.name] = s.avgs[cn] ?? 0;
    });
    return entry;
  });

  // Teacher bar chart data
  const teacherChartData = teachers.slice(0, 10).map(t => ({
    name: t.full_name.split(' ').slice(0, 2).join(' '),
    rating: Number(t.rating),
    questions: Number(t.questions_count),
  }));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold text-gray-800">Tahlil va statistika</h1>
        <p className="text-sm text-gray-500 mt-0.5">O'qituvchilar va sinflar ko'rsatkichlari</p>
      </div>

      {/* Teacher ratings */}
      <div className="card">
        <div className="flex items-center gap-2 mb-5">
          <Trophy className="w-5 h-5 text-amber-500" />
          <h2 className="font-semibold text-gray-800">O'qituvchilar reytingi</h2>
          <span className="ml-auto text-xs text-gray-400">{teachers.length} ta o'qituvchi</span>
        </div>

        {tLoad ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !teachers.length ? (
          <div className="text-center py-12 text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">O'qituvchilar topilmadi</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Chart */}
            <div className="h-64">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={teacherChartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="name" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 10]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    formatter={(v: number) => [v.toFixed(1), 'Reyting']}
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="rating" radius={[4, 4, 0, 0]} maxBarSize={40}>
                    {teacherChartData.map((entry, i) => (
                      <Cell key={i} fill={entry.rating >= 7 ? '#16a34a' : entry.rating >= 4 ? '#d97706' : '#dc2626'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Table */}
            <div className="overflow-auto max-h-64 space-y-2 pr-1">
              {teachers.map((t, i) => (
                <div key={t.teacher_id} className="flex items-center gap-3 p-2 hover:bg-gray-50 rounded-lg">
                  <span className="text-xs text-gray-400 w-5 text-right shrink-0">{i + 1}</span>
                  <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0 overflow-hidden">
                    {t.photo_url
                      ? <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
                      : <span className="text-sm font-semibold text-blue-700">{t.full_name[0]}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-gray-700 truncate">{t.full_name}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-gray-400">
                        <BookOpen className="w-3 h-3 inline mr-0.5" />{t.questions_count} savol
                      </span>
                      {Array.isArray(t.subjects) && t.subjects.length > 0 && (
                        <span className="text-xs text-gray-400">· {t.subjects.slice(0, 2).join(', ')}</span>
                      )}
                    </div>
                  </div>
                  <RatingBadge rating={t.rating} />
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Class averages */}
      <div className="card">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2">
            <BarChart2 className="w-5 h-5 text-blue-600" />
            <h2 className="font-semibold text-gray-800">Sinflar o'rtacha baholari</h2>
          </div>

          <div className="ml-auto flex items-center gap-2 flex-wrap">
            <select
              value={year}
              onChange={e => setYear(Number(e.target.value))}
              className="text-sm border border-gray-200 rounded-lg px-2 py-1 outline-none"
            >
              {YEARS.map(y => <option key={y} value={y}>{y}-yil</option>)}
            </select>
            <div className="flex border border-gray-200 rounded-lg overflow-hidden">
              {QUARTERS.map(q => (
                <button
                  key={q}
                  onClick={() => setQuarter(q)}
                  className={`px-3 py-1 text-sm transition-colors ${quarter === q ? 'bg-blue-700 text-white' : 'text-gray-600 hover:bg-gray-50'}`}
                >
                  {q}-chorak
                </button>
              ))}
            </div>
          </div>
        </div>

        {cLoad ? (
          <div className="h-64 flex items-center justify-center">
            <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : !classChartData.length ? (
          <div className="text-center py-12 text-gray-400">
            <BarChart2 className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">Bu chorak uchun ma'lumot yo'q</p>
            <p className="text-xs mt-1">Nazorat ishi ballari kiritilsa, bu yerda ko'rinadi</p>
          </div>
        ) : (
          <>
            <div className="h-72">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={classChartData} margin={{ top: 4, right: 4, left: -20, bottom: 4 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                  <XAxis dataKey="class" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <YAxis domain={[0, 5]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} />
                  <Tooltip
                    contentStyle={{ borderRadius: 8, border: 'none', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.1)' }}
                    formatter={(v: number, name: string) => [v.toFixed(2), name]}
                  />
                  {subjectsArr.map((s, i) => (
                    <Bar key={s.name} dataKey={s.name} radius={[3, 3, 0, 0]} maxBarSize={30}
                      fill={SCORE_COLORS[i % SCORE_COLORS.length]} />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            </div>

            {/* Legend */}
            <div className="flex flex-wrap gap-2 mt-3">
              {subjectsArr.map((s, i) => (
                <span key={s.name} className="flex items-center gap-1 text-xs text-gray-600">
                  <span className="w-3 h-3 rounded-sm inline-block" style={{ background: SCORE_COLORS[i % SCORE_COLORS.length] }} />
                  {s.name}
                </span>
              ))}
            </div>

            {/* Table */}
            <div className="mt-4 overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100">
                    <th className="text-left py-2 text-xs font-medium text-gray-500">Sinf</th>
                    <th className="text-left py-2 text-xs font-medium text-gray-500">Fan</th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500">O'rt. ball</th>
                    <th className="text-right py-2 text-xs font-medium text-gray-500">O'quvchilar</th>
                  </tr>
                </thead>
                <tbody>
                  {classAvgs.map((row, i) => (
                    <tr key={i} className="border-b border-gray-50 hover:bg-gray-50">
                      <td className="py-2 font-medium text-gray-700">{row.class_name}</td>
                      <td className="py-2 text-gray-600">{row.subject_name}</td>
                      <td className="py-2 text-right">
                        <span className={`font-semibold ${Number(row.avg_score) >= 4 ? 'text-green-600' : Number(row.avg_score) >= 3 ? 'text-amber-600' : 'text-red-500'}`}>
                          {Number(row.avg_score).toFixed(2)}
                        </span>
                      </td>
                      <td className="py-2 text-right text-gray-500">{row.student_count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </>
        )}
      </div>

      {/* Top teachers podium */}
      {teachers.length >= 3 && (
        <div className="card">
          <div className="flex items-center gap-2 mb-5">
            <Star className="w-5 h-5 text-amber-500" />
            <h2 className="font-semibold text-gray-800">Top 3 o'qituvchi</h2>
          </div>
          <div className="flex items-end justify-center gap-4">
            {[teachers[1], teachers[0], teachers[2]].map((t, idx) => {
              const heights = ['h-24', 'h-32', 'h-20'];
              const medals = ['🥈', '🥇', '🥉'];
              const positions = [2, 1, 3];
              return (
                <div key={t.teacher_id} className="flex flex-col items-center gap-2 flex-1 max-w-[120px]">
                  <span className="text-2xl">{medals[idx]}</span>
                  <div className="w-12 h-12 rounded-full bg-blue-100 flex items-center justify-center overflow-hidden">
                    {t.photo_url
                      ? <img src={t.photo_url} alt={t.full_name} className="w-full h-full object-cover" />
                      : <span className="text-lg font-bold text-blue-700">{t.full_name[0]}</span>}
                  </div>
                  <p className="text-xs font-medium text-gray-700 text-center line-clamp-2">{t.full_name}</p>
                  <RatingBadge rating={t.rating} />
                  <div className={`w-full ${heights[idx]} rounded-t-lg flex items-end justify-center pb-2 text-white font-bold text-lg`}
                    style={{ background: idx === 1 ? '#f59e0b' : idx === 0 ? '#94a3b8' : '#cd7c32' }}>
                    {positions[idx]}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
