import { useParams, Link, useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  ArrowLeft, Calendar, User, Eye,
  Newspaper, AlertCircle,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { News, NewsCategory } from '../../types';
import { getDateLocale } from '../../i18n/dateLocale';

const CATEGORY_COLORS: Record<NewsCategory, string> = {
  news: 'badge-blue',
  event: 'badge-green',
  announcement: 'badge-amber',
};

const CATEGORY_LABEL_KEYS: Record<NewsCategory, string> = {
  news: 'public.news.categoryLabels.news',
  event: 'public.news.categoryLabels.event',
  announcement: 'public.news.categoryLabels.announcement',
};

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString(getDateLocale(), {
    day: 'numeric', month: 'long', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}

export default function NewsDetailPage() {
  const { t } = useTranslation();
  const { slug } = useParams<{ slug: string }>();
  const navigate = useNavigate();

  const { data: news, isLoading, isError } = useQuery<News>({
    queryKey: ['news-detail', slug],
    queryFn: () => apiClient.get(`/news/${slug}`).then(r => r.data.data),
    enabled: !!slug,
    retry: false,
  });

  if (isLoading) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10 animate-pulse">
        <div className="h-5 bg-gray-100 rounded w-24 mb-6" />
        <div className="h-8 bg-gray-100 rounded w-3/4 mb-3" />
        <div className="h-8 bg-gray-100 rounded w-1/2 mb-6" />
        <div className="h-64 bg-gray-100 rounded-xl mb-6" />
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className={`h-4 bg-gray-100 rounded ${i % 3 === 2 ? 'w-2/3' : 'w-full'}`} />
          ))}
        </div>
      </div>
    );
  }

  if (isError || !news) {
    return (
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-20 text-center">
        <div className="inline-flex items-center justify-center w-16 h-16 bg-red-50 rounded-full mb-4">
          <AlertCircle className="w-8 h-8 text-red-400" />
        </div>
        <h2 className="text-xl font-semibold text-gray-800 mb-2">{t('public.newsDetail.notFound')}</h2>
        <p className="text-gray-500 text-sm mb-6">{t('public.newsDetail.notFoundDesc')}</p>
        <Link to="/news" className="btn-primary inline-flex items-center gap-2">
          <ArrowLeft className="w-4 h-4" />
          {t('public.newsDetail.backToList')}
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 py-10">
      {/* Back */}
      <button
        onClick={() => navigate(-1)}
        className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        {t('public.newsDetail.back')}
      </button>

      {/* Category + Meta */}
      <div className="flex items-center gap-3 flex-wrap mb-4">
        <span className={`badge ${CATEGORY_COLORS[news.category]}`}>
          {t(CATEGORY_LABEL_KEYS[news.category])}
        </span>
        <div className="flex items-center gap-3 text-xs text-gray-400">
          {news.author && (
            <span className="flex items-center gap-1">
              <User className="w-3 h-3" />
              {news.author}
            </span>
          )}
          <span className="flex items-center gap-1">
            <Calendar className="w-3 h-3" />
            {formatDate(news.published_at)}
          </span>
          <span className="flex items-center gap-1">
            <Eye className="w-3 h-3" />
            {news.views} {t('public.newsDetail.views')}
          </span>
        </div>
      </div>

      {/* Title */}
      <h1 className="text-2xl sm:text-3xl font-bold text-gray-800 leading-tight mb-6">
        {news.title}
      </h1>

      {/* Cover */}
      {news.cover_url ? (
        <div className="rounded-2xl overflow-hidden mb-8 shadow-sm">
          <img
            src={news.cover_url}
            alt={news.title}
            className="w-full max-h-[420px] object-cover"
          />
        </div>
      ) : (
        <div className="rounded-2xl bg-gradient-to-br from-blue-50 to-blue-100 flex items-center justify-center h-48 mb-8">
          <Newspaper className="w-16 h-16 text-blue-200" />
        </div>
      )}

      {/* Content */}
      <article className="prose prose-gray max-w-none">
        {news.content?.split('\n').map((para, i) =>
          para.trim() ? (
            <p key={i} className="text-gray-700 leading-relaxed mb-4 text-base">
              {para}
            </p>
          ) : (
            <div key={i} className="h-2" />
          )
        )}
      </article>

      {/* Bottom nav */}
      <div className="border-t border-gray-100 mt-10 pt-6">
        <Link
          to="/news"
          className="inline-flex items-center gap-2 text-sm text-blue-700 hover:text-blue-900 font-medium"
        >
          <ArrowLeft className="w-4 h-4" />
          {t('public.newsDetail.backToAll')}
        </Link>
      </div>
    </div>
  );
}
