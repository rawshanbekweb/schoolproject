import { Outlet } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, ChevronDown } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { useAuthStore } from '../../store/authStore';

const navLinks = [
  { to: '/',              label: 'Bosh sahifa' },
  { to: '/about',         label: 'Maktab haqida' },
  { to: '/teachers',      label: "O'qituvchilar" },
  { to: '/news',          label: 'Yangiliklar' },
  { to: '/achievements',  label: 'Maktab faxrlari' },
  { to: '/schedule',      label: 'Dars jadvali' },
  { to: '/tests',         label: 'Testlar' },
  { to: '/control-works', label: 'Nazorat ishlari' },
  { to: '/documents',     label: 'Hujjatlar' },
  { to: '/gallery',       label: 'Galereya' },
  { to: '/contact',       label: "Bog'lanish" },
];

// Desktop uchun: birinchi 5 havola to'g'ridan-to'g'ri, qolganlari "Ko'proq" dropdown da
const MAIN_LINKS = navLinks.slice(0, 6);
const MORE_LINKS = navLinks.slice(6);

export default function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const moreRef = useRef<HTMLDivElement>(null);

  // Tashqariga bosilganda "Ko'proq" ni yopish
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (moreRef.current && !moreRef.current.contains(e.target as Node)) {
        setMoreOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const isActive = (to: string) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar */}
      <header className="bg-blue-900 text-white sticky top-0 z-50 shadow-lg">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0">
              <div className="bg-white/10 rounded-lg p-1.5">
                <GraduationCap className="w-5 h-5" />
              </div>
              <div>
                <p className="font-semibold text-sm leading-tight">14-Maktab</p>
                <p className="text-blue-300 text-xs">Shomanay tumani</p>
              </div>
            </Link>

            {/* Desktop nav */}
            <nav className="hidden lg:flex items-center gap-0.5">
              {MAIN_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-2.5 py-2 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                    isActive(link.to)
                      ? 'bg-white/20 text-white'
                      : 'text-blue-200 hover:text-white hover:bg-white/10'
                  }`}
                >
                  {link.label}
                </Link>
              ))}

              {/* Ko'proq dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className="flex items-center gap-1 px-2.5 py-2 rounded-lg text-xs font-medium text-blue-200 hover:text-white hover:bg-white/10 transition-colors"
                >
                  Ko'proq <ChevronDown className={`w-3 h-3 transition-transform ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <div className="absolute top-full right-0 mt-1 bg-white rounded-xl shadow-xl py-1 min-w-[160px] border border-gray-100">
                    {MORE_LINKS.map(link => (
                      <Link
                        key={link.to}
                        to={link.to}
                        onClick={() => setMoreOpen(false)}
                        className={`block px-4 py-2 text-sm transition-colors ${
                          isActive(link.to)
                            ? 'bg-blue-50 text-blue-700 font-medium'
                            : 'text-gray-700 hover:bg-gray-50'
                        }`}
                      >
                        {link.label}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Auth button */}
            <div className="hidden lg:flex items-center gap-2">
              {isAuthenticated ? (
                <Link
                  to={user?.role === 'teacher' ? '/teacher' : '/admin'}
                  className="bg-amber-500 hover:bg-amber-400 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Kabinet
                </Link>
              ) : (
                <Link
                  to="/login"
                  className="bg-white/10 hover:bg-white/20 text-white px-4 py-1.5 rounded-lg text-sm font-medium transition-colors"
                >
                  Kirish
                </Link>
              )}
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMenuOpen(!menuOpen)}
              className="lg:hidden p-2 rounded-lg hover:bg-white/10"
            >
              {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {menuOpen && (
          <div className="lg:hidden border-t border-blue-800 bg-blue-900 px-4 py-3 space-y-0.5 max-h-[80vh] overflow-y-auto">
            {navLinks.map(link => (
              <Link
                key={link.to}
                to={link.to}
                onClick={() => setMenuOpen(false)}
                className={`block px-3 py-2.5 rounded-lg text-sm ${
                  isActive(link.to) ? 'bg-white/20 text-white' : 'text-blue-200 hover:bg-white/10'
                }`}
              >
                {link.label}
              </Link>
            ))}
            <div className="pt-2 border-t border-blue-800 mt-2">
              <Link
                to={isAuthenticated ? (user?.role === 'teacher' ? '/teacher' : '/admin') : '/login'}
                onClick={() => setMenuOpen(false)}
                className="block px-3 py-2.5 rounded-lg text-sm text-amber-300 hover:bg-white/10"
              >
                {isAuthenticated ? 'Kabinet' : 'Kirish'}
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Page content */}
      <main className="flex-1">
        <Outlet />
      </main>

      {/* Footer */}
      <footer className="bg-blue-900 text-blue-200 py-10 mt-12">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-3">
                <GraduationCap className="w-5 h-5 text-white" />
                <span className="text-white font-semibold">Shomanay 14-Maktab</span>
              </div>
              <p className="text-sm text-blue-300">Qoraqalpog'iston Respublikasi, Shomanay tumani</p>
            </div>
            <div>
              <p className="text-white font-medium mb-3 text-sm">Sahifalar</p>
              <div className="grid grid-cols-2 gap-1">
                {navLinks.slice(0, 6).map(l => (
                  <Link key={l.to} to={l.to} className="text-xs text-blue-300 hover:text-white transition-colors py-0.5">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-white font-medium mb-3 text-sm">Bog'lanish</p>
              <div className="space-y-1">
                {navLinks.slice(6).map(l => (
                  <Link key={l.to} to={l.to} className="block text-xs text-blue-300 hover:text-white transition-colors py-0.5">
                    {l.label}
                  </Link>
                ))}
              </div>
            </div>
          </div>
          <div className="border-t border-blue-800 pt-6 text-center">
            <p className="text-xs text-blue-400">© {new Date().getFullYear()} Barcha huquqlar himoyalangan</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
