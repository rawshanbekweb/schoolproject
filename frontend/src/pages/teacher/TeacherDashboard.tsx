import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useRef, useState } from 'react';
import {
  BookOpen, Star, GraduationCap, Camera, Loader2,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';
import { Subject } from '../../types';

interface MyStats {
  subjects: Subject[];
  rating: number;
}

function RatingRing({ rating }: { rating: number }) {
  const pct = Math.min(rating / 10, 1);
  const r = 40;
  const circ = 2 * Math.PI * r;
  const offset = circ * (1 - pct);
  const color = rating >= 7 ? '#16a34a' : rating >= 4 ? '#d97706' : '#dc2626';

  return (
    <div className="relative w-24 h-24">
      <svg className="w-full h-full -rotate-90" viewBox="0 0 96 96">
        <circle cx="48" cy="48" r={r} fill="none" stroke="#f3f4f6" strokeWidth="8" />
        <circle cx="48" cy="48" r={r} fill="none" stroke={color} strokeWidth="8"
          strokeDasharray={circ} strokeDashoffset={offset}
          strokeLinecap="round" className="transition-all duration-700" />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-gray-800">{rating}</span>
        <span className="text-xs text-gray-400">/ 10</span>
      </div>
    </div>
  );
}

export default function TeacherDashboard() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoLoading, setPhotoLoading] = useState(false);

  const { data: stats, isLoading } = useQuery<MyStats>({
    queryKey: ['my-stats'],
    queryFn: () => apiClient.get('/analytics/my-stats').then(r => r.data.data),
  });

  const { data: profile } = useQuery({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.get('/users/me').then(r => r.data.data),
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const res = await apiClient.post('/users/me/photo', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newPhotoUrl: string = res.data.data.photo_url;
      if (user) setUser({ ...user, photo_url: newPhotoUrl } as any);
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['teachers-home'] });
    } catch {
      alert(t('teacher.dashboard.photoUploadFailed'));
    } finally {
      setPhotoLoading(false);
    }
  };

  const photoUrl = profile?.photo_url ?? user?.photo_url;

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="bg-gradient-to-r from-blue-800 to-blue-600 rounded-2xl p-6 text-white">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="relative shrink-0">
              {photoUrl ? (
                <img src={photoUrl} alt="" className="w-16 h-16 rounded-full object-cover border-3 border-white/30" />
              ) : (
                <div className="w-16 h-16 rounded-full bg-white/20 flex items-center justify-center text-2xl font-bold">
                  {user?.full_name.charAt(0)}
                </div>
              )}
              <button
                onClick={() => fileRef.current?.click()}
                className="absolute -bottom-1 -right-1 bg-amber-500 hover:bg-amber-400 text-white rounded-full p-1.5 transition-colors"
                title={t('teacher.dashboard.uploadPhoto')}
              >
                {photoLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Camera className="w-3 h-3" />}
              </button>
              <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handlePhotoUpload} />
            </div>
            <div>
              <p className="text-blue-200 text-sm mb-1">{t('teacher.dashboard.welcome')}</p>
              <h1 className="text-2xl font-bold">{user?.full_name}</h1>
              <p className="text-blue-200 text-sm mt-1">{t('teacher.dashboard.cabinetLabel')}</p>
            </div>
          </div>
          <div className="bg-white/10 rounded-xl p-3 shrink-0">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
        </div>
      </div>

      {/* Stats */}
      {isLoading ? (
        <div className="card animate-pulse h-24" />
      ) : (
        <div className="card flex items-center gap-4 sm:w-fit">
          <RatingRing rating={stats?.rating ?? 0} />
          <div>
            <p className="font-semibold text-gray-800">{t('teacher.dashboard.ratingScore')}</p>
            <p className="text-xs text-gray-500 mt-0.5">
              {(stats?.rating ?? 0) >= 7 ? t('teacher.dashboard.ratingExcellent') : (stats?.rating ?? 0) >= 4 ? t('teacher.dashboard.ratingGood') : t('teacher.dashboard.ratingNeedsActivity')}
            </p>
            <p className="text-xs text-gray-400 mt-1">{t('teacher.dashboard.ratingHint')}</p>
          </div>
        </div>
      )}

      {/* Subjects */}
      <div className="card">
        <div className="flex items-center gap-2 mb-4">
          <Star className="w-4 h-4 text-amber-500" />
          <h2 className="font-semibold text-gray-800">{t('teacher.dashboard.assignedSubjects')}</h2>
        </div>

        {!stats?.subjects?.length ? (
          <div className="text-center py-8 text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-2 opacity-30" />
            <p className="text-sm">{t('teacher.dashboard.noSubjects')}</p>
            <p className="text-xs mt-1">{t('teacher.dashboard.noSubjectsHint')}</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2">
            {stats.subjects.map(s => (
              <div key={s.id} className="flex items-center gap-2.5 p-3 bg-gray-50 rounded-xl">
                <span className="text-xl">{s.icon ?? '📚'}</span>
                <div>
                  <p className="text-sm font-medium text-gray-700">{s.name}</p>
                  {s.short_name && <p className="text-xs text-gray-400">{s.short_name}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
