import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import {
  Clock, Cloud, Wind, Droplets, ChevronRight,
  BookOpen, Trophy, Newspaper, GraduationCap,
  ExternalLink, AlertCircle,
} from 'lucide-react';
import { apiClient } from '../../api/client';
import { CurrentLesson } from '../../types';

// ===== SmartShift Widget =====
function SmartShiftWidget() {
  const { data, isLoading } = useQuery<CurrentLesson>({
    queryKey: ['schedule-current'],
    queryFn: () => apiClient.get('/schedule/current').then(r => r.data.data),
    refetchInterval: 60_000,
  });

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm p-5 h-full">
      <div className="flex items-center gap-2 mb-4">
        <div className="bg-blue-50 p-1.5 rounded-lg">
          <Clock className="w-4 h-4 text-blue-700" />
        </div>
        <h3 className="font-semibold text-gray-800 text-sm">SmartShift • Hozirgi dars</h3>
        {data?.current_time && (
          <span className="ml-auto text-xs text-gray-400 font-mono">{data.current_time}</span>
        )}
      </div>

      {isLoading ? (
        <div className="space-y-2 animate-pulse">
          <div className="h-4 bg-gray-100 rounded w-3/4" />
          <div className="h-4 bg-gray-100 rounded w-1/2" />
          <div className="h-4 bg-gray-100 rounded w-2/3" />
        </div>
      ) : data?.is_lesson ? (
        <div>
          <div className="flex items-center gap-2 mb-3">
            <span className="bg-green-100 text-green-700 text-xs px-2.5 py-1 rounded-full font-medium">
              {data.lesson_num}-dars davom etmoqda
            </span>
            <span className="text-xs text-gray-400">{data.start_time} – {data.end_time}</span>
          </div>
          <div className="space-y-1.5 max-h-36 overflow-y-auto">
            {data.classes?.slice(0, 6).map((c, i) => (
              <div key={i} className="flex items-center gap-2 text-xs bg-gray-50 rounded-lg px-3 py-2">
                <span className="font-semibold text-blue-800 w-12 shrink-0">{c.class_name}</span>
                <span className="text-gray-700 flex-1 truncate">{c.subject_name}</span>
                <span className="text-gray-400 truncate max-w-[100px]">{c.teacher_name}</span>
              </div>
            ))}
            {(data.classes?.length ?? 0) > 6 && (
              <p className="text-xs text-gray-400 text-center pt-1">
                +{data.classes!.length - 6} ta sinf
              </p>
            )}
          </div>
        </div>
      ) : (
        <div className="text-center py-4">
          {data?.message ? (
            <p className="text-gray-500 text-sm">{data.message}</p>
          ) : (
            <div>
              <p className="text-gray-500 text-sm">Hozir dars yo'q</p>
              {data?.next_lesson && (
                <div className="mt-2 bg-blue-50 rounded-lg px-3 py-2 text-xs text-blue-700">
                  Keyingi: <strong>{data.next_lesson.start_time}</strong> —{' '}
                  {data.next_lesson.subject_name} ({data.next_lesson.class_name})
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ===== Weather Widget =====
interface WeatherData {
  temp: number;
  feels_like: number;
  humidity: number;
  description: string;
  icon: string;
  wind_speed: number;
}

function WeatherWidget() {
  const { data, isLoading } = useQuery<{ success: boolean; data: WeatherData | null }>({
    queryKey: ['weather'],
    queryFn: () => apiClient.get('/schedule/weather').then(r => r.data),
    staleTime: 1000 * 60 * 30,
  });

  const w = data?.data;

  return (
    <div className="bg-gradient-to-br from-sky-500 to-blue-600 rounded-2xl p-5 text-white h-full">
      <div className="flex items-center gap-2 mb-4">
        <Cloud className="w-4 h-4" />
        <span className="text-sm font-semibold">Ob-havo • Shomanay</span>
      </div>

      {isLoading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-10 bg-white/20 rounded w-24" />
          <div className="h-4 bg-white/20 rounded w-32" />
        </div>
      ) : w ? (
        <div>
          <div className="flex items-end gap-3 mb-4">
            {w.icon && (
              <img
                src={`https://openweathermap.org/img/wn/${w.icon}@2x.png`}
                alt=""
                className="w-14 h-14 -ml-2 -mt-2"
              />
            )}
            <div>
              <div className="text-5xl font-bold leading-none">{w.temp}°</div>
              <p className="text-sky-100 text-sm mt-1 capitalize">{w.description}</p>
            </div>
          </div>
          <div className="flex items-center gap-4 text-xs text-sky-100 border-t border-white/20 pt-3">
            <span className="flex items-center gap-1">
              <Thermometer className="w-3 h-3" /> His: {w.feels_like}°C
            </span>
            <span className="flex items-center gap-1">
              <Droplets className="w-3 h-3" /> {w.humidity}%
            </span>
            <span className="flex items-center gap-1">
              <Wind className="w-3 h-3" /> {w.wind_speed} m/s
            </span>
          </div>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center py-4 text-sky-100">
          <AlertCircle className="w-8 h-8 mb-2 opacity-60" />
          <p className="text-sm">Ma'lumot yo'q</p>
          <p className="text-xs opacity-60 mt-1">API kalit sozlanmagan</p>
        </div>
      )}
    </div>
  );
}

// Thermometer icon inline
function Thermometer({ className }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M14 14.76V3.5a2.5 2.5 0 00-5 0v11.26a4.5 4.5 0 105 0z" />
    </svg>
  );
}

// ===== Quick links =====
const quickLinks = [
  { to: '/tests', icon: BookOpen, label: 'Testlar', desc: 'Bilimingizni sinab ko\'ring', color: 'bg-violet-50 text-violet-700' },
  { to: '/news', icon: Newspaper, label: 'Yangiliklar', desc: 'So\'nggi voqealar', color: 'bg-amber-50 text-amber-700' },
  { to: '/achievements', icon: Trophy, label: 'Maktab faxrlari', desc: 'O\'quvchi va o\'qituvchilar', color: 'bg-green-50 text-green-700' },
  { to: '/control-works', label: 'Nazorat ishlari', desc: 'Chorak natijalari', color: 'bg-rose-50 text-rose-700', icon: GraduationCap },
];

// ===== External links =====
const externalLinks = [
  { href: 'https://edu.uz', label: 'Xalq ta\'limi vazirligi', desc: 'edu.uz' },
  { href: 'https://ziyonet.uz', label: 'Ziyonet', desc: 'Ta\'lim portali' },
  { href: 'https://uzedu.uz', label: 'UzEdu', desc: 'Raqamli ta\'lim' },
  { href: 'https://kitob.uz', label: 'Kitob.uz', desc: 'Darsliklar' },
];

// ===== Main =====
export default function HomePage() {
  return (
    <div>
      {/* Hero */}
      <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-sm rounded-full px-4 py-1.5 text-sm mb-6">
              <GraduationCap className="w-4 h-4" />
              Qoraqalpog'iston Respublikasi • Shomanay tumani
            </div>
            <h1 className="text-4xl sm:text-5xl font-bold mb-4 leading-tight">
              Shomanay<br />
              <span className="text-amber-400">14-Maktab</span>
            </h1>
            <p className="text-blue-100 text-lg mb-8 max-w-lg">
              Sifatli ta'lim va zamonaviy bilimlarga yo'l. O'quvchilar, o'qituvchilar va ota-onalar uchun raqamli tizim.
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/tests" className="bg-amber-500 hover:bg-amber-400 text-white px-6 py-3 rounded-xl font-semibold transition-colors flex items-center gap-2">
                <BookOpen className="w-4 h-4" />
                Test topshirish
              </Link>
              <Link to="/news" className="bg-white/10 hover:bg-white/20 text-white px-6 py-3 rounded-xl font-semibold transition-colors">
                Yangiliklar
              </Link>
            </div>
          </div>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-10">
        {/* SmartShift + Weather */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mb-10">
          <SmartShiftWidget />
          <WeatherWidget />
        </div>

        {/* Quick links */}
        <div className="mb-10">
          <h2 className="text-xl font-bold text-gray-800 mb-4">Tezkor havolalar</h2>
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
                    <p className="font-semibold text-gray-800 text-sm group-hover:text-blue-800 transition-colors">{link.label}</p>
                    <p className="text-xs text-gray-500 mt-0.5">{link.desc}</p>
                  </div>
                  <ChevronRight className="w-4 h-4 text-gray-300 group-hover:text-blue-600 transition-colors mt-auto self-end" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* External links */}
        <div>
          <h2 className="text-xl font-bold text-gray-800 mb-4">Foydali manbalar</h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {externalLinks.map(link => (
              <a
                key={link.href}
                href={link.href}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center justify-between bg-white border border-gray-100 rounded-xl px-4 py-3 hover:border-blue-200 hover:shadow-sm transition-all group"
              >
                <div>
                  <p className="text-sm font-medium text-gray-800 group-hover:text-blue-800">{link.label}</p>
                  <p className="text-xs text-gray-400">{link.desc}</p>
                </div>
                <ExternalLink className="w-3.5 h-3.5 text-gray-300 group-hover:text-blue-500 shrink-0" />
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
