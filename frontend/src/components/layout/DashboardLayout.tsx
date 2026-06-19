import { Outlet, Link, useLocation, useNavigate } from 'react-router-dom';
import {
  GraduationCap, LayoutDashboard, Users, Newspaper,
  Trophy, BarChart3, BookOpen, ClipboardList, LogOut, Menu, X, Home
} from 'lucide-react';
import { useState } from 'react';
import { useAuthStore } from '../../store/authStore';
import { apiClient } from '../../api/client';

interface DashboardLayoutProps {
  role: 'admin' | 'teacher';
}

const adminLinks = [
  { to: '/admin', label: 'Dashboard', icon: LayoutDashboard, exact: true },
  { to: '/admin/users', label: 'Foydalanuvchilar', icon: Users },
  { to: '/admin/subjects', label: 'Fanlar', icon: BookOpen },
  { to: '/admin/news', label: 'Yangiliklar', icon: Newspaper },
  { to: '/admin/achievements', label: 'Maktab faxrlari', icon: Trophy },
  { to: '/admin/analytics', label: 'Analitika', icon: BarChart3 },
];

const teacherLinks = [
  { to: '/teacher', label: 'Kabinet', icon: LayoutDashboard, exact: true },
  { to: '/teacher/questions', label: 'Test savollari', icon: BookOpen },
  { to: '/teacher/control-works', label: 'Nazorat ishlari', icon: ClipboardList },
];

export default function DashboardLayout({ role }: DashboardLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const { pathname } = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();

  const links = role === 'admin' ? adminLinks : teacherLinks;

  const handleLogout = async () => {
    await apiClient.post('/auth/logout');
    logout();
    navigate('/login');
  };

  const isActive = (to: string, exact?: boolean) =>
    exact ? pathname === to : pathname.startsWith(to);

  const Sidebar = () => (
    <div className="flex flex-col h-full">
      {/* Logo */}
      <div className="p-5 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="bg-blue-800 rounded-xl p-2">
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <p className="font-semibold text-sm text-gray-800">14-Maktab</p>
            <p className="text-xs text-gray-500">
              {role === 'admin' ? 'Admin Panel' : 'O\'qituvchi Kabineti'}
            </p>
          </div>
        </div>
      </div>

      {/* User info */}
      <div className="p-4 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-blue-100 rounded-full flex items-center justify-center">
            <span className="text-blue-800 font-semibold text-sm">
              {user?.full_name.charAt(0)}
            </span>
          </div>
          <div className="overflow-hidden">
            <p className="text-sm font-medium text-gray-800 truncate">{user?.full_name}</p>
            <p className="text-xs text-gray-500">
              {user?.role === 'super_admin' ? 'Super Admin' :
               user?.role === 'content_manager' ? 'Content Manager' : 'O\'qituvchi'}
            </p>
          </div>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 p-3 space-y-1">
        <Link
          to="/"
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-gray-500 hover:bg-gray-50 hover:text-gray-700 transition-colors"
        >
          <Home className="w-4 h-4" />
          Asosiy saytga
        </Link>
        <div className="border-t border-gray-100 my-2" />
        {links.map(link => {
          const Icon = link.icon;
          const active = isActive(link.to, link.exact);
          return (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setSidebarOpen(false)}
              className={`flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? 'bg-blue-50 text-blue-800'
                  : 'text-gray-600 hover:bg-gray-50 hover:text-gray-800'
              }`}
            >
              <Icon className={`w-4 h-4 ${active ? 'text-blue-700' : ''}`} />
              {link.label}
            </Link>
          );
        })}
      </nav>

      {/* Logout */}
      <div className="p-3 border-t border-gray-100">
        <button
          onClick={handleLogout}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm text-red-500 hover:bg-red-50 w-full transition-colors"
        >
          <LogOut className="w-4 h-4" />
          Chiqish
        </button>
      </div>
    </div>
  );

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Desktop sidebar */}
      <aside className="hidden md:flex w-60 bg-white border-r border-gray-200 flex-col flex-shrink-0">
        <Sidebar />
      </aside>

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div className="md:hidden fixed inset-0 z-50 flex">
          <div className="w-60 bg-white shadow-xl">
            <Sidebar />
          </div>
          <div className="flex-1 bg-black/30" onClick={() => setSidebarOpen(false)} />
        </div>
      )}

      {/* Main content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Mobile header */}
        <header className="md:hidden bg-white border-b border-gray-200 px-4 py-3 flex items-center gap-3">
          <button onClick={() => setSidebarOpen(true)} className="p-1.5 rounded-lg hover:bg-gray-100">
            <Menu className="w-5 h-5" />
          </button>
          <span className="font-semibold text-gray-800 text-sm">
            {role === 'admin' ? 'Admin Panel' : 'O\'qituvchi Kabineti'}
          </span>
        </header>

        {/* Page */}
        <main className="flex-1 overflow-auto p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
