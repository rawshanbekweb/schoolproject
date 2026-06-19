import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { MapPin, Phone, Mail, Clock, GraduationCap, Eye, Target } from 'lucide-react';
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
        className="relative rounded-3xl overflow-hidden bg-gradient-to-br from-blue-900 to-blue-700 text-white p-10 md:p-16 text-center">
        <div className="absolute inset-0 opacity-10"
          style={{ backgroundImage: 'repeating-linear-gradient(45deg, #fff 0, #fff 1px, transparent 0, transparent 50%)', backgroundSize: '20px 20px' }} />
        <div className="relative">
          <div className="bg-white/10 rounded-2xl p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
            <GraduationCap className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-3xl md:text-4xl font-bold mb-2">Shomanay 14-Maktab</h1>
          <p className="text-blue-200">Qoraqalpog'iston Respublikasi, Shomanay tumani</p>
          {info('founded') && (
            <p className="text-blue-300 text-sm mt-3">Tashkil etilgan: {info('founded')?.content}</p>
          )}
        </div>
      </motion.div>

      {/* Missiya va Maqsad */}
      <motion.section {...fade} transition={{ delay: 0.1 }}>
        <h2 className="text-xl font-bold text-gray-800 mb-5">Missiya va Maqsad</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="card border-l-4 border-blue-600">
            <div className="flex items-center gap-2 mb-3">
              <Eye className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-gray-800">{info('mission')?.title || 'Missiyamiz'}</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {info('mission')?.content || 'Yuklanmoqda...'}
            </p>
          </div>
          <div className="card border-l-4 border-green-600">
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-5 h-5 text-green-600" />
              <h3 className="font-semibold text-gray-800">{info('vision')?.title || 'Maqsadimiz'}</h3>
            </div>
            <p className="text-gray-600 text-sm leading-relaxed">
              {info('vision')?.content || 'Yuklanmoqda...'}
            </p>
          </div>
        </div>
      </motion.section>

      {/* Tarix */}
      {info('history') && (
        <motion.section {...fade} transition={{ delay: 0.2 }}>
          <h2 className="text-xl font-bold text-gray-800 mb-4">{info('history')?.title || 'Maktab tarixi'}</h2>
          <div className="card">
            <p className="text-gray-600 leading-relaxed">{info('history')?.content}</p>
          </div>
        </motion.section>
      )}

      {/* Rahbariyat */}
      <motion.section {...fade} transition={{ delay: 0.3 }}>
        <h2 className="text-xl font-bold text-gray-800 mb-5">Rahbariyat</h2>
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
        <h2 className="text-xl font-bold text-gray-800 mb-5">Manzil va bog'lanish</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <InfoCard icon={MapPin}  title="Manzil"    content={info('address')?.content ?? undefined} />
          <InfoCard icon={Phone}   title="Telefon"   content={info('phone')?.content ?? undefined} />
          <InfoCard icon={Mail}    title="Email"     content={info('email')?.content ?? undefined} />
          <InfoCard icon={Clock}   title="Ish vaqti" content={info('work_hours')?.content ?? undefined} />
        </div>
      </motion.section>
    </div>
  );
}
