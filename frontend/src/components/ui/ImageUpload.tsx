import { useState, useRef } from 'react';
import { Upload, X, Image as ImageIcon, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';

interface Props {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
}

export default function ImageUpload({ value, onChange, label = 'Rasm yuklash' }: Props) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  const handleFile = async (file: File) => {
    setError('');
    setLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      onChange(data.data.url);
    } catch (e: any) {
      setError(e.response?.data?.message || 'Yuklash xatosi');
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  };

  return (
    <div className="space-y-2">
      <label className="text-sm font-medium text-gray-700">{label}</label>

      {value ? (
        <div className="relative w-full h-40 rounded-xl overflow-hidden border border-gray-200 bg-gray-50">
          <img src={value} alt="preview" className="w-full h-full object-cover" />
          <button
            type="button"
            onClick={() => onChange('')}
            className="absolute top-2 right-2 bg-white/80 hover:bg-white rounded-full p-1 shadow"
          >
            <X className="w-4 h-4 text-gray-600" />
          </button>
        </div>
      ) : (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => fileRef.current?.click()}
          className="border-2 border-dashed border-gray-200 rounded-xl h-40 flex flex-col items-center justify-center gap-2 cursor-pointer hover:border-blue-400 hover:bg-blue-50/30 transition-colors"
        >
          {loading ? (
            <Loader2 className="w-8 h-8 text-blue-500 animate-spin" />
          ) : (
            <>
              <div className="bg-gray-100 rounded-full p-3">
                {error ? <ImageIcon className="w-6 h-6 text-red-400" /> : <Upload className="w-6 h-6 text-gray-400" />}
              </div>
              <p className="text-sm text-gray-500">Rasm tanlash yoki shu yerga tashlang</p>
              <p className="text-xs text-gray-400">JPEG, PNG, WebP, GIF · max 5MB</p>
            </>
          )}
        </div>
      )}

      {error && <p className="text-xs text-red-500">{error}</p>}

      <input
        ref={fileRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,image/gif"
        className="hidden"
        onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
      />

      <div className="flex gap-2 items-center">
        <div className="flex-1 border border-gray-200 rounded-lg px-3 py-1.5">
          <input
            type="url"
            placeholder="yoki URL kiriting..."
            value={value ?? ''}
            onChange={(e) => onChange(e.target.value)}
            className="w-full text-sm text-gray-600 outline-none bg-transparent"
          />
        </div>
      </div>
    </div>
  );
}
