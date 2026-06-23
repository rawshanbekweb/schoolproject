import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, GraduationCap } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { SchoolInfo, ManagementMember } from '../../types';

const fade = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

function InfoCard({ icon: Icon, title, content }: { icon: any; title: string; content?: string }) {
  return (
    <div className="card flex gap-4">
      <div className="bg-blue-50 rounded-xl p-3 h-fit shrink-0">
        <Icon className="w-5 h-5 text-blue-700" />
      </div>
      <div>
        <p className="text-sm font-medium text-gray-500 mb-0.5">{title}</p>
        <p className="text-gray-800">{content || '—'}</p>
      </div>
    </div>
  );
}

export default function AboutPage() {
  const { t } = useTranslation();
  const { data: infoList = [] } = useQuery<SchoolInfo[]>({
    queryKey: ['school-info'],
    queryFn: () => apiClient.get('/school-info').then(r => r.data.data),
  });

  const { data: management = [], isLoading: mLoad } = useQuery<ManagementMember[]>({
    queryKey: ['management'],
    queryFn: () => apiClient.get('/school-info/management/list').then(r => r.data.data),
  });

  const info = (key: string) => infoList.find(i => i.key === key);

  return (
    <div className="max-w-6xl mx-auto px-4 py-10 space-y-12">
      {/* Hero */}
      <motion.div {...fade} transition={{ duration: 0.5 }}
        className="relative rounded-3xl overflow-hidden text-white p-10 md:p-16 text-center min-h-[320px] flex items-center justify-center">
        <img
          src="/images/sh14.jpg"
          alt={t('footer.schoolName')}
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-black/10" />
        <div className="relative">
          <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2 drop-shadow-md">{t('footer.schoolName')}</h1>
          <p className="text-gray-100 drop-shadow-md">{t('public.about.subtitle')}</p>
          {info('founded') && (
            <p className="text-gray-200 text-sm mt-3 drop-shadow-md">{t('public.about.founded', { val: info('founded')?.content })}</p>
          )}
        </div>
      </motion.div>

      {/* Tarix */}
      {info('history') && (
        <motion.section {...fade} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{info('history')?.title || t('public.about.historyTitle')}</h2>
          <div className="card">
            <p className="text-gray-600 leading-relaxed">{info('history')?.content}</p>
          </div>
        </motion.section>
      )}

      {/* Rahbariyat */}
      <motion.section {...fade} transition={{ delay: 0.3 }}>
        <h2 className="text-xl font-bold text-gray-800 mb-5">{t('public.about.management')}</h2>
        {mLoad ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => <div key={i} className="card h-40 animate-pulse" />)}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {management.map(m => (
              <div key={m.id} className="card flex flex-col items-center text-center gap-3">
                <div className="w-20 h-20 rounded-full bg-blue-100 overflow-hidden flex items-center justify-center">
                  {m.photo_url
                    ? <img src={m.photo_url} alt={m.full_name} className="w-full h-full object-cover" />
                    : <span className="text-2xl font-bold text-blue-700">{m.full_name[0]}</span>}
                </div>
                <div>
                  <p className="font-semibold text-gray-800">{m.full_name}</p>
                  <p className="text-sm text-blue-600 mt-0.5">{m.position}</p>
                  {m.phone && <p className="text-xs text-gray-500 mt-1">{m.phone}</p>}
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.section>

      {/* Bog'lanish */}
      <motion.section {...fade} transition={{ delay: 0.4 }}>
        <h2 className="text-xl font-bold text-gray-800 mb-5">{t('public.about.contactSection')}</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard icon={MapPin}  title={t('public.about.address')}   content={info('address')?.content ?? undefined} />
          <InfoCard icon={Phone}   title={t('public.about.phone')}     content={info('phone')?.content ?? undefined} />
          <InfoCard icon={Mail}    title={t('public.about.email')}     content={info('email')?.content ?? undefined} />
          <InfoCard icon={Clock}   title={t('public.about.workHours')} content={info('work_hours')?.content ?? undefined} />
        </div>
      </motion.section>
    </div>
  );
}
