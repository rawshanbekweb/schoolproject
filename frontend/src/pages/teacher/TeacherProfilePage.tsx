import { useRef, useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Loader2, Camera, Save, User, Phone, BookOpen, Award, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

interface Profile {
  id: number;
  full_name: string;
  login: string;
  role: string;
  photo_url: string | null;
  phone: string | null;
  bio: string | null;
  experience_years: number | null;
  education: string | null;
  achievements_text: string | null;
}

export default function TeacherProfilePage() {
  const { t } = useTranslation();
  const { user, setUser } = useAuthStore();
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [photoLoading, setPhotoLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  const { data: profile, isLoading } = useQuery<Profile>({
    queryKey: ['my-profile'],
    queryFn: () => apiClient.get('/users/me').then(r => r.data.data),
  });

  const [form, setForm] = useState({
    phone: '',
    bio: '',
    experience_years: '',
    education: '',
    achievements_text: '',
  });

  // Sync form when profile loads
  const [synced, setSynced] = useState(false);
  if (profile && !synced) {
    setForm({
      phone: profile.phone ?? '',
      bio: profile.bio ?? '',
      experience_years: String(profile.experience_years ?? ''),
      education: profile.education ?? '',
      achievements_text: profile.achievements_text ?? '',
    });
    setSynced(true);
  }

  const saveMutation = useMutation({
    mutationFn: () =>
      apiClient.patch('/users/me', {
        phone: form.phone || null,
        bio: form.bio || null,
        experience_years: form.experience_years ? Number(form.experience_years) : 0,
        education: form.education || null,
        achievements_text: form.achievements_text || null,
      }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['teachers-home'] });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    },
  });

  const handlePhotoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setPhotoLoading(true);
    try {
      const fd = new FormData();
      fd.append('file', file);
      const res = await apiClient.post('/users/me/photo', fd, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      const newUrl: string = res.data.data.photo_url;
      if (user) setUser({ ...user, photo_url: newUrl } as any);
      qc.invalidateQueries({ queryKey: ['my-profile'] });
      qc.invalidateQueries({ queryKey: ['teachers-home'] });
    } catch {
      alert(t('teacher.profile.photoUploadFailed'));
    } finally {
      setPhotoLoading(false);
    }
  };

  const field = (label: string, key: keyof typeof form, opts?: {
    type?: string; placeholder?: string; textarea?: boolean; rows?: number;
  }) => (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      {opts?.textarea ? (
        <textarea
          className="input resize-none"
          rows={opts.rows ?? 3}
          placeholder={opts?.placeholder}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        />
      ) : (
        <input
          className="input"
          type={opts?.type ?? 'text'}
          placeholder={opts?.placeholder}
          value={form[key]}
          onChange={e => setForm(f => ({ ...f, [key]: e.target.value }))}
        />
      )}
    </div>
  );

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="card animate-pulse h-40" />
        <div className="card animate-pulse h-64" />
      </div>
    );
  }

  const photoUrl = profile?.photo_url ?? user?.photo_url;

  return (
    <div className="max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('teacher.profile.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('teacher.profile.subtitle')}</p>
      </div>

      {/* Photo card */}
      <div className="card flex items-center gap-5">
        <div className="relative shrink-0">
          {photoUrl ? (
            <img
              src={photoUrl}
              alt=""
              className="w-24 h-24 rounded-full object-cover border-4 border-blue-50 shadow"
            />
          ) : (
            <div className="w-24 h-24 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-3xl border-4 border-blue-50 shadow">
              {user?.full_name.charAt(0)}
            </div>
          )}
          <button
            onClick={() => fileRef.current?.click()}
            className="absolute -bottom-1 -right-1 bg-blue-600 hover:bg-blue-700 text-white rounded-full p-2 shadow-md transition-colors"
            title={t('teacher.profile.uploadPhoto')}
          >
            {photoLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Camera className="w-4 h-4" />}
          </button>
          <input
            ref={fileRef}
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="hidden"
            onChange={handlePhotoUpload}
          />
        </div>

        <div>
          <h2 className="text-xl font-bold text-gray-800">{profile?.full_name}</h2>
          <p className="text-sm text-gray-500 mt-0.5">@{profile?.login}</p>
          <p className="text-xs text-blue-700 bg-blue-50 px-2.5 py-1 rounded-full inline-block mt-2 font-medium">
            {t('teacher.profile.roleTeacher')}
          </p>
          <p className="text-xs text-gray-400 mt-2">
            {t('teacher.profile.photoHint')}
          </p>
        </div>
      </div>

      {/* Form */}
      <div className="card space-y-5">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100">
          <User className="w-4 h-4 text-blue-700" />
          <h3 className="font-semibold text-gray-800">{t('teacher.profile.personalInfo')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('teacher.profile.fullNameLabel')}</label>
            <input
              className="input bg-gray-50 cursor-not-allowed"
              value={profile?.full_name ?? ''}
              readOnly
              title={t('teacher.profile.fullNameReadonlyTitle')}
            />
          </div>
          {field(t('teacher.profile.phoneLabel'), 'phone', { placeholder: '+998 90 000 00 00' })}
        </div>

        <div>
          {field(t('teacher.profile.bioLabel'), 'bio', {
            textarea: true,
            rows: 3,
            placeholder: t('teacher.profile.bioPlaceholder'),
          })}
        </div>

        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 pt-2">
          <GraduationCap className="w-4 h-4 text-blue-700" />
          <h3 className="font-semibold text-gray-800">{t('teacher.profile.pedagogicalActivity')}</h3>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {field(t('teacher.profile.experienceLabel'), 'experience_years', {
            type: 'number',
            placeholder: '0',
          })}
          {field(t('teacher.profile.educationLabel'), 'education', {
            placeholder: t('teacher.profile.educationPlaceholder'),
          })}
        </div>

        <div>
          {field(t('teacher.profile.achievementsLabel'), 'achievements_text', {
            textarea: true,
            rows: 4,
            placeholder: t('teacher.profile.achievementsPlaceholder'),
          })}
        </div>

        <div className="flex items-center gap-3 pt-2">
          <button
            className="btn-primary flex items-center gap-2 disabled:opacity-50"
            onClick={() => saveMutation.mutate()}
            disabled={saveMutation.isPending}
          >
            {saveMutation.isPending ? (
              <><Loader2 className="w-4 h-4 animate-spin" />{t('common.saving')}</>
            ) : (
              <><Save className="w-4 h-4" />{t('common.save')}</>
            )}
          </button>

          {saved && (
            <span className="text-sm text-green-600 font-medium flex items-center gap-1">
              {t('teacher.profile.savedMsg')}
            </span>
          )}
        </div>
      </div>

      {/* Preview card — what public sees */}
      <div className="card">
        <div className="flex items-center gap-2 pb-3 border-b border-gray-100 mb-4">
          <Award className="w-4 h-4 text-amber-600" />
          <h3 className="font-semibold text-gray-800">{t('teacher.profile.publicPreview')}</h3>
          <span className="text-xs text-gray-400 ml-1">{t('teacher.profile.publicPreviewHint')}</span>
        </div>

        <div className="flex items-start gap-4">
          {photoUrl ? (
            <img src={photoUrl} alt="" className="w-14 h-14 rounded-full object-cover border-2 border-blue-100 shrink-0" />
          ) : (
            <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xl shrink-0">
              {user?.full_name.charAt(0)}
            </div>
          )}
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-gray-800">{profile?.full_name}</p>
            {form.education && <p className="text-sm text-gray-500 mt-0.5">{form.education}</p>}
            {form.bio && <p className="text-sm text-gray-600 mt-2 line-clamp-3">{form.bio}</p>}
            <div className="flex flex-wrap gap-3 mt-3 text-xs text-gray-500">
              {form.experience_years && (
                <span className="flex items-center gap-1">
                  <BookOpen className="w-3.5 h-3.5" />
                  {form.experience_years} {t('teacher.profile.experienceYearsSuffix')}
                </span>
              )}
              {form.phone && (
                <span className="flex items-center gap-1">
                  <Phone className="w-3.5 h-3.5" />
                  {form.phone}
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
