import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, GraduationCap, Loader2, X } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { Subject } from '../../types';

interface OtmMajorSubject {
  id: number;
  subject_id: number;
  subject_name: string;
  weight: number;
}

interface OtmMajorCutoff {
  id: number;
  year: number;
  cutoff_score: number;
  max_possible_score: number;
}

interface OtmMajor {
  id: number;
  university_name: string;
  major_name: string;
  is_active: boolean;
  subjects: OtmMajorSubject[];
  cutoffs: OtmMajorCutoff[];
}

interface MajorForm {
  university_name: string;
  major_name: string;
}

const emptyForm: MajorForm = { university_name: '', major_name: '' };

function MajorModal({ major, onClose }: { major?: OtmMajor | null; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<MajorForm>({
    university_name: major?.university_name ?? '',
    major_name: major?.major_name ?? '',
  });
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: (data: MajorForm) =>
      major ? apiClient.put(`/otm-tavsiya/majors/${major.id}`, data) : apiClient.post('/otm-tavsiya/majors', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['otm-majors-all'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || t('admin.otmMajors.genericError')),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">
            {major ? t('admin.otmMajors.editTitle') : t('admin.otmMajors.createTitle')}
          </h3>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('admin.otmMajors.universityLabel')}</label>
            <input
              className="input w-full"
              placeholder={t('admin.otmMajors.universityPlaceholder')}
              value={form.university_name}
              onChange={e => setForm(p => ({ ...p, university_name: e.target.value }))}
            />
          </div>
          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('admin.otmMajors.majorNameLabel')}</label>
            <input
              className="input w-full"
              placeholder={t('admin.otmMajors.majorNamePlaceholder')}
              value={form.major_name}
              onChange={e => setForm(p => ({ ...p, major_name: e.target.value }))}
            />
          </div>
        </div>
        <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button
            onClick={() => save.mutate(form)}
            disabled={save.isPending || !form.university_name.trim() || !form.major_name.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {major ? t('common.save') : t('admin.otmMajors.add')}
          </button>
        </div>
      </div>
    </div>
  );
}

