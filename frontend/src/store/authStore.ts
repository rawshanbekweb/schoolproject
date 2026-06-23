import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { User, UserRole } from '../types';

interface AuthStore {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;

  setAuth: (user: User, token: string) => void;
  setUser: (user: User) => void;
  logout: () => void;
  hasRole: (...roles: UserRole[]) => boolean;
}

export const useAuthStore = create<AuthStore>()(
  persist(
    (set, get) => ({
      user: null,
      accessToken: null,
      isAuthenticated: false,

      setAuth: (user, accessToken) => {
        localStorage.setItem('accessToken', accessToken);
        set({ user, accessToken, isAuthenticated: true });
      },

      setUser: (user) => set({ user }),

      logout: () => {
        localStorage.removeItem('accessToken');
        set({ user: null, accessToken: null, isAuthenticated: false });
      },

      hasRole: (...roles) => {
        const { user } = get();
        return !!user && roles.includes(user.role);
      },
    }),
    {
      name: 'maktab-auth',
      partialize: (state) => ({ user: state.user, isAuthenticated: state.isAuthenticated }),
    }
  )
);
