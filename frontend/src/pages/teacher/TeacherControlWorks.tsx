import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Trash2, X, Loader2, ClipboardList,
  ChevronRight, Save, Users, AlertCircle, Database,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../../api/client';
import { Subject } from '../../types';

// ── Types ──
interface ControlWork {
  id: number;
  subject_id: number;
  class_id: number | null;
  quarter: 1 | 2 | 3 | 4;
  year: number;
  work_date: string | null;
  title: string | null;
  subject_name: string;
  class_name: string | null;
  teacher_name: string;
  score_count: number;
  avg_score: number | null;
}

interface CWScore {
  id: number;
  student_name: string;
  score: number;
}

interface ClassItem {
  id: number;
  name: string;
  grade: number;
  letter: string;
}

const cwSchema = z.object({
  subject_id: z.coerce.number().int().positive('Fan tanlang'),
  class_id: z.coerce.number().int().positive().optional().or(z.literal('')),
  quarter: z.coerce.number().int().min(1).max(4) as z.ZodType<1 | 2 | 3 | 4>,
  year: z.coerce.number().int().min(2020).max(2050),
  work_date: z.string().optional(),
  title: z.string().max(200).optional(),
});
type CWForm = z.infer<typeof cwSchema>;

// ── Create Modal ──
function CreateModal({
  subjects, classes, onClose, onSaved,
}: {
  subjects: Subject[];
  classes: ClassItem[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<CWForm>({
    resolver: zodResolver(cwSchema),
    defaultValues: {
      quarter: 1,
      year: new Date().getFullYear(),
    },
  });

  const onSubmit = async (data: CWForm) => {
    await apiClient.post('/control-works', {
      ...data,
      class_id: data.class_id ? Number(data.class_id) : undefined,
    });
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">Yangi nazorat ishi</h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Sarlavha <span className="text-gray-400 font-normal">(ixtiyoriy)</span>
            </label>
            <input className="input" {...register('title')} placeholder="Masalan: 1-chorak yakuniy nazorat" />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fan <span className="text-red-500">*</span>
              </label>
              <select className="input" {...register('subject_id')}>
                <option value="">Tanlang</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
              {errors.subject_id && <p className="text-red-500 text-xs mt-1">{errors.subject_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sinf</label>
              <select className="input" {...register('class_id')}>
                <option value="">Tanlang</option>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Chorak <span className="text-red-500">*</span>
              </label>
              <select className="input" {...register('quarter')}>
                {[1, 2, 3, 4].map(q => <option key={q} value={q}>{q}-chorak</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Yil</label>
              <input type="number" className="input" {...register('year')} />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sana</label>
              <input type="date" className="input" {...register('work_date')} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Bekor</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda...</> : 'Yaratish'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ── Score Panel ──
function ScorePanel({ cw, onClose }: { cw: ControlWork; onClose: () => void }) {
  const qc = useQueryClient();
  const [scores, setScores] = useState<{ student_name: string; score: string }[]>([]);
  const [newName, setNewName] = useState('');
  const [newScore, setNewScore] = useState('');
  const [saved, setSaved] = useState(false);

  const { data: existing = [], isLoading } = useQuery<CWScore[]>({
    queryKey: ['cw-scores', cw.id],
    queryFn: () => apiClient.get(`/control-works/${cw.id}/scores`).then(r => r.data.data),
  });

  useEffect(() => {
    if (existing.length) {
      setScores(existing.map(s => ({ student_name: s.student_name, score: String(s.score) })));
    }
  }, [existing]);

  const addRow = () => {
    if (!newName.trim()) return;
    setScores(prev => [...prev, { student_name: newName.trim(), score: newScore || '5' }]);
    setNewName('');
    setNewScore('');
    setSaved(false);
  };

  const removeRow = (i: number) => {
    setScores(prev => prev.filter((_, idx) => idx !== i));
    setSaved(false);
  };

  const updateScore = (i: number, val: string) => {
    setScores(prev => prev.map((s, idx) => idx === i ? { ...s, score: val } : s));
    setSaved(false);
  };

  const saveMutation = useMutation({
    mutationFn: () => apiClient.post(`/control-works/${cw.id}/scores`, {
      scores: scores.map(s => ({
        student_name: s.student_name,
        score: Math.min(5, Math.max(0, Number(s.score) || 0)),
      })),
    }),
    onSuccess: () => {
      setSaved(true);
      qc.invalidateQueries({ queryKey: ['control-works'] });
    },
  });

  const avgScore = scores.length
    ? (scores.reduce((sum, s) => sum + (Number(s.score) || 0), 0) / scores.length).toFixed(2)
    : null;

  return (
    <div className="card border-2 border-blue-200">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="font-semibold text-gray-800">
            {cw.title || `${cw.subject_name} — ${cw.quarter}-chorak`}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {cw.class_name || 'Sinf belgilanmagan'} • {cw.year}-yil
          </p>
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
          <X className="w-4 h-4 text-gray-500" />
        </button>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="h-9 bg-gray-100 rounded" />)}
        </div>
      ) : (
        <>
          {/* Scores table */}
          {scores.length > 0 && (
            <div className="border border-gray-100 rounded-xl overflow-hidden mb-3">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left text-xs text-gray-500 px-3 py-2 font-medium">#</th>
                    <th className="text-left text-xs text-gray-500 px-3 py-2 font-medium">O'quvchi</th>
                    <th className="text-center text-xs text-gray-500 px-3 py-2 font-medium">Ball (0–5)</th>
                    <th className="w-8" />
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {scores.map((s, i) => (
                    <tr key={i} className="hover:bg-gray-50/50">
                      <td className="px-3 py-2 text-xs text-gray-400">{i + 1}</td>
                      <td className="px-3 py-2 text-sm font-medium text-gray-700">{s.student_name}</td>
                      <td className="px-3 py-2">
                        <input
                          type="number"
                          min="0" max="5" step="0.5"
                          value={s.score}
                          onChange={e => updateScore(i, e.target.value)}
                          className="w-16 mx-auto block text-center border border-gray-200 rounded-lg px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                        />
                      </td>
                      <td className="px-2 py-2">
                        <button onClick={() => removeRow(i)}
                          className="p-1 rounded hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {avgScore && (
                <div className="bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 border-t border-blue-100">
                  O'rtacha ball: {avgScore} • {scores.length} ta o'quvchi
                </div>
              )}
            </div>
          )}

          {/* Add row */}
          <div className="flex items-center gap-2 mb-3">
            <input className="input flex-1 text-sm" placeholder="O'quvchi ismi..."
              value={newName} onChange={e => setNewName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRow()} />
            <input type="number" min="0" max="5" step="0.5" placeholder="5"
              value={newScore} onChange={e => setNewScore(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && addRow()}
              className="w-16 text-center border border-gray-300 rounded-lg px-2 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
            <button onClick={addRow} className="p-2 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg transition-colors">
              <Plus className="w-4 h-4" />
            </button>
          </div>

          {scores.length === 0 && (
            <div className="text-center py-4 text-gray-400 text-sm">
              <Users className="w-8 h-8 mx-auto mb-1 opacity-30" />
              O'quvchi qo'shing
            </div>
          )}

          {/* Save */}
          <button
            className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={saveMutation.isPending || !scores.length}
            onClick={() => saveMutation.mutate()}
          >
            {saveMutation.isPending
              ? <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda...</>
              : saved
              ? <><Save className="w-4 h-4" />Saqlandi ✓</>
              : <><Save className="w-4 h-4" />Balllarni saqlash</>
            }
          </button>
        </>
      )}
    </div>
  );
}

// ── Main ──
export default function TeacherControlWorks() {
  const qc = useQueryClient();
  const [createOpen, setCreateOpen] = useState(false);
  const [selectedCW, setSelectedCW] = useState<ControlWork | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [quarter, setQuarter] = useState<number | ''>('');

  const { data: cws = [], isLoading } = useQuery<ControlWork[]>({
    queryKey: ['control-works', quarter],
    queryFn: () => apiClient.get('/control-works', {
      params: { quarter: quarter || undefined },
    }).then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['my-stats-subjects'],
    queryFn: () => apiClient.get('/analytics/my-stats').then(r => r.data.data.subjects ?? []),
  });

  const { data: allSubjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/questions/subjects?all=true').then(r => r.data.data),
  });

  const { data: classes = [] } = useQuery<ClassItem[]>({
    queryKey: ['classes'],
    queryFn: () => apiClient.get('/schedule/classes').then(r => r.data.data),
  });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/control-works/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['control-works'] });
      if (selectedCW?.id === deleteId) setSelectedCW(null);
      setDeleteId(null);
    },
  });

  const seedClasses = useMutation({
    mutationFn: () => apiClient.post('/schedule/classes/seed'),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['classes'] }),
  });

  const subjectsForForm = subjects.length ? subjects : allSubjects;

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Nazorat ishlari</h1>
          <p className="text-sm text-gray-500 mt-0.5">{cws.length} ta nazorat ishi</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="w-4 h-4" /> Yangi
        </button>
      </div>

      {/* Classes warning */}
      {classes.length === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
          <AlertCircle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
          <div className="flex-1">
            <p className="text-sm font-medium text-amber-800">Sinflar sozlanmagan</p>
            <p className="text-xs text-amber-700 mt-0.5">Standart sinflarni yaratish uchun tugmani bosing</p>
          </div>
          <button
            className="btn-secondary flex items-center gap-1.5 text-xs py-1.5 px-3 shrink-0"
            disabled={seedClasses.isPending}
            onClick={() => seedClasses.mutate()}
          >
            {seedClasses.isPending ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Database className="w-3.5 h-3.5" />}
            Sinflarni yaratish
          </button>
        </div>
      )}

      {/* Quarter filter */}
      <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl w-fit">
        {([['', 'Barchasi'], [1, '1-chorak'], [2, '2-chorak'], [3, '3-chorak'], [4, '4-chorak']] as const).map(([val, label]) => (
          <button key={String(val)} onClick={() => { setQuarter(val as any); setSelectedCW(null); }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
              quarter === val ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600'
            }`}>
            {label}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
        {/* CW List */}
        <div className="space-y-3">
          {isLoading ? (
            Array.from({ length: 4 }).map((_, i) => <div key={i} className="card animate-pulse h-20" />)
          ) : cws.length === 0 ? (
            <div className="card flex flex-col items-center py-14 text-gray-400">
              <ClipboardList className="w-12 h-12 mb-3 opacity-30" />
              <p className="text-gray-500">Nazorat ishlari yo'q</p>
              <p className="text-sm mt-1">Yangi tugmasini bosing</p>
            </div>
          ) : (
            cws.map(cw => (
              <div
                key={cw.id}
                className={`card cursor-pointer hover:shadow-md transition-all ${
                  selectedCW?.id === cw.id ? 'ring-2 ring-blue-500 ring-offset-1' : ''
                }`}
                onClick={() => setSelectedCW(prev => prev?.id === cw.id ? null : cw)}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="font-semibold text-gray-800 text-sm">
                        {cw.title || `${cw.subject_name}`}
                      </span>
                      <span className="badge badge-blue text-xs">{cw.quarter}-chorak</span>
                      <span className="text-xs text-gray-400">{cw.year}</span>
                    </div>
                    <div className="flex items-center gap-3 text-xs text-gray-500">
                      <span>{cw.subject_name}</span>
                      {cw.class_name && <span>• {cw.class_name}</span>}
                      <span>• {cw.score_count} o'quvchi</span>
                      {cw.avg_score && (
                        <span className={`font-medium ${
                          Number(cw.avg_score) >= 4 ? 'text-green-600' : Number(cw.avg_score) >= 3 ? 'text-amber-600' : 'text-red-500'
                        }`}>
                          ø {Number(cw.avg_score).toFixed(1)}
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1 shrink-0">
                    <ChevronRight className={`w-4 h-4 text-gray-300 transition-transform ${selectedCW?.id === cw.id ? 'rotate-90 text-blue-500' : ''}`} />
                    <button
                      onClick={e => { e.stopPropagation(); setDeleteId(cw.id); }}
                      className="p-1.5 rounded-lg hover:bg-red-50 text-gray-300 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Score panel */}
        {selectedCW && (
          <ScorePanel cw={selectedCW} onClose={() => setSelectedCW(null)} />
        )}
        {!selectedCW && cws.length > 0 && (
          <div className="card flex flex-col items-center justify-center text-gray-400 py-16 border-2 border-dashed border-gray-200">
            <ClipboardList className="w-10 h-10 mb-2 opacity-30" />
            <p className="text-sm">Nazorat ishini tanlang</p>
            <p className="text-xs mt-1">Balllarni kiritish uchun</p>
          </div>
        )}
      </div>

      {/* Modals */}
      {createOpen && (
        <CreateModal
          subjects={subjectsForForm}
          classes={classes}
          onClose={() => setCreateOpen(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['control-works'] })}
        />
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">O'chirasizmi?</h3>
            <p className="text-sm text-gray-500 mb-5">Barcha balllar ham o'chiriladi</p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setDeleteId(null)}>Bekor</button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteId)}
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                O'chirish
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
