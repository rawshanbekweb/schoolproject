import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { useEffect, useRef, useState } from 'react';
import {
  ChevronRight, BookOpen, Trophy, Newspaper, GraduationCap, Star,
  Clock,
  Sun, Cloud, CloudSun, CloudFog, CloudDrizzle, CloudRain, CloudSnow, CloudLightning,
} from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';

// ===== Quick links =====
const quickLinks = [
  { to: '/tests', icon: BookOpen, labelKey: 'public.home.quickLinks.tests', descKey: 'public.home.quickLinks.testsDesc', color: 'bg-violet-50 text-violet-700' },
  { to: '/news', icon: Newspaper, labelKey: 'public.home.quickLinks.news', descKey: 'public.home.quickLinks.newsDesc', color: 'bg-amber-50 text-amber-700' },
  { to: '/achievements', icon: Trophy, labelKey: 'public.home.quickLinks.achievements', descKey: 'public.home.quickLinks.achievementsDesc', color: 'bg-green-50 text-green-700' },
  { to: '/control-works', labelKey: 'public.home.quickLinks.controlWorks', descKey: 'public.home.quickLinks.controlWorksDesc', color: 'bg-rose-50 text-rose-700', icon: GraduationCap },
];

// ===== Online services (login portals) — hero ustida suzuvchi kartalar =====
const onlineServices = [
  { href: 'https://login.emaktab.uz/', labelKey: 'public.home.services.emaktab', logo: '/images/services/emaktab.png' },
  { href: 'https://kitob.uz/', labelKey: 'public.home.services.kitobUz', logo: '/images/services/kitob-uz.jpg' },
  { href: 'https://uzbmb.uz/', labelKey: 'public.home.services.dtm', logo: '/images/services/dtm.jpg' },
  { href: 'https://www.youtube.com/@milliy_talim_resurslar', labelKey: 'public.home.services.milliyTalim', logo: '/images/services/milliy.jpg' },
  { href: 'https://uzbekcoders.uz/', labelKey: 'public.home.services.uzbekCoders', logo: '/images/services/uzbekcoders.jpg' },
  { href: 'https://edo.ijro.uz/', labelKey: 'public.home.services.edoIjro', logo: '/images/services/edo-ijro.png' },
  { href: 'https://erp.maktab.uz/', labelKey: 'public.home.services.erpMaktab', logo: '/images/services/erp.jpg' },
  { href: 'https://www.duolingo.com/', labelKey: 'public.home.services.duolingo', logo: '/images/services/duolingo.png' },
];

// ===== Hero rasm galereyasi =====
// Ko'proq surat qo'shilsa, shu massivga yo'lini qo'shish kifoya — slayder avtomatik ishlaydi.
const heroImages = [
  '/images/sh14.jpg',
  '/images/hero/vaz1.jpg',
  '/images/hero/vaz2.jpg',
];

