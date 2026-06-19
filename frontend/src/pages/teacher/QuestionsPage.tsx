import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, X, Loader2,
  BookOpen, Search, AlertCircle, ChevronDown,
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../../api/client';
import { Question, Subject } from '../../types';

// ===== Schema =====
const schema = z.object({
  subject_id: z.coerce.number().positive('Fan tanlang'),
  grade_level: z.coerce.number().min(1).max(11).optional().or(z.literal('')),
  text: z.string().min(5, 'Savol kamida 5 belgi'),
  option_a: z.string().min(1, 'A variantini kiriting'),
  option_b: z.string().min(1, 'B variantini kiriting'),
  option_c: z.string().min(1, 'C variantini kiriting'),
  option_d: z.string().min(1, 'D variantini kiriting'),
  correct: z.enum(['A', 'B', 'C', 'D'], { required_error: 'To\'g\'ri javobni belgilang' }),
  difficulty: z.coerce.number().min(1).max(3).default(1),
});

type FormData = z.infer<typeof schema>;

const DIFFICULTY_LABELS: Record<number, string> = { 1: 'Oson', 2: "O'rta", 3: 'Qiyin' };
const DIFFICULTY_COLORS: Record<number, string> = {
  1: 'badge-green',
  2: 'badge-amber',
  3: 'badge-red',
};

// ===== Question Form Modal =====
interface ModalProps {
  initial?: Question | null;
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
}

