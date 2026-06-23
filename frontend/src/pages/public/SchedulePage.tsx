import { useState, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Calendar, ChevronDown } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { Class, ScheduleEntry } from '../../types';

const LESSONS = [1, 2, 3, 4, 5, 6];

function getTimeForLesson(lessonNum: number, shift: 1 | 2): string {
  const times: Record<string, string> = {
    '1-1': '08:00', '1-2': '08:45', '1-3': '09:30', '1-4': '10:15', '1-5': '11:00', '1-6': '11:45',
    '2-1': '13:00', '2-2': '13:45', '2-3': '14:30', '2-4': '15:15', '2-5': '16:00', '2-6': '16:45',
  };
  return times[`${shift}-${lessonNum}`] || '';
}

export default function SchedulePage() {
  const { t } = useTranslation();
  const DAYS = t('public.schedule.days', { returnObjects: true }) as string[];
  const [selectedClass, setSelectedClass] = useState<number | null>(null);

  const { data: classes = [], isLoading: classLoad } = useQuery<Class[]>({
    queryKey: ['classes-public'],
    queryFn: () => apiClient.get('/classes').then(r => r.data.data),
  });

  const { data: schedule = [], isLoading: schedLoad } = useQuery<ScheduleEntry[]>({
    queryKey: ['schedule', selectedClass],
    queryFn: () => apiClient.get('/schedule', { params: { class_id: selectedClass } }).then(r => r.data.data),
    enabled: !!selectedClass,
  });

  // Sinflarni grade bo'yicha guruhlash
  const groupedClasses = useMemo(() => {
    const groups: Record<number, Class[]> = {};
    classes.forEach(c => {
      if (!groups[c.grade]) groups[c.grade] = [];
      groups[c.grade].push(c);
    });
    return groups;
  }, [classes]);

  // Jadval map: { day -> { lesson_num -> ScheduleEntry } }
  const scheduleMap = useMemo(() => {
    const map: Record<number, Record<number, ScheduleEntry>> = {};
    schedule.forEach(e => {
      if (!map[e.day_of_week]) map[e.day_of_week] = {};
      map[e.day_of_week][e.lesson_num] = e;
    });
    return map;
  }, [schedule]);

  const selectedClassObj = classes.find(c => c.id === selectedClass);

  // Hozirgi dars (soat bo'yicha)
  const now = new Date();
  const todayDay = now.getDay(); // 0=Yakshanba, 1=Dushanba...
  const currentHour = now.getHours() * 60 + now.getMinutes();

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('public.schedule.title')}</h1>
        <p className="text-gray-500">{t('public.schedule.subtitle')}</p>
      </motion.div>

      {/* Class selector */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        {classLoad ? (
          <div className="h-12 bg-gray-100 rounded-xl animate-pulse" />
        ) : (
          <div className="relative">
            <select
              value={selectedClass ?? ''}
              onChange={e => setSelectedClass(e.target.value ? Number(e.target.value) : null)}
              className="input w-full sm:w-64 appearance-none pr-10"
            >
              <option value="">{t('public.schedule.selectPlaceholder')}</option>
              {Object.entries(groupedClasses).sort(([a], [b]) => Number(a) - Number(b)).map(([grade, cls]) => (
                <optgroup key={grade} label={t('public.schedule.gradeGroup', { grade })}>
                  {cls.map(c => (
                    <option key={c.id} value={c.id}>
                      {t('public.schedule.classOption', { name: c.name, shift: c.shift, count: c.student_count })}
                    </option>
                  ))}
                </optgroup>
              ))}
            </select>
            <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
          </div>
        )}
      </motion.div>

      {!selectedClass ? (
        <div className="text-center py-16 text-gray-400">
          <Calendar className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('public.schedule.selectPrompt')}</p>
        </div>
      ) : schedLoad ? (
        <div className="overflow-x-auto">
          <div className="min-w-[700px] animate-pulse">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-14 bg-gray-100 rounded-xl mb-2" />
            ))}
          </div>
        </div>
      ) : (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
          {/* Smena belgisi */}
          <div className="flex items-center gap-3 mb-4">
            <span className="badge badge-blue">
              {t('public.schedule.shiftBadge', { shift: selectedClassObj?.shift })}
            </span>
            <span className="text-sm text-gray-500">{selectedClassObj?.name} {t('public.schedule.classSuffix')}</span>
            {selectedClassObj && (
              <span className="text-xs text-gray-400">
                {selectedClassObj.shift === 1 ? t('public.schedule.shift1Time') : t('public.schedule.shift2Time')}
              </span>
            )}
          </div>

          {!schedule.length ? (
            <div className="card text-center py-12 text-gray-400">
              <Calendar className="w-10 h-10 mx-auto mb-2 opacity-30" />
              <p>{t('public.schedule.noSchedule')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full min-w-[700px] text-sm">
                <thead>
                  <tr className="bg-blue-900 text-white">
                    <th className="px-3 py-3 text-left font-medium text-xs w-16">{t('public.schedule.tableLesson')}</th>
                    <th className="px-3 py-3 text-left font-medium text-xs w-16">{t('public.schedule.tableTime')}</th>
                    {DAYS.map((d, idx) => (
                      <th key={d} className={`px-3 py-3 text-left font-medium text-xs ${
                        todayDay === idx + 1 ? 'bg-blue-700' : ''
                      }`}>
                        {d}
                        {todayDay === idx + 1 && (
                          <span className="ml-1 text-blue-300 text-[10px]">• {t('public.schedule.today')}</span>
                        )}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {LESSONS.map(lessonNum => {
                    const shift = (selectedClassObj?.shift ?? 1) as 1 | 2;
                    const timeStr = getTimeForLesson(lessonNum, shift);
                    return (
                      <tr key={lessonNum} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2.5 font-medium text-gray-700">{lessonNum}</td>
                        <td className="px-3 py-2.5 text-gray-400 text-xs">{timeStr}</td>
                        {[1, 2, 3, 4, 5, 6].map(day => {
                          const entry = scheduleMap[day]?.[lessonNum];
                          const isNow = todayDay === day && entry &&
                            (() => {
                              const [h, m] = timeStr.split(':').map(Number);
                              const start = h * 60 + m;
                              return currentHour >= start && currentHour < start + 45;
                            })();
                          return (
                            <td key={day} className={`px-3 py-2.5 ${isNow ? 'bg-green-50' : ''}`}>
                              {entry ? (
                                <div>
                                  <p className={`font-medium text-xs ${isNow ? 'text-green-700' : 'text-gray-800'}`}>
                                    {entry.subject_name}
                                  </p>
                                  <p className="text-[11px] text-gray-400">{entry.teacher_name}</p>
                                  {entry.room && (
                                    <p className="text-[10px] text-gray-300">{entry.room}{t('public.schedule.roomSuffix')}</p>
                                  )}
                                </div>
                              ) : (
                                <span className="text-gray-200">—</span>
                              )}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}
