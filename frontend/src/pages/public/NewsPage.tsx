import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Eye, Calendar, User, Newspaper, ChevronLeft, ChevronRight } from 'lucide-react';
import { apiClient } from '../../api/client';
import { News, NewsCategory } from '../../types';

const CATEGORIES: { value: NewsCategory | ''; label: string }[] = [
  { value: '', label: 'Barchasi' },
  { value: 'news', label: 'Yangiliklar' },
  { value: 'event', label: 'Tadbirlar' },
  { value: 'announcement', label: "E'lonlar" },
];

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  news: 'badge-blue',
  event: 'badge-green',
  announcement: 'badge-amber',
};

const CATEGORY_LABELS: Record<NewsCategory, string> = {
  news: 'Yangilik',
  event: 'Tadbir',
  announcement: "E'lon",
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('uz-UZ', {
    day: 'numeric', month: 'long', year: 'numeric',
  });
}

function NewsCard({ item }: { item: News }) {
  return (
    <Link
      to={`/news/${item.slug}`}
      className="card group hover:shadow-md transition-all duration-200 flex flex-col p-0 overflow-hidden"
    >
      {/* Cover */}
      <div className="relative h-44 bg-gradient-to-br from-blue-50 to-blue-100 overflow-hidden">
        {item.cover_url ? (
          <img
            src={item.cover_url}
            alt={item.title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Newspaper className="w-12 h-12 text-blue-200" />
          </div>
        )}
        <span className={`absolute top-3 left-3 badge ${CATEGORY_COLORS[item.category]}`}>
          {CATEGORY_LABELS[item.category]}
        </span>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-1">
        <h3 className="font-semibold text-gray-800 text-sm leading-snug group-hover:text-blue-800 transition-colors line-clamp-2 mb-3 flex-1">
          {item.title}
        </h3>
        <div className="flex items-center justify-between text-xs text-gray-400 gap-2 flex-wrap">
          <div className="flex items-center gap-3">
            {item.author && (
              <span className="flex items-center gap-1">
                <User className="w-3 h-3" />
                {item.author.split(' ')[0]}
              </span>
            )}
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" />
              {formatDate(item.published_at)}
            </span>
          </div>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {item.views}
          </span>
        </div>
      </div>
    </Link>
  );
}

export default function NewsPage() {
  const [category, setCategory] = useState<NewsCategory | ''>('');
  const [page, setPage] = useState(1);

  const { data, isLoading } = useQuery({
    queryKey: ['news', category, page],
    queryFn: () =>
      apiClient.get('/news', {
        params: { category: category || undefined, page, limit: 9 },
      }).then(r => r.data),
    placeholderData: (prev) => prev,
  });

  const news: News[] = data?.data ?? [];
  const meta = data?.meta;
  const totalPages = meta ? Math.ceil(meta.total / meta.limit) : 1;

  const handleCategory = (cat: NewsCategory | '') => {
    setCategory(cat);
    setPage(1);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800">Yangiliklar</h1>
        <p className="text-gray-500 mt-1">Maktab hayotidan so'nggi xabarlar</p>
      </div>

      {/* Category tabs */}
      <div className="flex gap-2 flex-wrap mb-6">
        {CATEGORIES.map(cat => (
          <button
            key={cat.value}
            onClick={() => handleCategory(cat.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              category === cat.value
                ? 'bg-blue-800 text-white'
                : 'bg-white text-gray-600 border border-gray-200 hover:border-blue-300 hover:text-blue-700'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse p-0 overflow-hidden">
              <div className="h-44 bg-gray-100" />
              <div className="p-4 space-y-2">
                <div className="h-4 bg-gray-100 rounded w-full" />
                <div className="h-4 bg-gray-100 rounded w-2/3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mt-3" />
              </div>
            </div>
          ))}
        </div>
      ) : news.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 text-gray-400">
          <Newspaper className="w-14 h-14 mb-3 opacity-30" />
          <p className="font-medium text-gray-500">Yangiliklar hali yo'q</p>
          <p className="text-sm mt-1">Tez orada qo'shiladi</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {news.map(item => (
              <NewsCard key={item.id} item={item} />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 mt-8">
              <button
                onClick={() => setPage(p => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 disabled:opacity-40 transition-colors"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>

              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 1)
                .reduce<(number | '...')[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push('...');
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  p === '...' ? (
                    <span key={`e${i}`} className="px-2 text-gray-400 text-sm">…</span>
                  ) : (
                    <button
                      key={p}
                      onClick={() => setPage(p as number)}
                      className={`w-9 h-9 rounded-lg text-sm font-medium transition-colors ${
                        page === p
                          ? 'bg-blue-800 text-white'
                          : 'border border-gray-200 hover:border-blue-300 text-gray-600'
                      }`}
                    >
                      {p}
                    </button>
                  )
                )}

              <button
                onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 rounded-lg border border-gray-200 hover:border-blue-300 disabled:opacity-40 transition-colors"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
