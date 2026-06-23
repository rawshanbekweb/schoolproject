import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, X, Loader2, Trophy, Star, Search,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { Achievement, Subject } from '../../types';
import ImageUpload from '../../components/ui/ImageUpload';
import { getDateLocale } from '../../i18n/dateLocale';

const schema = z.object({
  person_name: z.string().min(2, 'admin.achievements.validation.personNameMin').max(200),
  person_type: z.enum(['student', 'teacher']),
  class_name: z.string().max(20).optional(),
  subject_id: z.coerce.number().int().positive().optional().or(z.literal('')),
  title: z.string().min(3, 'admin.achievements.validation.titleMin').max(300),
  description: z.string().max(1000).optional(),
  photo_url: z.string().url('admin.achievements.validation.urlInvalid').optional().or(z.literal('')),
  award_date: z.string().optional(),
  level: z.string().max(50).optional(),
  is_featured: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

const LEVELS = ['Xalqaro', 'Respublika', 'Viloyat', 'Tuman', 'Maktab'] as const;
const LEVEL_LABEL_KEYS: Record<string, string> = {
  Xalqaro: 'admin.achievements.levels.international',
  Respublika: 'admin.achievements.levels.republic',
  Viloyat: 'admin.achievements.levels.region',
  Tuman: 'admin.achievements.levels.district',
  Maktab: 'admin.achievements.levels.school',
};

function AchievementModal({
  item, subjects, onClose, onSaved,
}: {
  item?: Achievement | null;
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          ...item,
          subject_id: item.subject_id ?? '',
          class_name: item.class_name ?? '',
          description: item.description ?? '',
          photo_url: item.photo_url ?? '',
          award_date: item.award_date ?? '',
          level: item.level ?? '',
        }
      : { person_type: 'student', is_featured: false },
  });

  const personType = watch('person_type');

  const onSubmit = async (data: FormData) => {
    const payload = {
      ...data,
      subject_id: data.subject_id ? Number(data.subject_id) : undefined,
      cover_url: undefined,
      photo_url: data.photo_url || undefined,
      class_name: data.class_name || undefined,
      description: data.description || undefined,
      award_date: data.award_date || undefined,
      level: data.level || undefined,
    };
    if (item) {
      await apiClient.put(`/achievements/${item.id}`, payload);
    } else {
      await apiClient.post('/achievements', payload);
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {item ? t('admin.achievements.editTitle') : t('admin.achievements.createTitle')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Person type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.achievements.typeLabel')}</label>
            <div className="grid grid-cols-2 gap-2">
              {(['student', 'teacher'] as const).map(pt => (
                <label key={pt} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  personType === pt ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                }`}>
                  <input type="radio" value={pt} {...register('person_type')} className="sr-only" />
                  <span className="font-medium text-sm">{pt === 'student' ? t('public.achievements.student') : t('public.achievements.teacher')}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Name + Class */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('admin.achievements.fullNameLabel')} <span className="text-red-500">*</span>
              </label>
              <input className="input" {...register('person_name')} placeholder={t('admin.achievements.fullNamePlaceholder')} />
              {errors.person_name && <p className="text-red-500 text-xs mt-1">{t(errors.person_name.message!)}</p>}
            </div>
            {personType === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.achievements.classLabel')}</label>
                <input className="input" {...register('class_name')} placeholder="9-A" />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              {t('admin.achievements.achievementNameLabel')} <span className="text-red-500">*</span>
            </label>
            <input className="input" {...register('title')}
              placeholder={t('admin.achievements.achievementNamePlaceholder')} />
            {errors.title && <p className="text-red-500 text-xs mt-1">{t(errors.title.message!)}</p>}
          </div>

          {/* Level + Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.achievements.levelLabel')}</label>
              <select className="input" {...register('level')}>
                <option value="">{t('admin.achievements.selectPlaceholder')}</option>
                {LEVELS.map(l => <option key={l} value={l}>{t(LEVEL_LABEL_KEYS[l])}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.achievements.subjectLabel')}</label>
              <select className="input" {...register('subject_id')}>
                <option value="">{t('admin.achievements.selectPlaceholder')}</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Award date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.achievements.dateLabel')}</label>
            <input type="date" className="input" {...register('award_date')} />
          </div>

          {/* Photo upload */}
          <Controller
            name="photo_url"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label={t('admin.achievements.photoLabel')}
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.achievements.descriptionLabel')}</label>
            <textarea className="input resize-none" rows={3}
              placeholder={t('admin.achievements.descriptionPlaceholder')} {...register('description')} />
          </div>

          {/* Featured */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 border-gray-100 hover:border-amber-300 transition-colors">
            <input type="checkbox" {...register('is_featured')} className="w-4 h-4 rounded accent-amber-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">{t('admin.achievements.featuredLabel')}</p>
              <p className="text-xs text-gray-400">{t('admin.achievements.featuredHint')}</p>
            </div>
            <Star className="w-4 h-4 text-amber-400 ml-auto" />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">{t('common.cancel')}</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />{t('common.saving')}</> : t('common.save')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AchievementsManagePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState<Achievement | null | undefined>(undefined);
  const [deleteItem, setDeleteItem] = useState<Achievement | null>(null);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['achievements-manage'],
    queryFn: () => apiClient.get('/achievements', { params: { limit: 50 } }).then(r => r.data),
  });
  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/questions/subjects?all=true').then(r => r.data.data),
  });

  const items: Achievement[] = data?.data ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['achievements-manage'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/achievements/${id}`),
    onSuccess: () => { refresh(); setDeleteItem(null); },
  });

  const filtered = items.filter(i => {
    const matchSearch = !search || i.person_name.toLowerCase().includes(search.toLowerCase()) ||
      i.title.toLowerCase().includes(search.toLowerCase());
    const matchType = !typeFilter || i.person_type === typeFilter;
    return matchSearch && matchType;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.achievements.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('admin.achievements.countSuffix', { count: items.length })}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(null)}>
          <Plus className="w-4 h-4" /> {t('admin.achievements.addNew')}
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder={t('admin.achievements.searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {[
            { value: '', label: t('common.all') },
            { value: 'student', label: t('public.achievements.student') },
            { value: 'teacher', label: t('public.achievements.teacher') },
          ].map(f => (
            <button key={f.value} onClick={() => setTypeFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                typeFilter === f.value ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse h-14" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-gray-400">
          <Trophy className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-gray-500">{search ? t('admin.achievements.noResults') : t('admin.achievements.empty')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t('admin.achievements.tablePerson')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t('admin.achievements.tableAchievement')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">{t('admin.achievements.tableLevel')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">{t('admin.achievements.tableDate')}</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">⭐</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.person_name}</p>
                      <span className={`badge text-xs mt-0.5 ${item.person_type === 'student' ? 'badge-blue' : 'badge-amber'}`}>
                        {item.person_type === 'student' ? t('public.achievements.student') : t('public.achievements.teacher')}
                      </span>
                      {item.class_name && <span className="text-xs text-gray-400 ml-1">{item.class_name}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 line-clamp-2">{item.title}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {item.level
                      ? <span className="badge badge-green text-xs">{t(LEVEL_LABEL_KEYS[item.level] ?? '', { defaultValue: item.level })}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-500">
                      {item.award_date ? new Date(item.award_date).toLocaleDateString(getDateLocale()) : '—'}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center hidden sm:table-cell">
                    {item.is_featured && <Star className="w-4 h-4 text-amber-400 fill-amber-400 inline" />}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(item)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteItem(item)}
                        className="p-1.5 rounded-lg hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {modal !== undefined && (
        <AchievementModal item={modal} subjects={subjects} onClose={() => setModal(undefined)} onSaved={refresh} />
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('admin.achievements.confirmDeleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-5">{deleteItem.person_name} — {deleteItem.title}</p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setDeleteItem(null)}>{t('common.cancel')}</button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteItem.id)}
              >
                {deleteMutation.isPending ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
