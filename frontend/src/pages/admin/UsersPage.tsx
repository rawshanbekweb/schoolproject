import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  Plus, Pencil, Trash2, X, Loader2, Search,
  Users, ShieldCheck, BookOpen, UserCheck, UserX, Key,
} from 'lucide-react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { apiClient } from '../../api/client';
import { User, Subject } from '../../types';

// ── Types ──
interface UserWithSubjects extends User {
  subjects: { id: number; name: string }[];
}

const ROLE_LABELS: Record<string, string> = {
  super_admin: 'Super Admin',
  content_manager: 'Content Manager',
  teacher: "O'qituvchi",
};
const ROLE_COLORS: Record<string, string> = {
  super_admin: 'badge-red',
  content_manager: 'badge-amber',
  teacher: 'badge-blue',
};

// ── Schemas ──
const createSchema = z.object({
  login: z.string().min(3, 'Kamida 3 belgi').max(100),
  password: z.string().min(6, 'Kamida 6 belgi'),
  full_name: z.string().min(2, 'Kamida 2 belgi').max(200),
  role: z.enum(['super_admin', 'content_manager', 'teacher']),
  phone: z.string().optional(),
  subject_ids: z.array(z.number()).optional(),
});
const editSchema = createSchema.omit({ password: true }).extend({
  password: z.string().min(6).optional().or(z.literal('')),
});

type CreateForm = z.infer<typeof createSchema>;
type EditForm = z.infer<typeof editSchema>;

// ── User Modal ──
function UserModal({
  user, subjects, onClose, onSaved,
}: {
  user?: UserWithSubjects | null;
  subjects: Subject[];
  onClose: () => void;
  onSaved: () => void;
}) {
  const isEdit = !!user;
  const schema = isEdit ? editSchema : createSchema;

  const { register, handleSubmit, watch, control, formState: { errors, isSubmitting } } = useForm<any>({
    resolver: zodResolver(schema),
    defaultValues: isEdit
      ? {
          login: user!.login,
          full_name: user!.full_name,
          role: user!.role,
          phone: user!.phone ?? '',
          password: '',
          subject_ids: user!.subjects?.map(s => s.id) ?? [],
        }
      : { role: 'teacher', subject_ids: [] },
  });

  const role = watch('role');
  const selectedSubjects: number[] = watch('subject_ids') ?? [];

  const onSubmit = async (data: any) => {
    const payload = { ...data };
    if (isEdit && !payload.password) delete payload.password;
    if (payload.role !== 'teacher') payload.subject_ids = [];

    if (isEdit) {
      await apiClient.patch(`/users/${user!.id}`, payload);
    } else {
      await apiClient.post('/users', payload);
    }
    onSaved();
    onClose();
  };

  const toggleSubject = (id: number, current: number[], onChange: (v: number[]) => void) => {
    onChange(current.includes(id) ? current.filter(x => x !== id) : [...current, id]);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="font-semibold text-gray-800">
            {isEdit ? 'Foydalanuvchini tahrirlash' : 'Yangi foydalanuvchi'}
          </h2>
          <button onClick={onClose} className="p-1.5 rounded-lg hover:bg-gray-100">
            <X className="w-5 h-5 text-gray-500" />
          </button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="p-5 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Ism familiya <span className="text-red-500">*</span>
              </label>
              <input className="input" {...register('full_name')} placeholder="Alisher Toshmatov" />
              {errors.full_name && <p className="text-red-500 text-xs mt-1">{String(errors.full_name.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">Telefon</label>
              <input className="input" {...register('phone')} placeholder="+998 90 000 00 00" />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Login <span className="text-red-500">*</span>
              </label>
              <input className="input" {...register('login')} placeholder="login123" disabled={isEdit} />
              {errors.login && <p className="text-red-500 text-xs mt-1">{String(errors.login.message)}</p>}
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parol {isEdit && <span className="text-gray-400 font-normal">(o'zgartirmaslik uchun bo'sh)</span>}
                {!isEdit && <span className="text-red-500"> *</span>}
              </label>
              <div className="relative">
                <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-400" />
                <input className="input pl-8" type="password" {...register('password')} placeholder="••••••" />
              </div>
              {errors.password && <p className="text-red-500 text-xs mt-1">{String(errors.password.message)}</p>}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Rol <span className="text-red-500">*</span>
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['teacher', 'content_manager', 'super_admin'] as const).map(r => (
                <label key={r} className={`flex items-center gap-2 p-3 rounded-xl border-2 cursor-pointer transition-colors ${
                  role === r ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-gray-300'
                }`}>
                  <input type="radio" value={r} {...register('role')} className="sr-only" />
                  <span className="text-xs font-medium text-gray-700">{ROLE_LABELS[r]}</span>
                </label>
              ))}
            </div>
          </div>

          {role === 'teacher' && subjects.length > 0 && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Biriktirilgan fanlar</label>
              <Controller
                name="subject_ids"
                control={control}
                render={({ field }) => (
                  <div className="flex flex-wrap gap-2">
                    {subjects.map(s => {
                      const sel = (field.value as number[]).includes(s.id);
                      return (
                        <button
                          key={s.id}
                          type="button"
                          onClick={() => toggleSubject(s.id, field.value as number[], field.onChange)}
                          className={`px-3 py-1.5 rounded-lg text-xs font-medium border-2 transition-colors ${
                            sel
                              ? 'border-blue-500 bg-blue-50 text-blue-700'
                              : 'border-gray-200 text-gray-600 hover:border-gray-300'
                          }`}
                        >
                          {s.icon} {s.name}
                        </button>
                      );
                    })}
                  </div>
                )}
              />
            </div>
          )}

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

// ── Delete Confirm ──
function DeleteConfirm({ userId, name, onClose, onDone }: {
  userId: number; name: string; onClose: () => void; onDone: () => void;
}) {
  const [loading, setLoading] = useState(false);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center">
        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
          <Trash2 className="w-6 h-6 text-red-600" />
        </div>
        <h3 className="font-semibold text-gray-800 mb-1">O'chirasizmi?</h3>
        <p className="text-sm text-gray-500 mb-5"><strong>{name}</strong> o'chiriladi</p>
        <div className="flex gap-3">
          <button className="btn-outline flex-1" onClick={onClose}>Bekor</button>
          <button
            className="flex-1 bg-red-600 hover:bg-red-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
            disabled={loading}
            onClick={async () => {
              setLoading(true);
              await apiClient.delete(`/users/${userId}`);
              onDone();
              onClose();
            }}
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Trash2 className="w-4 h-4" />}
            O'chirish
          </button>
        </div>
      </div>
    </div>
  );
}

