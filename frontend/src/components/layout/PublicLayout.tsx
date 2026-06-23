import { Outlet } from 'react-router-dom';
import { Link, useLocation } from 'react-router-dom';
import { GraduationCap, Menu, X, ChevronDown, Phone, Mail } from 'lucide-react';
import { Suspense, useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '../../store/authStore';
import PageLoader from '../ui/PageLoader';
import { LANG_STORAGE_KEY, SUPPORTED_LANGS } from '../../i18n/config';
import { apiClient } from '../../api/client';
import { SchoolInfo } from '../../types';

const DEFAULT_ADDRESS = "Qoraqalpog'iston Respublikasi, Shomanay tumani, Markaziy ko'cha, 14-maktab";

const navLinks = [
  { to: '/',              labelKey: 'nav.home' },
  { to: '/about',         labelKey: 'nav.about' },
  { to: '/teachers',      labelKey: 'nav.teachers' },
  { to: '/news',          labelKey: 'nav.news' },
  { to: '/achievements',  labelKey: 'nav.achievements' },
  { to: '/schedule',      labelKey: 'nav.schedule' },
  { to: '/tests',         labelKey: 'nav.tests' },
  { to: '/block-tests',   labelKey: 'nav.blockTests' },
  { to: '/contact',       labelKey: 'nav.contact' },
];

// Desktop uchun: birinchi havolalar to'g'ridan-to'g'ri, qolganlari "Ko'proq" dropdown da
const MAIN_LINKS = navLinks.slice(0, 6);
const MORE_LINKS = navLinks.slice(6);

// ===== Til almashtirish =====
const LANGUAGES = [
  { code: 'uz', label: "O'zbekcha", flag: '/images/flags/uz.png' },
  { code: 'ru', label: 'Русский', flag: '/images/flags/ru.png' },
  { code: 'en', label: 'English', flag: '/images/flags/en.png' },
  { code: 'kaa', label: 'Qaraqalpaqsha', flag: '/images/flags/kaa.png' },
];

function LanguageSwitcher({ transparent = false }: { transparent?: boolean }) {
  const { i18n, t } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const current = LANGUAGES.find(l => l.code === i18n.language) ?? LANGUAGES[0];

  const handleSelect = (code: string) => {
    if (!SUPPORTED_LANGS.includes(code as any)) return;
    i18n.changeLanguage(code);
    localStorage.setItem(LANG_STORAGE_KEY, code);
    setOpen(false);
  };

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(o => !o)}
        className={`flex items-center gap-1.5 rounded-full pl-2.5 pr-2 py-1.5 text-sm font-medium transition-all duration-300 ease-out ${
          transparent
            ? 'bg-white/10 hover:bg-white/20 text-white border border-white/15 backdrop-blur-sm'
            : 'bg-gray-50 hover:shadow-md shadow-sm text-gray-700'
        }`}
      >
        <img src={current.flag} alt={current.code} className="w-5 h-3.5 object-cover rounded-sm shadow-sm" />
        <span className="hidden sm:inline text-xs">{current.code.toUpperCase()}</span>
        <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${transparent ? 'text-white/70' : 'text-gray-400'} ${open ? 'rotate-180' : ''}`} />
      </button>
      {open && (
        <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl py-1 min-w-[170px] border border-gray-100 z-50 origin-top-right animate-fade-in">
          {LANGUAGES.map(l => {
            const supported = SUPPORTED_LANGS.includes(l.code as any);
            return (
              <button
                key={l.code}
                onClick={() => handleSelect(l.code)}
                disabled={!supported}
                className={`w-full flex items-center gap-2.5 px-4 py-2 text-sm text-left transition-colors ${
                  !supported
                    ? 'text-gray-300 cursor-not-allowed'
                    : current.code === l.code
                    ? 'bg-blue-50 text-blue-700 font-medium'
                    : 'text-gray-700 hover:bg-gray-50'
                }`}
              >
                <img src={l.flag} alt={l.code} className={`w-5 h-3.5 object-cover rounded-sm shadow-sm ${!supported ? 'opacity-40' : ''}`} />
                {l.label}
                {!supported && <span className="text-[10px] ml-auto text-gray-400">({t('common.comingSoon')})</span>}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

export default function PublicLayout() {
  const { t } = useTranslation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);
  const { pathname } = useLocation();
  const { isAuthenticated, user } = useAuthStore();
  const moreRef = useRef<HTMLDivElement>(null);

  const { data: infoList = [] } = useQuery<SchoolInfo[]>({
    queryKey: ['school-info'],
    queryFn: () => apiClient.get('/school-info').then(r => r.data.data),
    staleTime: 5 * 60 * 1000,
  });
  const address = infoList.find(i => i.key === 'address')?.content ?? DEFAULT_ADDRESS;
  const phone = infoList.find(i => i.key === 'phone')?.content;
  const email = infoList.find(i => i.key === 'email')?.content;

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

  useEffect(() => {
    document.body.style.overflow = menuOpen ? 'hidden' : '';
    return () => { document.body.style.overflow = ''; };
  }, [menuOpen]);

  const isActive = (to: string) => to === '/' ? pathname === '/' : pathname.startsWith(to);

  // Bosh sahifada, hali pastga aylantirilmagan holatda header to'liq shaffof —
  // qahramon (hero) blokining ustiga "suzib" turadi. Boshqa joyda yoki scroll qilinganda shisha effektli oq fonga aylanadi.
  const [scrollY, setScrollY] = useState(0);
  const isHome = pathname === '/';
  useEffect(() => {
    let ticking = false;
    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      requestAnimationFrame(() => {
        setScrollY(window.scrollY);
        ticking = false;
      });
    };
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, []);
  // Fonning shaffoflik darajasi scroll pozitsiyasiga to'g'ridan-to'g'ri bog'langan —
  // CSS transition kechikishi tufayli tez scroll qilinganda "sakrash" his qilinmasligi uchun.
  const scrollProgress = Math.min(scrollY / 64, 1);
  const scrolled = scrollProgress >= 0.5;
  const transparent = isHome && !scrolled;

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Navbar — shaffof/shisha (glassmorphism) header */}
      <header className="fixed top-0 inset-x-0 z-50 transform-gpu will-change-transform">
        <div
          className="absolute inset-0 bg-white/85 backdrop-blur-xl shadow-sm border-b border-gray-100/80"
          style={{ opacity: isHome ? scrollProgress : 1 }}
        />
        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-16 gap-3">
            {/* Logo */}
            <Link to="/" className="flex items-center gap-2.5 shrink-0 transition-transform duration-300 ease-out hover:scale-[1.03]">
              <div className={`rounded-lg p-1.5 transition-colors duration-300 ease-out ${transparent ? 'bg-white/15 backdrop-blur-sm' : 'bg-blue-50'}`}>
                <GraduationCap className={`w-5 h-5 transition-colors duration-300 ease-out ${transparent ? 'text-white' : 'text-blue-700'}`} />
              </div>
              <div>
                <p className={`font-bold text-sm leading-tight transition-colors ${transparent ? 'text-white' : 'text-gray-900'}`}>{t('nav.schoolName')}</p>
                <p className={`text-xs transition-colors ${transparent ? 'text-blue-100/80' : 'text-gray-400'}`}>{t('nav.district')}</p>
              </div>
            </Link>

            {/* Desktop nav — pilla shaklidagi havolalar */}
            <nav className="hidden lg:flex items-center gap-1.5">
              {MAIN_LINKS.map(link => (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3.5 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                    isActive(link.to)
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-900/20'
                      : transparent
                      ? 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/10 backdrop-blur-sm'
                      : 'bg-gray-50 text-gray-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  {t(link.labelKey)}
                </Link>
              ))}

              {/* Ko'proq dropdown */}
              <div ref={moreRef} className="relative">
                <button
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex items-center gap-1 px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ease-out hover:-translate-y-0.5 ${
                    transparent
                      ? 'bg-white/10 text-white/90 hover:bg-white/20 border border-white/10 backdrop-blur-sm'
                      : 'bg-gray-50 text-gray-700 shadow-sm hover:shadow-md'
                  }`}
                >
                  {t('nav.more')} <ChevronDown className={`w-3.5 h-3.5 transition-transform duration-300 ease-out ${moreOpen ? 'rotate-180' : ''}`} />
                </button>
                {moreOpen && (
                  <div className="absolute top-full right-0 mt-2 bg-white rounded-xl shadow-xl py-1 min-w-[170px] border border-gray-100 origin-top-right animate-fade-in z-50">
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
                        {t(link.labelKey)}
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </nav>

            {/* Til + Auth */}
            <div className="hidden lg:flex items-center gap-2.5">
              <LanguageSwitcher transparent={transparent} />
              {isAuthenticated ? (
                <Link
                  to={user?.role === 'teacher' ? '/teacher' : '/admin'}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-1.5 rounded-full text-sm font-medium shadow-md shadow-blue-900/20 transition-colors duration-300 ease-out"
                >
                  {t('nav.cabinet')}
                </Link>
              ) : (
                <Link
                  to="/login"
                  className={`px-4 py-1.5 rounded-full text-sm font-medium transition-colors duration-300 ease-out ${
                    transparent
                      ? 'bg-amber-500 hover:bg-amber-400 text-white shadow-md shadow-amber-900/20'
                      : 'bg-gray-900 hover:bg-black text-white shadow-sm'
                  }`}
                >
                  {t('nav.login')}
                </Link>
              )}
            </div>

            {/* Mobile: til + hamburger */}
            <div className="flex items-center gap-2 lg:hidden">
              <LanguageSwitcher transparent={transparent} />
              <button
                onClick={() => setMenuOpen(!menuOpen)}
                className={`p-2 rounded-full transition-colors duration-300 ease-out ${
                  transparent
                    ? 'bg-white/10 text-white border border-white/15 backdrop-blur-sm'
                    : 'bg-gray-50 shadow-sm text-gray-700'
                }`}
              >
                <span className="block transition-transform duration-300 ease-out" style={{ transform: menuOpen ? 'rotate(90deg)' : 'rotate(0deg)' }}>
                  {menuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
                </span>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile overlay menu */}
      <div
        className={`fixed inset-0 bg-gray-900/50 backdrop-blur-sm z-[60] lg:hidden transition-opacity duration-300 ease-out ${
          menuOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={() => setMenuOpen(false)}
      />
      <div
        className={`fixed top-0 right-0 h-full w-72 max-w-[80vw] bg-white z-[70] shadow-2xl transition-transform duration-300 ease-out lg:hidden ${
          menuOpen ? 'translate-x-0' : 'translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between h-16 px-4 border-b border-gray-100">
          <p className="font-bold text-gray-900">{t('nav.menu')}</p>
          <button onClick={() => setMenuOpen(false)} className="p-2 rounded-full bg-gray-50 text-gray-700">
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="p-4 space-y-1.5 overflow-y-auto h-[calc(100%-4rem)]">
          {navLinks.map(link => (
            <Link
              key={link.to}
              to={link.to}
              onClick={() => setMenuOpen(false)}
              className={`block px-4 py-2.5 rounded-xl text-sm font-medium transition-colors duration-300 ease-out ${
                isActive(link.to) ? 'bg-blue-600 text-white' : 'bg-gray-50 text-gray-700 hover:bg-gray-100'
              }`}
            >
              {t(link.labelKey)}
            </Link>
          ))}
          <div className="pt-3 mt-3 border-t border-gray-100">
            <Link
              to={isAuthenticated ? (user?.role === 'teacher' ? '/teacher' : '/admin') : '/login'}
              onClick={() => setMenuOpen(false)}
              className="block px-4 py-2.5 rounded-xl text-sm font-semibold bg-gray-900 text-white text-center"
            >
              {isAuthenticated ? t('nav.cabinet') : t('nav.login')}
            </Link>
          </div>
        </div>
      </div>

      {/* Page content — header endi "fixed" bo'lgani uchun, qahramon (hero) bo'lmagan sahifalarda
          kontent navbar ostida qolib ketmasligi uchun yuqori bo'shliq beramiz */}
      <main className={`flex-1 ${isHome ? '' : 'pt-16'}`}>
        <Suspense fallback={<PageLoader />}>
          <Outlet />
        </Suspense>
      </main>

      {/* Footer — oq fon asosiy, ko'k/oltin faqat urg'u sifatida ishlatiladi */}
      <footer className="relative overflow-hidden bg-white text-gray-500 pt-14 pb-10 mt-16 border-t border-gray-100">
        {/* Tepadagi ko'k→oltin gradient chiziq — header va footerni vizual bog'laydi */}
        <div className="absolute top-0 inset-x-0 h-[3px] bg-gradient-to-r from-blue-600 via-amber-400 to-blue-600" />
        {/* Dekorativ xira nurlar (orb) — juda nozik, oq fonga chiroyli teginish beradi */}
        <div className="pointer-events-none absolute -top-24 -right-24 w-72 h-72 rounded-full bg-amber-100/60 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-32 -left-24 w-72 h-72 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="relative max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-10 mb-10">
            <div>
              <div className="flex items-center gap-3 mb-4">
                <img
                  src="/images/sh14.jpg"
                  alt={t('footer.schoolName')}
                  className="w-12 h-12 rounded-xl object-cover ring-2 ring-gray-100 shadow-md"
                />
                <span className="text-gray-900 font-semibold text-base leading-tight">{t('footer.schoolName')}</span>
              </div>
              <p className="text-sm text-gray-500 leading-relaxed max-w-xs mb-4">
                {t('footer.description')}
              </p>
              <div className="space-y-2">
                {phone && (
                  <a href={`tel:${phone.replace(/\s+/g, '')}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors w-fit">
                    <Phone className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {phone}
                  </a>
                )}
                {email && (
                  <a href={`mailto:${email}`} className="flex items-center gap-2 text-sm text-gray-500 hover:text-blue-700 transition-colors w-fit">
                    <Mail className="w-3.5 h-3.5 text-amber-500 shrink-0" />
                    {email}
                  </a>
                )}
              </div>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-4 text-xs uppercase tracking-wider relative inline-block after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-6 after:h-0.5 after:bg-amber-400 after:rounded-full">
                {t('footer.pages')}
              </p>
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 mt-2">
                {navLinks.slice(0, 6).map(l => (
                  <Link key={l.to} to={l.to} className="text-sm text-gray-500 hover:text-blue-700 hover:translate-x-0.5 transition-all inline-block w-fit">
                    {t(l.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-4 text-xs uppercase tracking-wider relative inline-block after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-6 after:h-0.5 after:bg-amber-400 after:rounded-full">
                {t('footer.more')}
              </p>
              <div className="space-y-2 mt-2">
                {navLinks.slice(6).map(l => (
                  <Link key={l.to} to={l.to} className="block text-sm text-gray-500 hover:text-blue-700 hover:translate-x-0.5 transition-all w-fit">
                    {t(l.labelKey)}
                  </Link>
                ))}
              </div>
            </div>
            <div>
              <p className="text-gray-900 font-medium mb-4 text-xs uppercase tracking-wider relative inline-block after:content-[''] after:absolute after:-bottom-1.5 after:left-0 after:w-6 after:h-0.5 after:bg-amber-400 after:rounded-full">
                {t('footer.location')}
              </p>
              <div className="rounded-xl overflow-hidden border border-gray-100 shadow-md mt-2">
                <iframe
                  title="school-map"
                  src={`https://yandex.uz/map-widget/v1/?text=${encodeURIComponent(address)}&z=15&l=map`}
                  width="100%"
                  height="160"
                  loading="lazy"
                  className="border-0"
                />
              </div>
              <p className="text-xs text-gray-500 mt-2 leading-relaxed">{address}</p>
            </div>
          </div>
          <div className="border-t border-gray-100 pt-6 text-center">
            <p className="text-xs text-gray-400">© {new Date().getFullYear()} {t('footer.schoolName')}. {t('footer.rights')}</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