function QuestionModal({ initial, subjects, onClose, onSaved }: ModalProps) {
  const { register, handleSubmit, watch, setValue, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: initial
      ? {
          subject_id: initial.subject_id,
          grade_level: initial.grade_level ?? '',
          text: initial.text,
          option_a: initial.option_a,
          option_b: initial.option_b,
          option_c: initial.option_c,
          option_d: initial.option_d,
          correct: initial.correct,
          difficulty: initial.difficulty,
        }
      : { difficulty: 1 },
  });

  const correct = watch('correct');

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      grade_level: data.grade_level === '' ? undefined : Number(data.grade_level),
    };
    if (initial) {
      await apiClient.put(`/questions/${initial.id}`, payload);
    } else {
      await apiClient.post('/questions', payload);
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {initial ? 'Savolni tahrirlash' : 'Yangi savol'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100 transition-colors">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Subject + Grade */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Fan <span className="text-red-500">*</span>
              </label>
              <select className="input" {...register('subject_id')}>
                <option value="">Tanlang</option>
                {subjects.map(s => (
                  <option key={s.id} value={s.id}>{s.name}</option>
                ))}
              </select>
              {errors.subject_id && <p className="text-red-500 text-xs mt-1">{errors.subject_id.message}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Sinf darajasi</label>
              <select className="input" {...register('grade_level')}>
                <option value="">Barchasi</option>
                {Array.from({ length: 11 }, (_, i) => i + 1).map(g => (
                  <option key={g} value={g}>{g}-sinf</option>
                ))}
              </select>
            </div>
          </div>

          {/* Question text */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Savol matni <span className="text-red-500">*</span>
            </label>
            <textarea
              className="input resize-none"
              rows={3}
              placeholder="Savol matnini kiriting..."
              {...register('text')}
            />
            {errors.text && <p className="text-red-500 text-xs mt-1">{errors.text.message}</p>}
          </div>

          {/* Options */}
          <div className="space-y-2.5">
            <label className="block text-sm font-medium text-gray-700">
              Javob variantlari <span className="text-red-500">*</span>
            </label>
            {(['a', 'b', 'c', 'd'] as const).map(opt => {
              const key = `option_${opt}` as keyof FormData;
              const letter = opt.toUpperCase() as 'A' | 'B' | 'C' | 'D';
              const isCorrect = correct === letter;
              return (
                <div key={opt} className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setValue('correct', letter)}
                    className={`w-8 h-8 rounded-lg text-sm font-bold shrink-0 transition-colors ${
                      isCorrect
                        ? 'bg-green-600 text-white'
                        : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                    }`}
                  >
                    {letter}
                  </button>
                  <input
                    className={`input flex-1 ${isCorrect ? 'border-green-300 bg-green-50' : ''}`}
                    placeholder={`${letter} varianti`}
                    {...register(key as any)}
                  />
                </div>
              );
            })}
            {errors.correct && <p className="text-red-500 text-xs">{errors.correct.message}</p>}
            {errors.option_a && <p className="text-red-500 text-xs">{errors.option_a.message}</p>}
          </div>

          {/* Difficulty */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Qiyinlik darajasi</label>
            <div className="flex gap-2">
              {[1, 2, 3].map(d => (
                <button
                  key={d}
                  type="button"
                  onClick={() => setValue('difficulty', d as 1 | 2 | 3)}
                  className={`flex-1 py-2 rounded-lg text-sm font-medium border-2 transition-colors ${
                    watch('difficulty') === d
                      ? d === 1 ? 'border-green-500 bg-green-50 text-green-700'
                        : d === 2 ? 'border-amber-500 bg-amber-50 text-amber-700'
                        : 'border-red-500 bg-red-50 text-red-700'
                      : 'border-gray-200 text-gray-500 hover:border-gray-300'
                  }`}
                >
                  {DIFFICULTY_LABELS[d]}
                </button>
              ))}
            </div>
          </div>

          {/* Submit */}
          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">
              Bekor qilish
            </button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" /> Saqlanmoqda...</> : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ===== Delete Confirm =====
function DeleteConfirm({ questionId, onClose, onDeleted }: { questionId: number; onClose: () => void; onDeleted: () => void }) {
  const [loading, setLoading] = useState(false);
  const handleDelete = async () => {
    setLoading(true);
    await apiClient.delete(`/questions/${questionId}`);
    onDeleted();
    onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-2">Savolni o'chirasizmi?</h3>
        <p className="text-sm text-gray-500 mb-5">Bu amalni qaytarib bo'lmaydi.</p>
        <div className="flex gap-3">
          <button className="btn-outline flex-1" onClick={onClose}>Bekor</button>
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
            onClick={handleDelete}
            disabled={loading}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

// ===== Main Page =====
export default function QuestionsPage() {
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editQuestion, setEditQuestion] = useState<Question | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [search, setSearch] = useState('');
  const [filterSubject, setFilterSubject] = useState<string>('');

  const { data: questions = [], isLoading } = useQuery<Question[]>({
    queryKey: ['questions-manage'],
    queryFn: () => apiClient.get('/questions/manage').then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/questions/subjects?all=true').then(r => r.data.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['questions-manage'] });

  const filtered = questions.filter(q => {
    const matchSearch = !search || q.text.toLowerCase().includes(search.toLowerCase());
    const matchSubject = !filterSubject || String(q.subject_id) === filterSubject;
    return matchSearch && matchSubject;
  });

  const openAdd = () => { setEditQuestion(null); setModalOpen(true); };
  const openEdit = (q: Question) => { setEditQuestion(q); setModalOpen(true); };

  return (
    <div className="space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Test savollari</h1>
          <p className="text-sm text-gray-500 mt-0.5">{questions.length} ta savol</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={openAdd}>
          <Plus className="w-4 h-4" />
          Yangi savol
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            className="input pl-9"
            placeholder="Savol matni bo'yicha qidirish..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
        <div className="relative">
          <select
            className="input pr-8 min-w-[160px]"
            value={filterSubject}
            onChange={e => setFilterSubject(e.target.value)}
          >
            <option value="">Barcha fanlar</option>
            {subjects.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
          <ChevronDown className="absolute right-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400 pointer-events-none" />
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-16" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center justify-center py-14 text-gray-400">
          <BookOpen className="w-12 h-12 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">
            {search || filterSubject ? 'Hech narsa topilmadi' : 'Hali savol yo\'q'}
          </p>
          <p className="text-sm mt-1">
            {!search && !filterSubject && '"Yangi savol" tugmasini bosing'}
          </p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 w-8">#</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Savol</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Fan</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Sinf</th>
                  <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Qiyinlik</th>
                  <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Amallar</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {filtered.map((q, i) => (
                  <tr key={q.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-4 py-3 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-3">
                      <p className="text-gray-800 font-medium line-clamp-2 max-w-xs">{q.text}</p>
                      <p className="text-xs text-gray-400 mt-0.5 sm:hidden">{q.subject_name}</p>
                    </td>
                    <td className="px-4 py-3 hidden sm:table-cell">
                      <span className="text-gray-600 text-xs">{q.subject_name}</span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className="text-gray-500 text-xs">
                        {q.grade_level ? `${q.grade_level}-sinf` : '—'}
                      </span>
                    </td>
                    <td className="px-4 py-3 hidden md:table-cell">
                      <span className={`badge ${DIFFICULTY_COLORS[q.difficulty]}`}>
                        {DIFFICULTY_LABELS[q.difficulty]}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => openEdit(q)}
                          className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Tahrirlash"
                        >
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => setDeleteId(q.id)}
                          className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                          title="O'chirish"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="px-4 py-3 border-t border-gray-100 text-xs text-gray-400">
            {filtered.length} ta savol ko'rsatilmoqda
          </div>
        </div>
      )}

      {/* Modals */}
      {modalOpen && (
        <QuestionModal
          initial={editQuestion}
          subjects={subjects}
          onClose={() => setModalOpen(false)}
          onSaved={refresh}
        />
      )}
      {deleteId !== null && (
        <DeleteConfirm
          questionId={deleteId}
          onClose={() => setDeleteId(null)}
          onDeleted={refresh}
        />
      )}
    </div>
  );
}
