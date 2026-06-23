import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Plus, Pencil, Trash2, BookOpen, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { Subject } from '../../types';

interface SubjectForm {
  name: string;
  short_name: string;
  icon: string;
  description: string;
}

const EMOJI_SUGGESTIONS = ['📚', '🔢', '🧪', '🌍', '🏛️', '🎨', '💻', '🎵', '⚽', '🔬', '📖', '🧮', '🌿', '🗺️'];

const emptyForm: SubjectForm = { name: '', short_name: '', icon: '📚', description: '' };

function Modal({ subject, onClose }: { subject?: Subject | null; onClose: () => void }) {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [form, setForm] = useState<SubjectForm>({
    name: subject?.name ?? '',
    short_name: subject?.short_name ?? '',
    icon: subject?.icon ?? '📚',
    description: (subject as any)?.description ?? '',
  });
  const [error, setError] = useState('');

  const save = useMutation({
    mutationFn: (data: SubjectForm) =>
      subject
        ? apiClient.put(`/subjects/${subject.id}`, data)
        : apiClient.post('/subjects', data),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects-all'] }); onClose(); },
    onError: (e: any) => setError(e.response?.data?.message || t('admin.subjects.genericError')),
  });

  return (
    <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
        <div className="p-5 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">{subject ? t('admin.subjects.editTitle') : t('admin.subjects.createTitle')}</h3>
        </div>
        <div className="p-5 space-y-4">
          {error && <p className="text-sm text-red-500 bg-red-50 px-3 py-2 rounded-lg">{error}</p>}

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('admin.subjects.nameLabel')}</label>
            <input
              className="input w-full"
              placeholder={t('admin.subjects.namePlaceholder')}
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('admin.subjects.shortNameLabel')}</label>
              <input
                className="input w-full"
                placeholder="Math"
                value={form.short_name}
                onChange={e => setForm(p => ({ ...p, short_name: e.target.value }))}
              />
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('admin.subjects.iconLabel')}</label>
              <input
                className="input w-full text-2xl"
                value={form.icon}
                onChange={e => setForm(p => ({ ...p, icon: e.target.value }))}
                maxLength={4}
              />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {EMOJI_SUGGESTIONS.map(e => (
              <button
                key={e}
                type="button"
                onClick={() => setForm(p => ({ ...p, icon: e }))}
                className={`text-xl p-1.5 rounded-lg transition-colors ${form.icon === e ? 'bg-blue-100 ring-2 ring-blue-400' : 'hover:bg-gray-100'}`}
              >
                {e}
              </button>
            ))}
          </div>

          <div>
            <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('admin.subjects.descriptionLabel')}</label>
            <textarea
              className="input w-full resize-none"
              rows={2}
              placeholder={t('admin.subjects.descriptionPlaceholder')}
              value={form.description}
              onChange={e => setForm(p => ({ ...p, description: e.target.value }))}
            />
          </div>
        </div>

        <div className="p-5 border-t border-gray-100 flex gap-3 justify-end">
          <button onClick={onClose} className="btn-secondary">{t('common.cancel')}</button>
          <button
            onClick={() => save.mutate(form)}
            disabled={save.isPending || !form.name.trim()}
            className="btn-primary flex items-center gap-2"
          >
            {save.isPending && <Loader2 className="w-4 h-4 animate-spin" />}
            {subject ? t('common.save') : t('admin.subjects.add')}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SubjectsManagePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ mode: 'add' } | { mode: 'edit'; subject: Subject } | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Subject | null>(null);

  const { data: subjects = [], isLoading } = useQuery<(Subject & { teacher_count: number })[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/subjects').then(r => r.data.data),
  });

  const deleteFn = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/subjects/${id}`),
    onSuccess: () => { qc.invalidateQueries({ queryKey: ['subjects-all'] }); setDeleteTarget(null); },
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-800">{t('admin.subjects.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('admin.subjects.countSuffix', { count: subjects.length })}</p>
        </div>
        <button onClick={() => setModal({ mode: 'add' })} className="btn-primary flex items-center gap-2">
          <Plus className="w-4 h-4" /> {t('admin.subjects.newSubject')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-24" />
          ))}
        </div>
      ) : !subjects.length ? (
        <div className="card text-center py-16 text-gray-400">
          <BookOpen className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{t('admin.subjects.empty')}</p>
          <button onClick={() => setModal({ mode: 'add' })} className="btn-primary mt-4 text-sm">
            {t('admin.subjects.addFirst')}
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {subjects.map(s => (
            <div key={s.id} className="card flex items-start gap-4 group">
              <div className="bg-blue-50 rounded-xl w-12 h-12 flex items-center justify-center text-2xl shrink-0">
                {s.icon ?? '📚'}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-gray-800">{s.name}</p>
                {s.short_name && <p className="text-xs text-gray-400">{s.short_name}</p>}
                <p className="text-xs text-gray-500 mt-1">
                  {s.teacher_count} {t('admin.subjects.teacherCountSuffix')}
                </p>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                <button
                  onClick={() => setModal({ mode: 'edit', subject: s })}
                  className="p-1.5 hover:bg-gray-100 rounded-lg text-gray-500"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteTarget(s)}
                  className="p-1.5 hover:bg-red-50 rounded-lg text-red-400"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal
          subject={modal.mode === 'edit' ? modal.subject : null}
          onClose={() => setModal(null)}
        />
      )}

      {deleteTarget && (
        <div className="fixed inset-0 bg-black/40 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl p-6 max-w-sm w-full">
            <h3 className="font-semibold text-gray-800 mb-2">{t('admin.subjects.deleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-5">
              <strong>{deleteTarget.name}</strong> {t('admin.subjects.deleteDesc')}
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
