import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, X, Loader2, Trophy, Star, Search,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../../api/client';
import { Achievement, Subject } from '../../types';
import ImageUpload from '../../components/ui/ImageUpload';

const schema = z.object({
  person_name: z.string().min(2, 'Kamida 2 belgi').max(200),
  person_type: z.enum(['student', 'teacher']),
  class_name: z.string().max(20).optional(),
  subject_id: z.coerce.number().int().positive().optional().or(z.literal('')),
  title: z.string().min(3, 'Kamida 3 belgi').max(300),
  description: z.string().max(1000).optional(),
  photo_url: z.string().url('Noto\'g\'ri URL').optional().or(z.literal('')),
  award_date: z.string().optional(),
  level: z.string().max(50).optional(),
  is_featured: z.boolean().default(false),
});
type FormData = z.infer<typeof schema>;

const LEVELS = ['Xalqaro', 'Respublika', 'Viloyat', 'Tuman', 'Maktab'];

function AchievementModal({
  item, subjects, onClose, onSaved,
}: {
  item?: Achievement | null;
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
}) {
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
            {item ? 'Yutuqni tahrirlash' : 'Yangi yutuq'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          {/* Person type */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tur</label>
            <div className="grid grid-cols-2 gap-2">
              {(['student', 'teacher'] as const).map(t => (
                <label key={t} className={`flex items-center justify-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  personType === t ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                }`}>
                  <input type="radio" value={t} {...register('person_type')} className="sr-only" />
                  <span className="font-medium text-sm">{t === 'student' ? "O'quvchi" : "O'qituvchi"}</span>
                </label>
              ))}
            </div>
          </div>

          {/* Name + Class */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ism familiya <span className="text-red-500">*</span>
              </label>
              <input className="input" {...register('person_name')} placeholder="Alisher Toshmatov" />
              {errors.person_name && <p className="text-red-500 text-xs mt-1">{errors.person_name.message}</p>}
            </div>
            {personType === 'student' && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1.5">Sinf</label>
                <input className="input" {...register('class_name')} placeholder="9-A" />
              </div>
            )}
          </div>

          {/* Title */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Yutuq nomi <span className="text-red-500">*</span>
            </label>
            <input className="input" {...register('title')}
              placeholder="Respublika matematika olimpiadasi g'olibi" />
            {errors.title && <p className="text-red-500 text-xs mt-1">{errors.title.message}</p>}
          </div>

          {/* Level + Subject */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Daraja</label>
              <select className="input" {...register('level')}>
                <option value="">Tanlang</option>
                {LEVELS.map(l => <option key={l} value={l}>{l}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Fan</label>
              <select className="input" {...register('subject_id')}>
                <option value="">Tanlang</option>
                {subjects.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
          </div>

          {/* Award date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Sana</label>
            <input type="date" className="input" {...register('award_date')} />
          </div>

          {/* Photo upload */}
          <Controller
            name="photo_url"
            control={control}
            render={({ field }) => (
              <ImageUpload
                label="Rasm"
                value={field.value ?? ''}
                onChange={field.onChange}
              />
            )}
          />

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Tavsif</label>
            <textarea className="input resize-none" rows={3}
              placeholder="Qo'shimcha ma'lumot..." {...register('description')} />
          </div>

          {/* Featured */}
          <label className="flex items-center gap-3 cursor-pointer p-3 rounded-xl border-2 border-gray-100 hover:border-amber-300 transition-colors">
            <input type="checkbox" {...register('is_featured')} className="w-4 h-4 rounded accent-amber-500" />
            <div>
              <p className="text-sm font-medium text-gray-700">Asosiy sahifada ajratib ko'rsatish</p>
              <p className="text-xs text-gray-400">Sahifaning tepasida ko'rinadi</p>
            </div>
            <Star className="w-4 h-4 text-amber-400 ml-auto" />
          </label>

          <div className="flex gap-3 pt-2">
            <button type="button" onClick={onClose} className="btn-outline flex-1">Bekor</button>
            <button type="submit" className="btn-primary flex-1 flex items-center justify-center gap-2" disabled={isSubmitting}>
              {isSubmitting ? <><Loader2 className="w-4 h-4 animate-spin" />Saqlanmoqda...</> : 'Saqlash'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default function AchievementsManagePage() {
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
          <h1 className="text-2xl font-bold text-gray-800">Maktab faxrlari</h1>
          <p className="text-sm text-gray-500 mt-0.5">{items.length} ta yutuq</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(null)}>
          <Plus className="w-4 h-4" /> Yutuq qo'shish
        </button>
      </div>

      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Ism yoki yutuq nomi bo'yicha..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {[
            { value: '', label: 'Barchasi' },
            { value: 'student', label: "O'quvchi" },
            { value: 'teacher', label: "O'qituvchi" },
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
          <p className="text-gray-500">{search ? 'Hech narsa topilmadi' : 'Yutuqlar yo\'q'}</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Shaxs</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Yutuq</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Daraja</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Sana</th>
                <th className="text-center text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">⭐</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(item => (
                <tr key={item.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium text-gray-800 text-sm">{item.person_name}</p>
                      <span className={`badge text-xs mt-0.5 ${item.person_type === 'student' ? 'badge-blue' : 'badge-amber'}`}>
                        {item.person_type === 'student' ? "O'quvchi" : "O'qituvchi"}
                      </span>
                      {item.class_name && <span className="text-xs text-gray-400 ml-1">{item.class_name}</span>}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <p className="text-sm text-gray-700 line-clamp-2">{item.title}</p>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    {item.level
                      ? <span className="badge badge-green text-xs">{item.level}</span>
                      : <span className="text-gray-300">—</span>}
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-500">
                      {item.award_date ? new Date(item.award_date).toLocaleDateString('uz-UZ') : '—'}
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
            <h3 className="font-semibold text-gray-800 mb-2">Yutuqni o'chirasizmi?</h3>
            <p className="text-sm text-gray-500 mb-5">{deleteItem.person_name} — {deleteItem.title}</p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setDeleteItem(null)}>Bekor</button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                disabled={deleteMutation.isPending}
                onClick={() => deleteMutation.mutate(deleteItem.id)}
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