function HeroSlider() {
  const { t } = useTranslation();
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (heroImages.length <= 1 || paused) return;
    const id = setInterval(() => setIndex(i => (i + 1) % heroImages.length), 5000);
    return () => clearInterval(id);
  }, [paused]);

  return (
    <div
      className="relative w-full h-72 sm:h-80 rounded-tl-[50px] rounded-br-[50px] overflow-hidden shadow-2xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
    >
      <div className="absolute top-0 left-0 w-full h-1 bg-white/20 z-10 overflow-hidden">
        <div
          key={index}
          className="h-full w-full bg-white animate-loader-progress"
          style={{ animationPlayState: paused ? 'paused' : 'running' }}
        />
      </div>
      {heroImages.map((src, i) => (
        <img
          key={src}
          src={src}
          alt={t('public.home.photoAlt', { num: i + 1 })}
          className="absolute inset-0 w-full h-full object-cover transition-opacity duration-700"
          style={{ opacity: i === index ? 1 : 0 }}
        />
      ))}
      {heroImages.length > 1 && (
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex gap-1.5 z-10">
          {heroImages.map((src, i) => (
            <button
              key={src}
              onClick={() => setIndex(i)}
              aria-label={t('public.home.slideAlt', { num: i + 1 })}
              className={`h-1.5 rounded-full transition-all ${i === index ? 'w-6 bg-white' : 'w-1.5 bg-white/50'}`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// ===== Ob-havo (Open-Meteo — bepul, API kalitsiz) =====
function describeWeatherCode(code: number) {
  if (code === 0) return { descKey: 'public.home.weather.clear', Icon: Sun };
  if ([1, 2].includes(code)) return { descKey: 'public.home.weather.partlyCloudy', Icon: CloudSun };
  if (code === 3) return { descKey: 'public.home.weather.cloudy', Icon: Cloud };
  if ([45, 48].includes(code)) return { descKey: 'public.home.weather.fog', Icon: CloudFog };
  if ([51, 53, 55, 56, 57].includes(code)) return { descKey: 'public.home.weather.drizzle', Icon: CloudDrizzle };
  if ([61, 63, 65, 66, 67, 80, 81, 82].includes(code)) return { descKey: 'public.home.weather.rain', Icon: CloudRain };
  if ([71, 73, 75, 77, 85, 86].includes(code)) return { descKey: 'public.home.weather.snow', Icon: CloudSnow };
  if ([95, 96, 99].includes(code)) return { descKey: 'public.home.weather.thunderstorm', Icon: CloudLightning };
  return { descKey: 'public.home.weather.default', Icon: Cloud };
}

function useWeather() {
  const [weather, setWeather] = useState<{ temp: number; descKey: string; Icon: typeof Sun } | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch('https://api.open-meteo.com/v1/forecast?latitude=42.4715&longitude=59.0493&current=temperature_2m,weather_code&timezone=Asia%2FTashkent')
      .then(r => r.json())
      .then(data => {
        if (cancelled || !data?.current) return;
        const { descKey, Icon } = describeWeatherCode(data.current.weather_code);
        setWeather({ temp: Math.round(data.current.temperature_2m), descKey, Icon });
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, []);

  return weather;
}

function WeatherCard() {
  const { t } = useTranslation();
  const weather = useWeather();
  return (
    <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl px-5 py-4 text-white shadow-lg flex items-center justify-between gap-3">
      <div>
        <p className="text-xs text-sky-100">{t('public.home.weather.district')}</p>
        {weather ? (
          <>
            <p className="text-lg font-bold leading-tight">{weather.temp}°C</p>
            <p className="text-xs text-sky-100 leading-tight">{t(weather.descKey)}</p>
          </>
        ) : (
          <p className="text-sm text-sky-100">{t('public.home.weather.loading')}</p>
        )}
      </div>
      {weather && <weather.Icon className="w-9 h-9 shrink-0 opacity-90" />}
    </div>
  );
}

// ===== Jonli dars/smena jadvali =====
const FIRST_SHIFT_CLASSES = [1, 2, 3, 4, 9, 11];
const SECOND_SHIFT_CLASSES = [5, 6, 7, 8, 10];
const FIRST_SHIFT_START = 8 * 60 + 30;
const SECOND_SHIFT_START = 13 * 60 + 30;
const LESSON_DURATION = 45;
const BREAK_DURATION = 5;
const MAX_LESSONS = 6;

function getScheduleStatus(t: (key: string, opts?: any) => string) {
  const now = new Date();
  const totalMinutes = now.getHours() * 60 + now.getMinutes();
  const time = now.toLocaleTimeString('uz-UZ', { hour: '2-digit', minute: '2-digit' });

  let shiftStart: number;
  let shiftLabel: string;
  let classes: number[];

  if (totalMinutes >= FIRST_SHIFT_START && totalMinutes < SECOND_SHIFT_START) {
    shiftStart = FIRST_SHIFT_START;
    shiftLabel = t('public.home.schedule.shift1');
    classes = FIRST_SHIFT_CLASSES;
  } else if (totalMinutes >= SECOND_SHIFT_START) {
    shiftStart = SECOND_SHIFT_START;
    shiftLabel = t('public.home.schedule.shift2');
    classes = SECOND_SHIFT_CLASSES;
  } else {
    return { time, status: t('public.home.schedule.notStarted'), shiftLabel: null as string | null, classes: null as number[] | null };
  }

  const elapsed = totalMinutes - shiftStart;
  const block = LESSON_DURATION + BREAK_DURATION;
  const currentLesson = Math.floor(elapsed / block);
  const intoBlock = elapsed % block;

  if (currentLesson >= MAX_LESSONS) {
    return { time, status: t('public.home.schedule.finished'), shiftLabel, classes };
  }

  const status = intoBlock < LESSON_DURATION ? t('public.home.schedule.lesson', { num: currentLesson + 1 }) : t('public.home.schedule.break');
  return { time, status, shiftLabel, classes };
}

// Markaziy doiraviy surat atrofida aylanib turadigan ikkita nishoncha (smena va dars holati)
function ScheduleOrbit() {
  const { t } = useTranslation();
  const containerRef = useRef<HTMLDivElement>(null);
  const badge1Ref = useRef<HTMLDivElement>(null);
  const badge2Ref = useRef<HTMLDivElement>(null);
  const [info, setInfo] = useState(getScheduleStatus(t));

  useEffect(() => {
    const id = setInterval(() => setInfo(getScheduleStatus(t)), 10000);
    return () => clearInterval(id);
  }, [t]);

  useEffect(() => {
    let angle = 0;
    let raf: number;
    const speed = 0.006;
    const radius = () => (window.innerWidth < 640 ? 88 : 110);

    function tick() {
      const container = containerRef.current;
      const b1 = badge1Ref.current;
      const b2 = badge2Ref.current;
      if (container && b1 && b2) {
        const r = radius();
        const cx = container.offsetWidth / 2;
        const cy = container.offsetHeight / 2;
        const x1 = cx + Math.cos(angle) * r - 26;
        const y1 = cy + Math.sin(angle) * r - 26;
        b1.style.transform = `translate(${x1}px, ${y1}px)`;
        const x2 = cx + Math.cos(angle + Math.PI) * r - 26;
        const y2 = cy + Math.sin(angle + Math.PI) * r - 26;
        b2.style.transform = `translate(${x2}px, ${y2}px)`;
      }
      angle += speed;
      raf = requestAnimationFrame(tick);
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, []);

  return (
    <div ref={containerRef} className="relative w-52 h-52 sm:w-60 sm:h-60 mx-auto">
      <div className="absolute inset-5 rounded-full overflow-hidden border-4 border-white shadow-xl">
        <img src="/images/sh14.jpg" alt={t('public.home.schoolPhotoAlt')} className="w-full h-full object-cover" />
      </div>
      <div ref={badge1Ref} className="absolute top-0 left-0 w-[52px] h-[52px] rounded-full bg-white shadow-lg flex flex-col items-center justify-center text-center px-1">
        <Clock className="w-3.5 h-3.5 text-blue-700" />
        <span className="text-[8px] font-semibold leading-tight text-gray-700">{info.shiftLabel ?? info.time}</span>
      </div>
      <div ref={badge2Ref} className="absolute top-0 left-0 w-[52px] h-[52px] rounded-full bg-white shadow-lg flex flex-col items-center justify-center text-center px-1">
        <BookOpen className="w-3.5 h-3.5 text-amber-600" />
        <span className="text-[8px] font-semibold leading-tight text-gray-700">{info.status}</span>
      </div>
    </div>
  );
}

function ServiceCard({ href, labelKey, logo, className = '' }: { href: string; labelKey: string; logo: string; className?: string }) {
  const { t } = useTranslation();
  const label = t(labelKey);
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-2.5 bg-white rounded-xl shadow-lg px-3 py-2.5 w-[200px] shrink-0 hover:-translate-y-0.5 hover:shadow-xl transition-all ${className}`}
    >
      <div className="w-10 h-10 rounded-lg bg-white border border-gray-100 flex items-center justify-center shrink-0 overflow-hidden p-1">
        <img src={logo} alt={label} className="w-full h-full object-contain" />
      </div>
      <p className="text-xs font-semibold text-gray-800 leading-snug">{label}</p>
    </a>
  );
}

// ===== Teachers Section =====
interface Teacher {
  id: number;
  full_name: string;
  photo_url: string | null;
  bio: string | null;
  experience_years: number | null;
  subjects: { id: number; name: string; icon: string | null }[];
  rating: number;
}

function TeachersSection() {
  const { t } = useTranslation();
  const { data, isLoading } = useQuery<Teacher[]>({
    queryKey: ['teachers-home'],
    queryFn: () => apiClient.get('/teachers').then(r => r.data.data),
    staleTime: 1000 * 60 * 5,
  });

  const teachers = data?.slice(0, 6) ?? [];

  if (isLoading) {
    return (
      <div className="mb-10">
        <h2 className="text-xl font-bold text-gray-800 mb-4">{t('public.home.teachersTitle')}</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="card animate-pulse flex flex-col items-center gap-3">
              <div className="w-16 h-16 rounded-full bg-gray-100" />
              <div className="h-3 bg-gray-100 rounded w-3/4" />
              <div className="h-3 bg-gray-100 rounded w-1/2" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (!teachers.length) return null;

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-gray-800">{t('public.home.teachersTitle')}</h2>
        <Link to="/teachers" className="text-sm text-blue-700 hover:underline flex items-center gap-1">
          {t('public.home.teachersAll')} <ChevronRight className="w-4 h-4" />
        </Link>
      </div>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4">
        {teachers.map(teacher => (
          <div key={teacher.id} className="card flex flex-col items-center text-center gap-2 p-4">
            {teacher.photo_url ? (
              <img
                src={teacher.photo_url}
                alt={teacher.full_name}
                className="w-16 h-16 rounded-full object-cover border-2 border-blue-100"
              />
            ) : (
              <div className="w-16 h-16 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-bold text-xl border-2 border-blue-200">
                {teacher.full_name.charAt(0)}
              </div>
            )}
            <p className="text-sm font-semibold text-gray-800 leading-tight">{teacher.full_name}</p>
            {teacher.subjects.length > 0 && (
              <p className="text-xs text-gray-500 truncate w-full">{teacher.subjects.map(s => s.name).join(', ')}</p>
            )}
            {teacher.rating > 0 && (
              <div className="flex items-center gap-1 text-xs text-amber-600">
                <Star className="w-3 h-3 fill-amber-400 text-amber-400" />
                {teacher.rating}
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}

// ===== Main =====
export default function HomePage() {
  const { t } = useTranslation();
  const leftServices = onlineServices.slice(0, 4);
  const rightServices = onlineServices.slice(4);

  return (
    <div>
      {/* Hero */}
      <section className="relative overflow-hidden text-white pt-24 sm:pt-28 pb-12">
        {/* Fon surati — xira maktab binosi, bo'sh joylarni to'ldiradi */}
        <div className="absolute inset-0">
          <img src="/images/sh14.jpg" alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-blue-950/92" />
          <div className="absolute inset-0 bg-gradient-to-b from-blue-950/40 via-blue-950/80 to-blue-950" />
        </div>

        <div className="relative max-w-7xl mx-auto px-4 sm:px-6">
          {/* "Eng faol sinf" tasmasi — barcha o'lchamlarda oddiy oqimda, xizmat kartalari bilan to'qnashmaydi */}
          <div className="flex justify-end mb-4">
            <div className="bg-gradient-to-br from-amber-400 to-amber-600 text-white px-4 py-2 rounded-xl shadow-lg flex items-center gap-2 text-sm font-bold whitespace-nowrap">
              <Trophy className="w-4 h-4 shrink-0" />
              {t('public.home.activeClass', { name: '11-D' })}
            </div>
          </div>

          {/* Xizmat kartalari slayderning ikki yonida — yuborilgan dizaynga mos */}
          <div className="xl:grid xl:grid-cols-[200px_1fr_200px] xl:gap-6 xl:items-start">
            <div className="hidden xl:flex flex-col gap-3 relative z-10">
              {leftServices.map(s => <ServiceCard key={s.href} {...s} />)}
            </div>

            <div>
              {/* Mobil/tablet/kichik desktop: gorizontal skroll qatori */}
              <div className="xl:hidden flex gap-3 overflow-x-auto pb-3 mb-6 -mx-4 px-4">
                {onlineServices.map(s => <ServiceCard key={s.href} {...s} />)}
              </div>

              {/* Slayder + ob-havo + jonli jadval — ikkala ustun bir xil balandlikdan boshlanadi */}
              <div className="grid lg:grid-cols-2 gap-10 items-start">
                <HeroSlider />

                <div>
                  <WeatherCard />
                  <div className="mt-6">
                    <ScheduleOrbit />
                  </div>
                </div>
              </div>
            </div>

            <div className="hidden xl:flex flex-col gap-3 relative z-10">
              {rightServices.map(s => <ServiceCard key={s.href} {...s} />)}
            </div>
          </div>

          {/* Iqtibos + CTA — butun kenglikda, hero pastini tekis yopadi */}
          <div className="mt-10 pt-8 border-t border-white/10 grid lg:grid-cols-2 gap-8 items-center">
            <div>
              <p className="italic text-blue-100 leading-relaxed">
                {t('public.home.quote')}
              </p>
              <p className="text-amber-400 font-semibold mt-2">{t('public.home.quoteAuthor')}</p>
            </div>
            <div className="flex flex-wrap gap-3 lg:justify-end">
              <Link to="/about" className="bg-white/10 hover:bg-white/20 backdrop-blur-sm text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                {t('public.home.ctaAbout')}
              </Link>
              <Link to="/tests" className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                {t('public.home.ctaTest')}
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* Quick links */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">{t('public.home.quickLinksTitle')}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            {quickLinks.map(link => {
              const Icon = link.icon;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className="card hover:shadow-md transition-shadow group flex flex-col gap-3"
                >
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${link.color}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-800 transition-colors">{t(link.labelKey)}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{t(link.descKey)}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors mt-auto self-end" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* Teachers */}
        <TeachersSection />
      </div>
    </div>
  );
}