// ── Main ──
export default function UsersPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [modalUser, setModalUser] = useState<UserWithSubjects | null | undefined>(undefined);
  const [deleteUser, setDeleteUser] = useState<UserWithSubjects | null>(null);

  const { data: users = [], isLoading } = useQuery<UserWithSubjects[]>({
    queryKey: ['users'],
    queryFn: () => apiClient.get('/users').then(r => r.data.data),
  });

  const { data: subjects = [] } = useQuery<Subject[]>({
    queryKey: ['subjects-all'],
    queryFn: () => apiClient.get('/questions/subjects?all=true').then(r => r.data.data),
  });

  const toggleActive = useMutation({
    mutationFn: (user: UserWithSubjects) =>
      apiClient.patch(`/users/${user.id}`, { is_active: !user.is_active }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['users'] }),
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ['users'] });

  const filtered = users.filter(u => {
    const matchSearch = !search || u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.login.toLowerCase().includes(search.toLowerCase());
    const matchRole = !roleFilter || u.role === roleFilter;
    return matchSearch && matchRole;
  });

  const counts = {
    all: users.length,
    teacher: users.filter(u => u.role === 'teacher').length,
    content_manager: users.filter(u => u.role === 'content_manager').length,
    super_admin: users.filter(u => u.role === 'super_admin').length,
  };

  return (
    <div className="space-y-5">
      <div className="flex items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Foydalanuvchilar</h1>
          <p className="text-sm text-gray-500 mt-0.5">{users.length} ta foydalanuvchi</p>
        </div>
        <button className="btn-primary flex items-center gap-2" onClick={() => setModalUser(null)}>
          <Plus className="w-4 h-4" /> Yangi foydalanuvchi
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: 'Jami', value: counts.all, icon: Users, color: 'bg-gray-50 text-gray-700' },
          { label: "O'qituvchilar", value: counts.teacher, icon: BookOpen, color: 'bg-blue-50 text-blue-700' },
          { label: 'Content Manager', value: counts.content_manager, icon: ShieldCheck, color: 'bg-amber-50 text-amber-700' },
          { label: 'Super Admin', value: counts.super_admin, icon: ShieldCheck, color: 'bg-red-50 text-red-700' },
        ].map(s => {
          const Icon = s.icon;
          return (
            <div key={s.label} className="card py-3 flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 ${s.color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xl font-bold text-gray-800">{s.value}</p>
                <p className="text-xs text-gray-500">{s.label}</p>
              </div>
            </div>
          );
        })}
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input className="input pl-9" placeholder="Ism yoki login bo'yicha qidirish..."
            value={search} onChange={e => setSearch(e.target.value)} />
        </div>
        <div className="flex gap-1.5 bg-gray-100 p-1 rounded-xl">
          {[
            { value: '', label: 'Barchasi' },
            { value: 'teacher', label: "O'qituvchi" },
            { value: 'content_manager', label: 'CM' },
            { value: 'super_admin', label: 'Admin' },
          ].map(f => (
            <button key={f.value} onClick={() => setRoleFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                roleFilter === f.value ? 'bg-white shadow-sm text-blue-800' : 'text-gray-600'
              }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="card animate-pulse h-14" />
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="card flex flex-col items-center py-14 text-gray-400">
          <Users className="w-12 h-12 mb-3 opacity-30" />
          <p className="text-gray-500">Hech narsa topilmadi</p>
        </div>
      ) : (
        <div className="card overflow-hidden p-0">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-gray-50 border-b border-gray-100">
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Foydalanuvchi</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden sm:table-cell">Login</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Rol</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3 hidden md:table-cell">Fanlar</th>
                <th className="text-left text-xs font-semibold text-gray-500 px-4 py-3">Holat</th>
                <th className="text-right text-xs font-semibold text-gray-500 px-4 py-3">Amallar</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {filtered.map(u => (
                <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-2.5">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center shrink-0">
                        <span className="text-blue-700 text-xs font-bold">{u.full_name.charAt(0)}</span>
                      </div>
                      <div>
                        <p className="font-medium text-gray-800 text-sm">{u.full_name}</p>
                        <p className="text-xs text-gray-400 sm:hidden">{u.login}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3 hidden sm:table-cell">
                    <span className="text-gray-500 font-mono text-xs">{u.login}</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${ROLE_COLORS[u.role]}`}>{ROLE_LABELS[u.role]}</span>
                  </td>
                  <td className="px-4 py-3 hidden md:table-cell">
                    {u.subjects?.length ? (
                      <div className="flex flex-wrap gap-1">
                        {u.subjects.slice(0, 2).map(s => (
                          <span key={s.id} className="text-xs text-gray-500 bg-gray-50 rounded px-1.5 py-0.5">{s.name}</span>
                        ))}
                        {u.subjects.length > 2 && <span className="text-xs text-gray-400">+{u.subjects.length - 2}</span>}
                      </div>
                    ) : <span className="text-gray-300 text-xs">—</span>}
                  </td>
                  <td className="px-4 py-3">
                    <button
                      onClick={() => toggleActive.mutate(u)}
                      className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-lg transition-colors ${
                        u.is_active
                          ? 'bg-green-50 text-green-700 hover:bg-green-100'
                          : 'bg-gray-100 text-gray-500 hover:bg-gray-200'
                      }`}
                    >
                      {u.is_active ? <><UserCheck className="w-3 h-3" />Faol</> : <><UserX className="w-3 h-3" />Nofaol</>}
                    </button>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      <button onClick={() => setModalUser(u)}
                        className="p-1.5 rounded-lg hover:bg-blue-50 text-gray-400 hover:text-blue-600 transition-colors">
                        <Pencil className="w-4 h-4" />
                      </button>
                      <button onClick={() => setDeleteUser(u)}
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

      {modalUser !== undefined && (
        <UserModal
          user={modalUser}
          subjects={subjects}
          onClose={() => setModalUser(undefined)}
          onSaved={refresh}
        />
      )}
      {deleteUser && (
        <DeleteConfirm
          userId={deleteUser.id}
          name={deleteUser.full_name}
          onClose={() => setDeleteUser(null)}
          onDone={refresh}
        />
      )}
    </div>
  );
}