function SubjectsPanel({ major, subjects }: { major: OtmMajor; subjects: Subject[] }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [subjectId, setSubjectId] = useState('');
  const [weight, setWeight] = useState('1');

  const linked = new Set(major.subjects.map(s => s.subject_id));
  const available = subjects.filter(s => !linked.has(s.id));

  const invalidate = () => qc.invalidateQueries({ queryKey: ['otm-majors-all'] });

  const addSubject = useMutation({
    mutationFn: () => apiClient.post(`/otm-tavsiya/majors/${major.id}/subjects`, {
      subject_id: Number(subjectId), weight: Number(weight) || 1,
    }),
    onSuccess: () => { invalidate(); setSubjectId(''); setWeight('1'); },
  });

  const removeSubject = useMutation({
    mutationFn: (subjectId: number) => apiClient.delete(`/otm-tavsiya/majors/${major.id}/subjects/${subjectId}`),
    onSuccess: invalidate,
  });

  return (
    <div>
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        {t('admin.otmMajors.subjectsSectionTitle')}
      </p>
      {major.subjects.length === 0 ? (
        <p className="text-sm text-gray-400 mb-3">{t('admin.otmMajors.noSubjects')}</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {major.subjects.map(s => (
            <span key={s.id} className="flex items-center gap-1.5 bg-blue-50 text-blue-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {s.subject_name} ({s.weight}x)
              <button onClick={() => removeSubject.mutate(s.subject_id)} className="hover:text-blue-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      {available.length > 0 && (
        <div className="flex gap-2 items-end">
          <select className="input flex-1" value={subjectId} onChange={e => setSubjectId(e.target.value)}>
            <option value="">{t('admin.otmMajors.selectSubject')}</option>
            {available.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
          </select>
          <input
            type="number" min={0.1} max={10} step={0.5}
            className="input w-20"
            title={t('admin.otmMajors.weightLabel')}
            value={weight}
            onChange={e => setWeight(e.target.value)}
          />
          <button
            className="btn-secondary flex items-center gap-1 px-3"
            disabled={!subjectId || addSubject.isPending}
            onClick={() => addSubject.mutate()}
          >
            <Plus className="w-4 h-4" />
          </button>
        </div>
      )}
    </div>
  );
}

function CutoffsPanel({ major }: { major: OtmMajor }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [year, setYear] = useState(String(new Date().getFullYear()));
  const [score, setScore] = useState('');
  const [maxScore, setMaxScore] = useState('189.9');

  const invalidate = () => qc.invalidateQueries({ queryKey: ['otm-majors-all'] });

  const addCutoff = useMutation({
    mutationFn: () => apiClient.post(`/otm-tavsiya/majors/${major.id}/cutoffs`, {
      year: Number(year), cutoff_score: Number(score), max_possible_score: Number(maxScore) || 189.9,
    }),
    onSuccess: () => { invalidate(); setScore(''); },
  });

  const removeCutoff = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/otm-tavsiya/cutoffs/${id}`),
    onSuccess: invalidate,
  });

  return (
    <div className="mt-4">
      <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-2">
        {t('admin.otmMajors.cutoffsSectionTitle')}
      </p>
      {major.cutoffs.length === 0 ? (
        <p className="text-sm text-gray-400 mb-3">{t('admin.otmMajors.noCutoffs')}</p>
      ) : (
        <div className="flex flex-wrap gap-2 mb-3">
          {major.cutoffs.map(c => (
            <span key={c.id} className="flex items-center gap-1.5 bg-amber-50 text-amber-700 text-xs font-medium px-2.5 py-1 rounded-full">
              {c.year}: {c.cutoff_score}/{c.max_possible_score}
              <button onClick={() => removeCutoff.mutate(c.id)} className="hover:text-amber-900">
                <X className="w-3 h-3" />
              </button>
            </span>
          ))}
        </div>
      )}
      <div className="flex gap-2 items-end">
        <input type="number" className="input w-24" placeholder={t('admin.otmMajors.yearLabel')} value={year} onChange={e => setYear(e.target.value)} />
        <input type="number" step={0.1} className="input w-28" placeholder={t('admin.otmMajors.cutoffScoreLabel')} value={score} onChange={e => setScore(e.target.value)} />
        <input type="number" step={0.1} className="input w-28" placeholder={t('admin.otmMajors.maxScoreLabel')} value={maxScore} onChange={e => setMaxScore(e.target.value)} />
        <button
          className="btn-secondary flex items-center gap-1 px-3"
          disabled={!score || addCutoff.isPending}
          onClick={() => addCutoff.mutate()}
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

export default function OtmMajorsPage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; major: OtmMajor } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<OtmMajor | null>(null);

  const { data: majors = [], isLoading } = useQuery<OtmMajor[]>({
    queryKey: ['otm-majors-all'],
    queryFn: () => apiClient.get('/otm-tavsiya/majors').then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/subjects').then(r => r.data.data),
  });

  const deleteFn = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/otm-tavsiya/majors/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['otm-majors-all'] }); setDeleteTarget(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('admin.otmMajors.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('admin.otmMajors.subtitle')}</p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('admin.otmMajors.newMajor')}
        </button>
      </div>

      {isLoading ? (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card animate-pulse h-40" />)}
        </div>
      ) : !majors.length ? (
        <div className="card text-center py-16 text-gray-400">
          <GraduationCap className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('admin.otmMajors.empty')}</p>
          <button onClick={() => setModal({ mode: 'add' })} className="btn-primary mt-4 text-sm">
            {t('admin.otmMajors.addFirst')}
          </button>
        </div>
      ) : (
        <div className="space-y-4">
          {majors.map(m => (
            <div key={m.id} className="card">
              <div className="flex items-start justify-between gap-3 mb-4">
                <div className="flex items-start gap-3">
                  <div className="bg-blue-50 rounded-xl w-11 h-11 flex items-center justify-center shrink-0">
                    <GraduationCap className="w-5 h-5 text-blue-700" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{m.major_name}</p>
                    <p className="text-xs text-gray-400">{m.university_name}</p>
                  </div>
                </div>
                <div className="flex gap-1 shrink-0">
                  <button onClick={() => setModal({ mode: 'edit', major: m })} className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500">
                    <Pencil className="w-3.5 h-3.5" />
                  </button>
                  <button onClick={() => setDeleteTarget(m)} className="p-1.5 hover:bg-red-50 rounded-lg text-red-400">
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              <SubjectsPanel major={m} subjects={subjects} />
              <CutoffsPanel major={m} />
            </div>
          ))}
        </div>
      )}

      {modal && (
        <MajorModal major={modal.mode === 'edit' ? modal.major : null} onClose={() => setModal(null)} />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">{t('admin.otmMajors.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>{deleteTarget.major_name}</strong> {t('admin.otmMajors.deleteDesc')}
            </p>
            <div className="flex gap-3 justify-end">
              <button onClick={() => setDeleteTarget(null)} className="btn-secondary">{t('common.cancel')}</button>
              <button
                onClick={() => deleteFn.mutate(deleteTarget.id)}
                disabled={deleteFn.isPending}
                className="bg-red-600 text-white px-4 py-2 rounded-xl text-sm font-medium hover:bg-red-700 flex items-center gap-2"
              >
                {deleteFn.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
