import { useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { FileText, Download, File, Calendar, Filter } from 'lucide-react';
import { apiClient } from '../../api/client';
import { Document, DocumentCategory } from '../../types';

const CATEGORIES: { value: DocumentCategory | ''; label: string }[] = [
  { value: '',            label: 'Barchasi' },
  { value: 'orders',      label: 'Buyruqlar' },
  { value: 'regulations', label: 'Nizomlar' },
  { value: 'reports',     label: 'Hisobotlar' },
  { value: 'plans',       label: 'Rejalar' },
  { value: 'other',       label: 'Boshqalar' },
];

const FILE_ICONS: Record<string, { color: string; icon: string }> = {
  pdf:  { color: 'text-red-500',   icon: '📄' },
  docx: { color: 'text-blue-500',  icon: '📝' },
  doc:  { color: 'text-blue-500',  icon: '📝' },
  xlsx: { color: 'text-green-500', icon: '📊' },
  xls:  { color: 'text-green-500', icon: '📊' },
  pptx: { color: 'text-orange-500', icon: '📋' },
};

function formatSize(bytes: number) {
  if (!bytes) return '';
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(0)} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

export default function DocumentsPage() {
  const [category, setCategory] = useState<DocumentCategory | ''>('');

  const { data: docs = [], isLoading } = useQuery<Document[]>({
    queryKey: ['documents', category],
    queryFn: () => apiClient.get('/documents', { params: category ? { category } : {} }).then(r => r.data.data),
  });

  const downloadMut = useMutation({
    mutationFn: (id: number) => apiClient.patch(`/documents/${id}/download`).then(r => r.data.data),
    onSuccess: (data) => { window.open(data.file_url, '_blank'); },
  });

  const fileInfo = (type: string) => FILE_ICONS[type.toLowerCase()] ?? { color: 'text-gray-400', icon: '📎' };

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-8">
      {/* Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">Hujjatlar</h1>
        <p className="text-gray-500">Maktabning normativ va ishchi hujjatlari</p>
      </motion.div>

      {/* Category filter */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.1 }}>
        <div className="flex items-center gap-2 mb-3">
          <Filter className="w-4 h-4 text-gray-400" />
          <span className="text-sm text-gray-500">Kategoriya:</span>
        </div>
        <div className="flex flex-wrap gap-2">
          {CATEGORIES.map(c => (
            <button
              key={c.value}
              onClick={() => setCategory(c.value)}
              className={`px-4 py-1.5 rounded-full text-sm font-medium border transition-colors ${
                category === c.value
                  ? 'bg-blue-700 text-white border-blue-700'
                  : 'border-gray-200 text-gray-600 hover:border-blue-300'
              }`}
            >
              {c.label}
            </button>
          ))}
        </div>
      </motion.div>

      {/* Documents list */}
      {isLoading ? (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card h-16 animate-pulse" />
          ))}
        </div>
      ) : !docs.length ? (
        <div className="text-center py-16 text-gray-400">
          <FileText className="w-12 h-12 mx-auto mb-3 opacity-30" />
          <p>Hujjatlar topilmadi</p>
        </div>
      ) : (
        <div className="space-y-3">
          {docs.map((doc, i) => {
            const fi = fileInfo(doc.file_type);
            return (
              <motion.div
                key={doc.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.04 }}
                className="card flex items-center gap-4 hover:shadow-md transition-shadow"
              >
                {/* File icon */}
                <div className={`text-3xl shrink-0 ${fi.color}`}>{fi.icon}</div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-800 truncate">{doc.title}</p>
                  <div className="flex items-center gap-3 mt-0.5">
                    {doc.description && (
                      <p className="text-xs text-gray-500 truncate max-w-xs">{doc.description}</p>
                    )}
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(doc.created_at).toLocaleDateString('uz-UZ')}
                      </span>
                      {doc.file_size > 0 && (
                        <span className="text-xs text-gray-400">{formatSize(doc.file_size)}</span>
                      )}
                      <span className="text-xs text-gray-400 flex items-center gap-1">
                        <Download className="w-3 h-3" />{doc.download_count}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Category badge */}
                <span className="badge badge-blue text-xs shrink-0 hidden sm:inline-flex">
                  {CATEGORIES.find(c => c.value === doc.category)?.label || doc.category}
                </span>

                {/* Download button */}
                <button
                  onClick={() => downloadMut.mutate(doc.id)}
                  disabled={downloadMut.isPending}
                  className="btn-primary text-sm flex items-center gap-2 shrink-0"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Yuklab olish</span>
                </button>
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
}
