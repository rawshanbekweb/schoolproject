import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { X, Loader2, Trash2, CalendarDays, Plus, School, ChevronRight } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';

// ───── Types ─────
interface ClassItem   { id: number; name: string; grade: number; letter: string; shift: 1 | 2; student_count: number }
interface SubjectItem { id: number; name: string; icon: string | null }
interface TeacherItem { id: number; full_name: string }
interface ScheduleRow {
  id: number; class_id: number; subject_id: number; teacher_id: number | null;
  day_of_week: number; lesson_num: number; shift: 1 | 2; room: string | null;
  subject_name: string; teacher_name: string | null;
}

const LESSONS = [1, 2, 3, 4, 5, 6, 7, 8];
const GRADES  = Array.from({ length: 11 }, (_, i) => i + 1);
// O'zbek tilidagi harflar
const UZ_LETTERS = ['A', 'B', 'V', 'G', 'D', 'E', 'J', 'Z', 'I', 'Y', 'K', 'L', 'M', 'N', 'O', 'P', 'Q', 'R', 'S', 'T', 'U', 'F', 'X'];

// ════════════════════════════════════════
//  TAB 1 — SINFLAR BOSHQARUVI
// ════════════════════════════════════════
function ClassesTab({ classes, onRefresh }: { classes: ClassItem[]; onRefresh: () => void }) {
  const { t } = useTranslation();
  const [grade, setGrade]   = useState(1);
  const [letter, setLetter] = useState('');
  const [shift, setShift]   = useState<1 | 2>(1);
  const [adding, setAdding] = useState(false);

  // Bulk seed state
  const [bulkLetters, setBulkLetters]         = useState('A,B');
  const [bulkGrades, setBulkGrades]           = useState<number[]>(GRADES);
  const [bulkAutoShift, setBulkAutoShift]     = useState(true);
  const [bulkShift, setBulkShift]             = useState<1 | 2>(1);
  const [bulkLoading, setBulkLoading]         = useState(false);
  const [bulkResult, setBulkResult]           = useState<string | null>(null);
  const [showBulk, setShowBulk]               = useState(false);

  // Single class add
  const addOne = async () => {
    if (!letter.trim()) return;
    setAdding(true);
    try {
      const name = `${grade}-${letter.toUpperCase()}`;
      await apiClient.post('/schedule/classes', { name, grade, letter: letter.toUpperCase(), shift });
      setLetter('');
      onRefresh();
    } catch (e: any) {
      alert(e?.response?.data?.message || t('admin.schedule.genericError'));
    } finally { setAdding(false); }
  };

  // Bulk create
  const bulkCreate = async () => {
    const letters = bulkLetters.split(',').map(l => l.trim().toUpperCase()).filter(Boolean);
    if (!letters.length || !bulkGrades.length) return;
    setBulkLoading(true);
    setBulkResult(null);
    let created = 0, skipped = 0;
    for (const g of bulkGrades.sort((a, b) => a - b)) {
      const s: 1 | 2 = bulkAutoShift ? (g <= 5 ? 1 : 2) : bulkShift;
      for (const l of letters) {
        const name = `${g}-${l}`;
        try {
          await apiClient.post('/schedule/classes', { name, grade: g, letter: l, shift: s, student_count: 0 });
          created++;
        } catch { skipped++; }
      }
    }
    setBulkResult(`✅ ${t('admin.schedule.bulkResultMsg', { created })}${skipped ? t('admin.schedule.bulkResultSkipped', { skipped }) : ''}`);
    setBulkLoading(false);
    onRefresh();
  };

  const deleteClass = async (id: number, name: string) => {
    if (!confirm(t('admin.schedule.deleteClassConfirm', { name }))) return;
    try {
      await apiClient.delete(`/schedule/classes/${id}`);
      onRefresh();
    } catch (e: any) {
      alert(e?.response?.data?.message || t('admin.schedule.deleteClassFailed'));
    }
  };

  const byGrade = classes.reduce<Record<number, ClassItem[]>>((acc, c) => {
    (acc[c.grade] ??= []).push(c);
    return acc;
  }, {});

  const toggleGrade = (g: number) =>
    setBulkGrades(prev => prev.includes(g) ? prev.filter(x => x !== g) : [...prev, g]);

  return (
    <div className="space-y-5">
      {/* Bulk create */}
      <div className="card">
        <button
          className="flex items-center justify-between w-full text-left"
          onClick={() => setShowBulk(v => !v)}
        >
          <div className="flex items-center gap-2">
            <Plus className="w-4 h-4 text-blue-700" />
            <span className="font-semibold text-gray-800">{t('admin.schedule.bulkCreateToggle')}</span>
          </div>
          <ChevronRight className={`w-4 h-4 text-gray-400 transition-transform ${showBulk ? 'rotate-90' : ''}`} />
        </button>

        {showBulk && (
          <div className="mt-4 space-y-4 border-t border-gray-100 pt-4">
            {/* Grade selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('admin.schedule.gradesLabel')}</p>
              <div className="flex flex-wrap gap-1.5">
                <button
                  type="button"
                  onClick={() => setBulkGrades(bulkGrades.length === 11 ? [] : GRADES)}
                  className="px-2.5 py-1 rounded-lg text-xs border-2 font-medium transition-colors border-gray-300 text-gray-600 hover:border-blue-400"
                >
                  {bulkGrades.length === 11 ? t('admin.schedule.deselectAll') : t('admin.schedule.selectAll')}
                </button>
                {GRADES.map(g => (
                  <button
                    key={g}
                    type="button"
                    onClick={() => toggleGrade(g)}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold border-2 transition-colors ${
                      bulkGrades.includes(g)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            {/* Letter selection */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('admin.schedule.lettersLabel')}</p>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {UZ_LETTERS.slice(0, 10).map(l => (
                  <button
                    key={l}
                    type="button"
                    onClick={() => {
                      const cur = bulkLetters.split(',').map(x => x.trim().toUpperCase()).filter(Boolean);
                      const next = cur.includes(l) ? cur.filter(x => x !== l) : [...cur, l];
                      setBulkLetters(next.join(','));
                    }}
                    className={`w-9 h-9 rounded-lg text-xs font-semibold border-2 transition-colors ${
                      bulkLetters.toUpperCase().split(',').map(x => x.trim()).includes(l)
                        ? 'border-blue-600 bg-blue-50 text-blue-700'
                        : 'border-gray-200 text-gray-500 hover:border-gray-300'
                    }`}
                  >
                    {l}
                  </button>
                ))}
              </div>
              <input
                className="input text-sm"
                placeholder={t('admin.schedule.lettersPlaceholder')}
                value={bulkLetters}
                onChange={e => setBulkLetters(e.target.value)}
              />
            </div>

            {/* Shift */}
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">{t('admin.schedule.shiftLabel')}</p>
              <div className="flex gap-3">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={bulkAutoShift} onChange={() => setBulkAutoShift(true)} />
                  <span className="text-sm text-gray-700">{t('admin.schedule.autoShiftLabel')}</span>
                </label>
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="radio" checked={!bulkAutoShift} onChange={() => setBulkAutoShift(false)} />
                  <span className="text-sm text-gray-700">{t('admin.schedule.manualShiftLabel')}</span>
                </label>
                {!bulkAutoShift && (
                  <select className="input text-sm py-1 w-28" value={bulkShift} onChange={e => setBulkShift(Number(e.target.value) as 1 | 2)}>
                    <option value={1}>{t('public.home.schedule.shift1')}</option>
                    <option value={2}>{t('public.home.schedule.shift2')}</option>
                  </select>
                )}
              </div>
            </div>

            {/* Preview */}
            {bulkGrades.length > 0 && bulkLetters.trim() && (
              <div className="bg-blue-50 rounded-xl px-4 py-3 text-sm text-blue-800">
                <strong>{t('admin.schedule.previewWillCreate')}</strong>{' '}
                {bulkGrades.sort((a,b)=>a-b).map(g =>
                  bulkLetters.split(',').map(l => l.trim().toUpperCase()).filter(Boolean).map(l => `${g}-${l}`).join(', ')
                ).join(', ')}
                {' '}— {t('admin.schedule.previewTotal')}{' '}
                <strong>
                  {t('admin.schedule.previewClassCount', { count: bulkGrades.length * bulkLetters.split(',').filter(l => l.trim()).length })}
                </strong>
              </div>
            )}

            {bulkResult && (
              <div className="bg-green-50 text-green-700 rounded-xl px-4 py-3 text-sm font-medium">
                {bulkResult}
              </div>
            )}

            <button
              onClick={bulkCreate}
              disabled={bulkLoading || !bulkGrades.length || !bulkLetters.trim()}
              className="btn-primary flex items-center gap-2 disabled:opacity-50"
            >
              {bulkLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
              {bulkLoading ? t('admin.schedule.creating') : t('admin.schedule.createClasses')}
            </button>
          </div>
        )}
      </div>

      {/* Single add */}
      <div className="card">
        <p className="font-semibold text-gray-800 mb-3 text-sm">{t('admin.schedule.singleAddTitle')}</p>
        <div className="flex flex-wrap items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.schedule.gradeLabel')}</label>
            <select className="input text-sm py-2" value={grade} onChange={e => setGrade(Number(e.target.value))}>
              {GRADES.map(g => <option key={g} value={g}>{g}{t('public.achievements.gradeSuffix')}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.schedule.letterLabel')}</label>
            <input
              className="input text-sm py-2 w-20 uppercase"
              placeholder="A"
              maxLength={2}
              value={letter}
              onChange={e => setLetter(e.target.value)}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.schedule.shiftLabel')}</label>
            <select className="input text-sm py-2" value={shift} onChange={e => setShift(Number(e.target.value) as 1|2)}>
              <option value={1}>{t('public.home.schedule.shift1')}</option>
              <option value={2}>{t('public.home.schedule.shift2')}</option>
            </select>
          </div>
          <button
            onClick={addOne}
            disabled={adding || !letter.trim()}
            className="btn-primary py-2 px-4 flex items-center gap-2 disabled:opacity-50"
          >
            {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('admin.schedule.add')}
          </button>
        </div>
        {letter && (
          <p className="mt-2 text-xs text-gray-400">
            {t('admin.schedule.willCreate')} <strong>{grade}-{letter.toUpperCase()}</strong> ({shift === 1 ? t('public.home.schedule.shift1') : t('public.home.schedule.shift2')})
          </p>
        )}
      </div>

      {/* Classes list */}
      <div className="card p-0 overflow-hidden">
        <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <School className="w-4 h-4 text-blue-700" />
            <h3 className="font-semibold text-gray-800">{t('admin.schedule.existingClassesTitle')}</h3>
          </div>
          <span className="text-sm text-gray-400">{t('admin.schedule.countSuffix', { count: classes.length })}</span>
        </div>

        {classes.length === 0 ? (
          <div className="py-12 text-center text-gray-400">
            <School className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('admin.schedule.noClasses')}</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-50">
            {Object.entries(
              classes.reduce<Record<number, ClassItem[]>>((acc, c) => { (acc[c.grade]??=[]).push(c); return acc; }, {})
            ).sort(([a],[b]) => Number(a)-Number(b)).map(([g, list]) => (
              <div key={g} className="px-5 py-3 flex items-center gap-3">
                <span className="text-xs font-bold text-gray-400 w-14 shrink-0">{g}{t('public.achievements.gradeSuffix')}</span>
                <div className="flex flex-wrap gap-2 flex-1">
                  {list.map(c => (
                    <div key={c.id} className="flex items-center gap-1 bg-gray-50 rounded-lg px-3 py-1.5 text-sm">
                      <span className="font-medium text-gray-700">{c.name}</span>
                      <span className="text-xs text-gray-400">({c.shift}-sm)</span>
                      <button
                        onClick={() => deleteClass(c.id, c.name)}
                        className="ml-1 text-gray-300 hover:text-red-500 transition-colors"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  CELL MODAL
// ════════════════════════════════════════
function CellModal({
  classId, shift, dayOfWeek, lessonNum, existing, subjects, teachers, onClose, onSaved,
}: {
  classId: number; shift: 1 | 2; dayOfWeek: number; lessonNum: number;
  existing: ScheduleRow | null;
  subjects: SubjectItem[]; teachers: TeacherItem[];
  onClose: () => void; onSaved: () => void;
}) {
  const { t } = useTranslation();
  const DAYS = t('public.schedule.days', { returnObjects: true }) as string[];
  const [subjectId, setSubjectId] = useState(existing?.subject_id ?? 0);
  const [teacherId, setTeacherId] = useState<number | ''>(existing?.teacher_id ?? '');
  const [room, setRoom]           = useState(existing?.room ?? '');
  const [loading, setLoading]     = useState(false);

  const save = async () => {
    if (!subjectId) return;
    setLoading(true);
    try {
      await apiClient.post('/schedule', {
        class_id: classId, subject_id: subjectId,
        teacher_id: teacherId || null,
        day_of_week: dayOfWeek, lesson_num: lessonNum,
        shift, room: room || null,
      });
      onSaved(); onClose();
    } finally { setLoading(false); }
  };

  const remove = async () => {
    if (!existing) return;
    setLoading(true);
    try {
      await apiClient.delete(`/schedule/${existing.id}`);
      onSaved(); onClose();
    } finally { setLoading(false); }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800 text-sm">
            {DAYS[dayOfWeek - 1]} • {t('public.home.schedule.lesson', { num: lessonNum })}
          </h3>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-4 h-4 text-gray-500" />
          </button>
        </div>

        <div className="p-5 space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.schedule.subjectLabel')}</label>
            <select className="input text-sm" value={subjectId} onChange={e => setSubjectId(Number(e.target.value))}>
              <option value={0}>{t('admin.schedule.selectPlaceholder')}</option>
              {subjects.map(s => <option key={s.id} value={s.id}>{s.icon} {s.name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.schedule.teacherLabel')}</label>
            <select className="input text-sm" value={teacherId} onChange={e => setTeacherId(e.target.value ? Number(e.target.value) : '')}>
              <option value="">{t('admin.schedule.noTeacherPlaceholder')}</option>
              {teachers.map(teacher => <option key={teacher.id} value={teacher.id}>{teacher.full_name}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">{t('admin.schedule.roomLabel')}</label>
            <input className="input text-sm" placeholder={t('admin.schedule.roomPlaceholder')} value={room} onChange={e => setRoom(e.target.value)} />
          </div>
        </div>

        <div className="flex gap-2 p-5 pt-0">
          {existing && (
            <button onClick={remove} disabled={loading}
              className="p-2.5 rounded-xl border border-red-200 text-red-500 hover:bg-red-50 transition-colors">
              <Trash2 className="w-4 h-4" />
            </button>
          )}
          <button onClick={onClose} className="btn-outline flex-1 text-sm py-2">{t('common.cancel')}</button>
          <button onClick={save} disabled={!subjectId || loading}
            className="btn-primary flex-1 text-sm py-2 flex items-center justify-center gap-1.5 disabled:opacity-50">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  );
}

// ════════════════════════════════════════
//  TAB 2 — JADVAL
// ════════════════════════════════════════
function ScheduleTab({ classes, subjects, teachers }: {
  classes: ClassItem[]; subjects: SubjectItem[]; teachers: TeacherItem[];
}) {
  const { t } = useTranslation();
  const DAYS = t('public.schedule.days', { returnObjects: true }) as string[];
  const qc = useQueryClient();
  const [classId, setClassId] = useState<number>(0);
  const [modal, setModal]     = useState<{ day: number; lesson: number } | null>(null);
  const [gradeFilter, setGradeFilter] = useState<number | null>(null);

  const { data: schedule = [], isLoading } = useQuery<ScheduleRow[]>({
    queryKey: ['schedule-manage', classId],
    queryFn: () => classId
      ? apiClient.get('/schedule', { params: { class_id: classId } }).then(r => r.data.data)
      : Promise.resolve([]),
    enabled: classId > 0,
  });

  const clearAll = useMutation({
    mutationFn: () => apiClient.delete(`/schedule/class/${classId}`),
    onSuccess:  () => qc.invalidateQueries({ queryKey: ['schedule-manage', classId] }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['schedule-manage', classId] });

  const cellMap = new Map<string, ScheduleRow>();
  schedule.forEach(r => cellMap.set(`${r.day_of_week}-${r.lesson_num}`, r));

  const selectedClass = classes.find(c => c.id === classId);
  const modalRow = modal ? (cellMap.get(`${modal.day}-${modal.lesson}`) ?? null) : null;

  const grades = [...new Set(classes.map(c => c.grade))].sort((a,b) => a-b);
  const filteredClasses = gradeFilter ? classes.filter(c => c.grade === gradeFilter) : classes;

  return (
    <div className="space-y-5">
      {/* Class selector */}
      <div className="card">
        <p className="text-sm font-medium text-gray-700 mb-3">{t('admin.schedule.selectClassLabel')}</p>

        {/* Grade filter */}
        <div className="flex flex-wrap gap-1.5 mb-3">
          <button
            onClick={() => setGradeFilter(null)}
            className={`px-3 py-1 rounded-lg text-xs font-medium border-2 transition-colors ${
              gradeFilter === null ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
            }`}
          >
            {t('common.all')}
          </button>
          {grades.map(g => (
            <button
              key={g}
              onClick={() => setGradeFilter(g === gradeFilter ? null : g)}
              className={`px-3 py-1 rounded-lg text-xs font-medium border-2 transition-colors ${
                gradeFilter === g ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-500'
              }`}
            >
              {g}{t('public.achievements.gradeSuffix')}
            </button>
          ))}
        </div>

        {classes.length === 0 ? (
          <p className="text-sm text-gray-400">{t('admin.schedule.noClassesHint')}</p>
        ) : (
          <div className="flex flex-wrap gap-2">
            {filteredClasses.map(c => (
              <button
                key={c.id}
                onClick={() => setClassId(c.id)}
                className={`px-3 py-1.5 rounded-xl border-2 text-sm font-medium transition-colors ${
                  classId === c.id
                    ? 'border-blue-600 bg-blue-50 text-blue-700'
                    : 'border-gray-200 text-gray-600 hover:border-gray-300'
                }`}
              >
                {c.name}
                <span className="ml-1 text-xs opacity-50">{c.shift}s</span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Schedule grid */}
      {classId > 0 && (
        <div className="card p-0 overflow-hidden">
          <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
            <div className="flex items-center gap-2">
              <CalendarDays className="w-4 h-4 text-blue-700" />
              <h2 className="font-semibold text-gray-800">
                {t('admin.schedule.scheduleTitle', { name: selectedClass?.name })}
                <span className="ml-2 text-xs text-gray-400 font-normal">({selectedClass?.shift === 1 ? t('public.home.schedule.shift1') : t('public.home.schedule.shift2')})</span>
              </h2>
            </div>
            <div className="flex items-center gap-2">
              {isLoading && <Loader2 className="w-4 h-4 animate-spin text-gray-400" />}
              {schedule.length > 0 && (
                <button
                  onClick={() => { if (confirm(t('admin.schedule.clearConfirm'))) clearAll.mutate(); }}
                  disabled={clearAll.isPending}
                  className="text-xs text-red-500 hover:text-red-700 flex items-center gap-1 px-2 py-1 rounded-lg hover:bg-red-50 transition-colors"
                >
                  <Trash2 className="w-3 h-3" /> {t('admin.schedule.clearSchedule')}
                </button>
              )}
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-sm min-w-[680px]">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-center px-3 py-3 text-xs font-semibold text-gray-400 w-12">#</th>
                  {DAYS.map(d => (
                    <th key={d} className="text-center px-2 py-3 text-xs font-semibold text-gray-500">{d}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {LESSONS.map(lesson => (
                  <tr key={lesson} className="hover:bg-gray-50/40">
                    <td className="text-center py-2 text-xs font-bold text-gray-300">{lesson}</td>
                    {DAYS.map((_, di) => {
                      const day  = di + 1;
                      const cell = cellMap.get(`${day}-${lesson}`);
                      return (
                        <td key={day} className="px-1.5 py-1.5">
                          <button
                            onClick={() => setModal({ day, lesson })}
                            className={`w-full min-h-[52px] rounded-xl border-2 transition-all text-left px-2 py-1.5 ${
                              cell
                                ? 'border-blue-100 bg-blue-50 hover:border-blue-300'
                                : 'border-dashed border-gray-200 hover:border-blue-200 hover:bg-blue-50/30'
                            }`}
                          >
                            {cell ? (
                              <>
                                <p className="text-xs font-semibold text-blue-800 leading-tight truncate">{cell.subject_name}</p>
                                {cell.teacher_name && <p className="text-xs text-gray-500 mt-0.5 truncate">{cell.teacher_name}</p>}
                                {cell.room && <p className="text-xs text-gray-400 truncate">{cell.room}</p>}
                              </>
                            ) : (
                              <span className="text-xs text-gray-300">+</span>
                            )}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-5 py-3 border-t border-gray-50 flex gap-4 text-xs text-gray-400">
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-2 border-blue-100 bg-blue-50 inline-block" />{t('admin.schedule.legendFilled')}
            </span>
            <span className="flex items-center gap-1.5">
              <span className="w-3 h-3 rounded border-dashed border-2 border-gray-200 inline-block" />{t('admin.schedule.legendEmpty')}
            </span>
          </div>
        </div>
      )}

      {!classId && (
        <div className="card flex flex-col items-center py-14 text-gray-400">
          <CalendarDays className="w-10 h-10 mb-3 opacity-25" />
          <p className="text-gray-500 font-medium">{t('admin.schedule.noClassSelected')}</p>
          <p className="text-sm mt-1">{t('admin.schedule.noClassSelectedHint')}</p>
        </div>
      )}

      {modal && (
        <CellModal
          classId={classId} shift={selectedClass?.shift ?? 1}
          dayOfWeek={modal.day} lessonNum={modal.lesson}
          existing={modalRow} subjects={subjects} teachers={teachers}
          onClose={() => setModal(null)} onSaved={refresh}
        />
      )}
    </div>
  );
}

// ════════════════════════════════════════
//  MAIN PAGE
// ════════════════════════════════════════
export default function ScheduleManagePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'classes' | 'schedule'>('classes');
  const qc = useQueryClient();

  const { data: classes = [], refetch: refetchClasses } = useQuery<ClassItem[]>({
    queryKey: ['schedule-classes'],
    queryFn: () => apiClient.get('/schedule/classes').then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<SubjectItem[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/subjects').then(r => r.data.data),
  });

  const { data: teachers = [] } = useQuery<TeacherItem[]>({
    queryKey: ['teachers-list'],
    queryFn: () => apiClient.get('/users').then(r =>
      (r.data.data as any[]).filter((u: any) => u.role === 'teacher' && u.is_active)
    ),
  });

  const onRefreshClasses = () => {
    refetchClasses();
    qc.invalidateQueries({ queryKey: ['schedule-classes'] });
  };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.schedule.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">
          {t('admin.schedule.classCountSuffix', { count: classes.length })}
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 bg-gray-100 p-1 rounded-xl w-fit">
        {([
          { key: 'classes',  labelKey: 'admin.schedule.tabClasses', icon: School },
          { key: 'schedule', labelKey: 'admin.schedule.tabSchedule', icon: CalendarDays },
        ] as const).map(tabItem => {
          const Icon = tabItem.icon;
          return (
            <button
              key={tabItem.key}
              onClick={() => setTab(tabItem.key)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                tab === tabItem.key ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600 hover:text-gray-800'
              }`}
            >
              <Icon className="w-4 h-4" />
              {t(tabItem.labelKey)}
            </button>
          );
        })}
      </div>

      {tab === 'classes'  && <ClassesTab classes={classes} onRefresh={onRefreshClasses} />}
      {tab === 'schedule' && <ScheduleTab classes={classes} subjects={subjects} teachers={teachers} />}
    </div>
  );
}
