import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff, GraduationCap, Loader2 } from 'lucide-react';
import { apiClient } from '../../api/client';
import { useAuthStore } from '../../store/authStore';

const schema = z.object({
  login: z.string().min(3, 'Login kamida 3 belgi'),
  password: z.string().min(4, 'Parol kamida 4 belgi'),
});

type FormData = z.infer<typeof schema>;

export default function LoginPage() {
  const navigate = useNavigate();
  const { setAuth, user } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');

  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  // Agar allaqachon login qilingan bo'lsa
  if (user) {
    const path = user.role === 'teacher' ? '/teacher' : '/admin';
    navigate(path, { replace: true });
  }

  const onSubmit = async (data: FormData) => {
    setError('');
    try {
      const res = await apiClient.post('/auth/login', data);
      const { accessToken, user } = res.data.data;
      setAuth(user, accessToken);
      navigate(user.role === 'teacher' ? '/teacher' : '/admin', { replace: true });
    } catch (err: any) {
      setError(err.response?.data?.message || 'Login yoki parol noto\'g\'ri');
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/10 rounded-2xl mb-4 backdrop-blur-sm">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-2xl font-bold text-white">Shomanay 14-Maktab</h1>
          <p className="text-blue-200 mt-1 text-sm">Boshqaruv Tizimi</p>
        </div>

        {/* Form */}
        <div className="bg-white rounded-2xl shadow-2xl p-8">
          <h2 className="text-xl font-semibold text-gray-800 mb-6">Tizimga kirish</h2>

          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Login
              </label>
              <input
                {...register('login')}
                className="input"
                placeholder="Login kiriting"
                autoComplete="username"
              />
              {errors.login && (
                <p className="text-red-500 text-xs mt-1">{errors.login.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1.5">
                Parol
              </label>
              <div className="relative">
                <input
                  {...register('password')}
                  type={showPassword ? 'text' : 'password'}
                  className="input pr-10"
                  placeholder="Parol kiriting"
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {errors.password && (
                <p className="text-red-500 text-xs mt-1">{errors.password.message}</p>
              )}
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-3">
                <p className="text-red-600 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="btn-primary w-full flex items-center justify-center gap-2 py-2.5"
            >
              {isSubmitting ? (
                <><Loader2 className="w-4 h-4 animate-spin" /> Kirish...</>
              ) : (
                'Kirish'
              )}
            </button>
          </form>

          <p className="text-center text-xs text-gray-400 mt-6">
            Shomanay tumani 14-umumiy o'rta ta'lim maktabi
          </p>
        </div>
      </div>
    </div>
  );
}
