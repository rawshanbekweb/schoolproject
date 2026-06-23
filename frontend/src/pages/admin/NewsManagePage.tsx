import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, X, Loader2,
  Newspaper, Search,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { News, NewsCategory } from '../../types';
import ImageUpload from '../../components/ui/ImageUpload';
import { getDateLocale } from '../../i18n/dateLocale';

const CATEGORY_LABEL_KEYS: Record<NewsCategory, string> = {
  news: 'public.news.categoryLabels.news',
  event: 'public.news.categoryLabels.event',
  announcement: 'public.news.categoryLabels.announcement',
};
const CATEGORY_COLORS: Record<NewsCategory, string> = {
  news: 'badge-blue',
  event: 'badge-green',
  announcement: 'badge-amber',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(getDateLocale(), {
    day: 'numeric', month: 'short', year: 'numeric',
  });
}

const schema = z.object({
  title: z.string().min(3, 'admin.news.validation.titleMin').max(300),
  content: z.string().min(10, 'admin.news.validation.contentMin'),
  cover_url: z.string().url('admin.news.validation.urlInvalid').optional().or(z.literal('')),
  category: z.enum(['news', 'event', 'announcement']),
});
type FormData = z.infer<typeof schema>;

// ── Editor Modal ──
function NewsModal({
  item, onClose, onSaved,
}: {
  item?: News | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const [tab, setTab] = useState<'write' | 'preview'>('write');
  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: item
      ? {
          title: item.title,
          content: item.content ?? '',
          cover_url: item.cover_url ?? '',
          category: item.category,
        }
      : { category: 'news' },
  });

  const content = watch('content');
  const title = watch('title');

  const onSubmit = async (data: FormData) => {
    const payload = { ...data, cover_url: data.cover_url || undefined, is_published: true };
    if (item) {
      await apiClient.put(`/news/${item.id}`, payload);
    } else {
      await apiClient.post('/news', payload);
    }
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-gray-100 shrink-0">
          <h2 className="font-semibold text-gray-800">
            {item ? t('admin.news.editTitle') : t('admin.news.createTitle')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 space-y-4 overflow-y-auto flex-1">
            {/* Title */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                {t('admin.news.titleLabel')} <span className="text-red-500">*</span>
              </label>
              <input className="input text-base font-medium" placeholder={t('admin.news.titlePlaceholder')}
                {...register('title')} />
              {errors.title && <p className="text-red-500 text-xs mt-1">{t(errors.title.message!)}</p>}
            </div>

            {/* Category */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.news.categoryLabel')}</label>
              <div className="flex gap-2">
                {(['news', 'event', 'announcement'] as NewsCategory[]).map(cat => (
                  <label key={cat} className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 cursor-pointer text-xs font-medium transition-colors ${
                    watch('category') === cat ? 'border-blue-500 bg-blue-50 text-blue-700' : 'border-gray-200 text-gray-600'
                  }`}>
                    <input type="radio" value={cat} {...register('category')} className="sr-only" />
                    {t(CATEGORY_LABEL_KEYS[cat])}
                  </label>
                ))}
              </div>
            </div>

            {/* Cover image */}
            <Controller
              name="cover_url"
              control={control}
              render={({ field }) => (
                <ImageUpload
                  label={t('admin.news.coverLabel')}
                  value={field.value ?? ''}
                  onChange={field.onChange}
                />
              )}
            />

            {/* Content editor with preview */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-sm font-medium text-gray-700">
                  {t('admin.news.contentLabel')} <span className="text-red-500">*</span>
                </label>
                <div className="flex gap-1 bg-gray-100 p-0.5 rounded-lg">
                  <button type="button" onClick={() => setTab('write')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      tab === 'write' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
                    }`}>
                    {t('admin.news.tabWrite')}
                  </button>
                  <button type="button" onClick={() => setTab('preview')}
                    className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${
                      tab === 'preview' ? 'bg-white shadow-sm text-gray-800' : 'text-gray-500'
                    }`}>
                    {t('admin.news.tabPreview')}
                  </button>
                </div>
              </div>

              {tab === 'write' ? (
                <textarea
                  className="input resize-none font-mono text-sm"
                  rows={12}
                  placeholder={t('admin.news.contentPlaceholder')}
                  {...register('content')}
                />
              ) : (
                <div className="border border-gray-300 rounded-lg p-4 min-h-[264px] bg-gray-50 overflow-y-auto">
                  {title && <h2 className="text-lg font-bold text-gray-800 mb-3">{title}</h2>}
                  {content?.split('\n').map((para, i) =>
                    para.trim()
                      ? <p key={i} className="text-gray-700 mb-3 leading-relaxed text-sm">{para}</p>
                      : <div key={i} className="h-2" />
                  )}
                  {!content && <p className="text-gray-400 text-sm">{t('admin.news.previewEmpty')}</p>}
                </div>
              )}
              {errors.content && <p className="text-red-500 text-xs mt-1">{t(errors.content.message!)}</p>}
            </div>
          </div>

          {/* Footer */}
          <div className="p-5 border-t border-gray-100 flex gap-3 shrink-0">
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

// ── Main ──
export default function NewsManagePage() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modal, setModal] = useState<News | null | undefined>(undefined);
  const [deleteItem, setDeleteItem] = useState<News | null>(null);
  const [search, setSearch] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['news-manage'],
    queryFn: () => apiClient.get('/news', { params: { limit: 50 } }).then(r => r.data),
  });

  const news: News[] = data?.data ?? [];
  const refresh = () => qc.invalidateQueries({ queryKey: ['news-manage'] });

  const deleteMutation = useMutation({
    mutationFn: (id: number) => apiClient.delete(`/news/${id}`),
    onSuccess: () => { refresh(); setDeleteItem(null); },
  });

  const filtered = news.filter(n => {
    const matchSearch = !search || n.title.toLowerCase().includes(search.toLowerCase());
    const matchCat = !categoryFilter || n.category === categoryFilter;
    return matchSearch && matchCat;
  });

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">{t('admin.news.title')}</h1>
          <p className="text-sm text-gray-500 mt-0.5">{t('admin.news.countSuffix', { count: news.length })}</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModal(null)}>
          <Plus className="w-4 h-4" /> {t('admin.news.newItem')}
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder={t('admin.news.searchPlaceholder')}
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl shrink-0">
          {[
            { value: '', label: t('common.all') },
            { value: 'news', label: t('public.news.categoryLabels.news') },
            { value: 'event', label: t('public.news.categoryLabels.event') },
            { value: 'announcement', label: t('public.news.categoryLabels.announcement') },
          ].map(f => (
            <button key={f.value} onClick={() => setCategoryFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                categoryFilter === f.value ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => <div key={i} className="card animate-pulse h-14" />)}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-gray-400">
          <Newspaper className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-gray-500">{search ? t('admin.news.noResults') : t('admin.news.empty')}</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">{t('admin.news.tableTitle')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">{t('admin.news.tableCategory')}</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">{t('admin.news.tableDate')}</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">{t('common.actions')}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(n => (
                <tr key={n.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      {n.cover_url
                        ? <img src={n.cover_url} alt="" className="w-10 h-10 rounded-lg object-cover shrink-0" />
                        : <div className="w-10 h-10 rounded-lg bg-blue-50 flex items-center justify-center shrink-0">
                            <Newspaper className="w-4 h-4 text-blue-300" />
                          </div>
                      }
                      <p className="font-medium text-gray-800 text-sm line-clamp-2">{n.title}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className={`badge ${CATEGORY_COLORS[n.category]}`}>{t(CATEGORY_LABEL_KEYS[n.category])}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    <span className="text-xs text-gray-500">{n.published_at ? formatDate(n.published_at) : '—'}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModal(n)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteItem(n)}
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
        <NewsModal item={modal} onClose={() => setModal(undefined)} onSaved={refresh} />
      )}

      {deleteItem && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('admin.news.confirmDeleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-5 line-clamp-2">{deleteItem.title}</p>
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
