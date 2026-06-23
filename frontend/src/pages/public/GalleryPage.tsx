import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import { X, ChevronLeft, ChevronRight, Images, ZoomIn } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';

interface MediaItem {
  id: number;
  url: string;
  alt_text: string | null;
  album: string | null;
  created_at: string;
}

function Lightbox({ items, index, onClose }: { items: MediaItem[]; index: number; onClose: () => void }) {
  const [current, setCurrent] = useState(index);

  const prev = () => setCurrent(c => (c > 0 ? c - 1 : items.length - 1));
  const next = () => setCurrent(c => (c < items.length - 1 ? c + 1 : 0));

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowLeft') prev();
    if (e.key === 'ArrowRight') next();
    if (e.key === 'Escape') onClose();
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black/90 flex items-center justify-center"
        onKeyDown={handleKey}
        tabIndex={0}
        autoFocus
        onClick={onClose}
      >
        {/* Close */}
        <button
          className="absolute top-4 right-4 bg-white/10 hover:bg-white/20 rounded-full p-2 text-white z-10"
          onClick={onClose}
        >
          <X className="w-6 h-6" />
        </button>

        {/* Prev */}
        <button
          className="absolute left-4 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white z-10"
          onClick={e => { e.stopPropagation(); prev(); }}
        >
          <ChevronLeft className="w-6 h-6" />
        </button>

        {/* Image */}
        <motion.img
          key={current}
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.2 }}
          src={items[current].url}
          alt={items[current].alt_text ?? ''}
          className="max-w-[90vw] max-h-[90vh] object-contain rounded-xl"
          onClick={e => e.stopPropagation()}
        />

        {/* Next */}
        <button
          className="absolute right-4 bg-white/10 hover:bg-white/20 rounded-full p-3 text-white z-10"
          onClick={e => { e.stopPropagation(); next(); }}
        >
          <ChevronRight className="w-6 h-6" />
        </button>

        {/* Counter + caption */}
        <div className="absolute bottom-4 left-0 right-0 text-center text-white">
          <p className="text-sm opacity-70">{current + 1} / {items.length}</p>
          {items[current].alt_text && (
            <p className="text-sm mt-1 opacity-90">{items[current].alt_text}</p>
          )}
        </div>
      </motion.div>
    </AnimatePresence>
  );
}

export default function GalleryPage() {
  const { t } = useTranslation();
  const [album, setAlbum] = useState<string>('');
  const [lightbox, setLightbox] = useState<number | null>(null);

  const { data: allMedia = [], isLoading } = useQuery<MediaItem[]>({
    queryKey: ['media-gallery'],
    queryFn: () => apiClient.get('/media').then(r => r.data.data),
  });

  // Albumlar ro'yxati
  const albums = ['', ...Array.from(new Set(allMedia.map(m => m.album ?? '').filter(Boolean)))];

  const filtered = album ? allMedia.filter(m => m.album === album) : allMedia;

  return (
    <div className="max-w-7xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('public.gallery.title')}</h1>
        <p className="text-gray-500">{t('public.gallery.subtitle')}</p>
      </motion.div>

      {/* Album filter */}
      {albums.length > 1 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}
          className="flex flex-wrap gap-2 justify-center">
          {albums.map(a => (
            <button
              key={a}
              onClick={() => setAlbum(a)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                album === a
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {a || t('public.teachers.all')}
            </button>
          ))}
        </motion.div>
      )}

      {/* Grid */}
      {isLoading ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          {Array.from({ length: 12 }).map((_, i) => (
            <div key={i} className="aspect-square bg-gray-100 rounded-xl animate-pulse" />
          ))}
        </div>
      ) : !filtered.length ? (
        <div className="text-center py-16 text-gray-400">
          <Images className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>{allMedia.length ? t('public.gallery.emptyAlbum') : t('public.gallery.emptyAll')}</p>
        </div>
      ) : (
        <div className="columns-2 sm:columns-3 lg:columns-4 gap-3">
          {filtered.map((item, i) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.03 }}
              className="relative group break-inside-avoid mb-3 cursor-pointer rounded-xl overflow-hidden"
              onClick={() => setLightbox(i)}
            >
              <img
                src={item.url}
                alt={item.alt_text ?? ''}
                className="w-full object-cover transition-transform duration-300 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 transition-colors flex items-center justify-center">
                <ZoomIn className="w-8 h-8 text-white opacity-0 group-hover:opacity-100 transition-opacity" />
              </div>
              {item.alt_text && (
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/60 to-transparent p-3 translate-y-full group-hover:translate-y-0 transition-transform">
                  <p className="text-white text-xs">{item.alt_text}</p>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Lightbox */}
      {lightbox !== null && (
        <Lightbox
          items={filtered}
          index={lightbox}
          onClose={() => setLightbox(null)}
        />
      )}
    </div>
  );
}
