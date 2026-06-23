import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, X, Loader2, Save,
  Upload, AlertCircle, Building, Users,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { SchoolInfo, ManagementMember } from '../../types';

type Tab = 'info' | 'management';

const INFO_KEYS = [
  { key: 'history',    labelKey: 'public.about.historyTitle', multiline: true },
  { key: 'address',    labelKey: 'public.about.address',      multiline: false },
  { key: 'phone',      labelKey: 'public.about.phone',        multiline: false },
  { key: 'email',      labelKey: 'public.about.email',        multiline: false },
  { key: 'work_hours', labelKey: 'public.about.workHours',    multiline: false },
  { key: 'founded',    labelKey: 'admin.schoolInfo.foundedLabel', multiline: false },
];

// ===== MANAGEMENT MODAL =====
function ManagementModal({ member, onClose, onSaved }: {
  member?: ManagementMember | null;
  onClose: () => void;
  onSaved: () => void;
}) {
  const { t } = useTranslation();
  const fileRef = useRef<HTMLInputElement>(null);
  const [fullName, setFullName] = useState(member?.full_name ?? '');
  const [position, setPosition] = useState(member?.position ?? '');
  const [photoUrl, setPhotoUrl] = useState(member?.photo_url ?? '');
  const [phone, setPhone] = useState(member?.phone ?? '');
  const [email, setEmail] = useState(member?.email ?? '');
  const [orderNum, setOrderNum] = useState(String(member?.order_num ?? 0));
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handlePhotoUpload = async (file: File) => {
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await apiClient.post('/media/upload', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
      });
      setPhotoUrl(data.data.url);
    } catch {
      setError(t('admin.schoolInfo.photoUploadFailed'));
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async () => {
    if (!fullName.trim() || !position.trim()) { setError(t('admin.schoolInfo.nameAndPositionRequired')); return; }
    setSaving(true);
    setError('');
    try {
      const payload = {
        full_name: fullName.trim(),
        position: position.trim(),
        photo_url: photoUrl || null,
        phone: phone || null,
        email: email || null,
        order_num: Number(orderNum) || 0,
      };
      if (member) {
        await apiClient.put(`/school-info/management/${member.id}`, payload);
      } else {
        await apiClient.post('/school-info/management', payload);
      }
      onSaved();
      onClose();
    } catch (e: any) {
      setError(e.response?.data?.message || t('admin.schoolInfo.genericError'));
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {member ? t('admin.schoolInfo.editTitle') : t('admin.schoolInfo.addNewLeader')}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>
        <div className="p-5 space-y-4">
          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 rounded-lg px-3 py-2">
              <AlertCircle className="w-4 h-4 shrink-0" />{error}
            </div>
          )}

          {/* Photo */}
          <div className="flex items-center gap-4">
            <div className="w-20 h-20 rounded-full bg-gray-100 overflow-hidden flex items-center justify-center shrink-0 border-2 border-gray-200">
              {photoUrl
                ? <img src={photoUrl} alt="" className="w-full h-full object-cover" />
                : <span className="text-2xl text-gray-400">{fullName[0] || '?'}</span>
              }
            </div>
            <div>
              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={e => { const f = e.target.files?.[0]; if (f) handlePhotoUpload(f); }}
              />
              <button
                onClick={() => fileRef.current?.click()}
                disabled={uploading}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-sm bg-gray-100 hover:bg-gray-200 text-gray-700 transition-colors"
              >
                {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
                {uploading ? t('admin.schoolInfo.uploading') : t('admin.schoolInfo.uploadPhoto')}
              </button>
              {photoUrl && (
                <button onClick={() => setPhotoUrl('')} className="text-xs text-red-500 mt-1 block">
                  {t('admin.schoolInfo.removePhoto')}
                </button>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.schoolInfo.fullNameLabel')}</label>
            <input className="input" value={fullName} onChange={e => setFullName(e.target.value)} placeholder={t('admin.schoolInfo.fullNamePlaceholder')} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.schoolInfo.positionLabel')}</label>
            <input className="input" value={position} onChange={e => setPosition(e.target.value)} placeholder={t('admin.schoolInfo.positionPlaceholder')} />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.schoolInfo.phoneLabel')}</label>
              <input className="input" value={phone} onChange={e => setPhone(e.target.value)} placeholder="+998 91 234 56 78" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">{t('admin.schoolInfo.orderNumLabel')}</label>
              <input className="input" type="number" min="0" value={orderNum} onChange={e => setOrderNum(e.target.value)} />
            </div>
          </div>

          <div className="flex gap-3 pt-1">
            <button className="btn-outline flex-1" onClick={onClose} disabled={saving}>{t('common.cancel')}</button>
            <button
              className="btn-primary flex-1 flex items-center justify-center gap-2"
              onClick={handleSave}
              disabled={saving}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              {t('common.save')}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

// ===== SCHOOL INFO TAB =====
function SchoolInfoTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [editing, setEditing] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<Record<string, string>>({});
  const [saving, setSaving] = useState<string | null>(null);

  const { data: infoList = [] } = useQuery<SchoolInfo[]>({
    queryKey: ['school-info'],
    queryFn: () => apiClient.get('/school-info').then(r => r.data.data),
  });

  const infoMap = Object.fromEntries(infoList.map(i => [i.key, i]));

  const startEdit = (key: string) => {
    setEditing(key);
    setEditValues({ [key]: infoMap[key]?.content ?? '' });
  };

  const handleSave = async (key: string, label: string) => {
    setSaving(key);
    try {
      await apiClient.put(`/school-info/${key}`, {
        title: label,
        content: editValues[key] ?? '',
      });
      qc.invalidateQueries({ queryKey: ['school-info'] });
      setEditing(null);
    } finally {
      setSaving(null);
    }
  };

  return (
    <div className="space-y-4">
      {INFO_KEYS.map(({ key, labelKey, multiline }) => {
        const label = t(labelKey);
        const current = infoMap[key];
        const isEditing = editing === key;
        return (
          <div key={key} className="card">
            <div className="flex items-start justify-between gap-3 mb-2">
              <h3 className="font-medium text-gray-700">{label}</h3>
              {!isEditing && (
                <button
                  onClick={() => startEdit(key)}
                  className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 shrink-0"
                >
                  <Pencil className="w-3 h-3" /> {t('admin.schoolInfo.editButton')}
                </button>
              )}
            </div>

            {isEditing ? (
              <div className="space-y-3">
                {multiline ? (
                  <textarea
                    className="input resize-none w-full"
                    rows={4}
                    value={editValues[key] ?? ''}
                    onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                ) : (
                  <input
                    className="input w-full"
                    value={editValues[key] ?? ''}
                    onChange={e => setEditValues(prev => ({ ...prev, [key]: e.target.value }))}
                  />
                )}
                <div className="flex gap-2">
                  <button className="btn-outline text-sm px-3 py-1.5" onClick={() => setEditing(null)}>{t('common.cancel')}</button>
                  <button
                    className="btn-primary text-sm px-3 py-1.5 flex items-center gap-1.5"
                    onClick={() => handleSave(key, label)}
                    disabled={saving === key}
                  >
                    {saving === key ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
                    {t('common.save')}
                  </button>
                </div>
              </div>
            ) : (
              <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-wrap">
                {current?.content || <span className="text-gray-400 italic">{t('admin.schoolInfo.notSet')}</span>}
              </p>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ===== MANAGEMENT TAB =====
function ManagementTab() {
  const { t } = useTranslation();
  const qc = useQueryClient();
  const [modalOpen, setModalOpen] = useState(false);
  const [editMember, setEditMember] = useState<ManagementMember | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [deleting, setDeleting] = useState(false);

  const { data: members = [], isLoading } = useQuery<ManagementMember[]>({
    queryKey: ['management'],
    queryFn: () => apiClient.get('/school-info/management/list').then(r => r.data.data),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['management'] });

  const handleDelete = async () => {
    if (!deleteId) return;
    setDeleting(true);
    await apiClient.delete(`/school-info/management/${deleteId}`);
    setDeleting(false);
    setDeleteId(null);
    refresh();
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <button
          className="btn-primary flex items-center gap-2"
          onClick={() => { setEditMember(null); setModalOpen(true); }}
        >
          <Plus className="w-4 h-4" /> {t('admin.schoolInfo.newLeader')}
        </button>
      </div>

      {isLoading ? (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
        </div>
      ) : members.length === 0 ? (
        <div className="card text-center py-12 text-gray-400">
          <Users className="w-10 h-10 mx-auto mb-2 opacity-30" />
          <p>{t('admin.schoolInfo.noMembers')}</p>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map(m => (
            <div key={m.id} className="card flex flex-col items-center text-center gap-3 relative">
              {/* Actions */}
              <div className="absolute top-3 right-3 flex gap-1">
                <button
                  onClick={() => { setEditMember(m); setModalOpen(true); }}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors"
                >
                  <Pencil className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={() => setDeleteId(m.id)}
                  className="p-1.5 rounded-lg bg-gray-100 hover:bg-red-50 text-gray-400 hover:text-red-600 transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              <div className="w-20 h-20 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center border-2 border-blue-100">
                {m.photo_url
                  ? <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                  : <span className="text-2xl font-bold text-blue-700">{m.full_name[0]}</span>
                }
              </div>
              <div>
                <p className="font-semibold text-gray-800 text-sm">{m.full_name}</p>
                <p className="text-xs text-blue-600 mt-0.5">{m.position}</p>
                {m.phone && <p className="text-xs text-gray-400 mt-1">{m.phone}</p>}
              </div>
            </div>
          ))}
        </div>
      )}

      {modalOpen && (
        <ManagementModal
          member={editMember}
          onClose={() => setModalOpen(false)}
          onSaved={refresh}
        />
      )}

      {deleteId !== null && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
            <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <h3 className="font-semibold text-gray-800 mb-2">{t('admin.schoolInfo.confirmDeleteTitle')}</h3>
            <p className="text-sm text-gray-500 mb-5">{t('admin.schoolInfo.confirmDeleteDesc')}</p>
            <div className="flex gap-3">
              <button className="btn-outline flex-1" onClick={() => setDeleteId(null)}>{t('common.cancel')}</button>
              <button
                className="flex-1 bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors flex items-center justify-center gap-2"
                onClick={handleDelete}
                disabled={deleting}
              >
                {deleting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
                {t('common.delete')}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ===== MAIN PAGE =====
export default function SchoolInfoManagePage() {
  const { t } = useTranslation();
  const [tab, setTab] = useState<Tab>('info');

  return (
    <div className="space-y-5">
      <div>
        <h1 className="text-2xl font-bold text-gray-800">{t('admin.schoolInfo.title')}</h1>
        <p className="text-sm text-gray-500 mt-0.5">{t('admin.schoolInfo.subtitle')}</p>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setTab('info')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'info' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Building className="w-4 h-4" /> {t('admin.schoolInfo.tabInfo')}
        </button>
        <button
          onClick={() => setTab('management')}
          className={`flex items-center gap-2 px-4 py-2.5 text-sm font-medium border-b-2 transition-colors ${
            tab === 'management' ? 'border-blue-600 text-blue-700' : 'border-transparent text-gray-500 hover:text-gray-700'
          }`}
        >
          <Users className="w-4 h-4" /> {t('admin.schoolInfo.tabManagement')}
        </button>
      </div>

      {tab === 'info' ? <SchoolInfoTab /> : <ManagementTab />}
    </div>
  );
}
