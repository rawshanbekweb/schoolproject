import { useQuery } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useState } from 'react';
import { MapPin, Phone, Mail, Clock, Send, CheckCircle, Loader2 } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { apiClient } from '../../api/client';
import { SchoolInfo } from '../../types';

const schema = z.object({
  full_name: z.string().min(2, 'public.contact.validation.fullNameMin'),
  phone:     z.string().optional(),
  email:     z.string().email('public.contact.validation.emailInvalid').optional().or(z.literal('')),
  subject:   z.string().min(3, 'public.contact.validation.subjectMin'),
  message:   z.string().min(10, 'public.contact.validation.messageMin'),
});
type FormData = z.infer<typeof schema>;

const fade = { initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 } };

export default function ContactPage() {
  const { t } = useTranslation();
  const [sent, setSent] = useState(false);

  const { data: infoList = [] } = useQuery<SchoolInfo[]>({
    queryKey: ['school-info'],
    queryFn: () => apiClient.get('/school-info').then(r => r.data.data),
  });

  const info = (key: string) => infoList.find(i => i.key === key)?.content;

  const { register, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    await apiClient.post('/contacts', data);
    setSent(true);
    reset();
  };

  return (
    <div className="max-w-6xl mx-auto px-4 py-10">
      <motion.div {...fade} className="text-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">{t('public.contact.title')}</h1>
        <p className="text-gray-500">{t('public.contact.subtitle')}</p>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">
        {/* Contact info */}
        <motion.div {...fade} transition={{ delay: 0.1 }} className="lg:col-span-2 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">{t('public.contact.infoTitle')}</h2>

          {[
            { icon: MapPin, label: t('public.about.address'),   value: info('address'),    color: 'bg-blue-50 text-blue-700' },
            { icon: Phone,  label: t('public.about.phone'),     value: info('phone'),      color: 'bg-green-50 text-green-700' },
            { icon: Mail,   label: t('public.about.email'),     value: info('email'),      color: 'bg-purple-50 text-purple-700' },
            { icon: Clock,  label: t('public.about.workHours'), value: info('work_hours'), color: 'bg-amber-50 text-amber-700' },
          ].map(({ icon: Icon, label, value, color }) => value && (
            <div key={label} className="card flex gap-4">
              <div className={`rounded-xl p-2.5 h-fit shrink-0 ${color}`}>
                <Icon className="w-4 h-4" />
              </div>
              <div>
                <p className="text-xs font-medium text-gray-400">{label}</p>
                <p className="text-gray-700 text-sm mt-0.5">{value}</p>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Contact form */}
        <motion.div {...fade} transition={{ delay: 0.2 }} className="lg:col-span-3">
          <div className="card">
            <h2 className="text-lg font-semibold text-gray-800 mb-5">{t('public.contact.formTitle')}</h2>

            {sent ? (
              <div className="text-center py-12">
                <div className="bg-green-50 rounded-full p-4 w-16 h-16 mx-auto mb-4 flex items-center justify-center">
                  <CheckCircle className="w-8 h-8 text-green-500" />
                </div>
                <h3 className="text-lg font-semibold text-gray-800 mb-2">{t('public.contact.sentTitle')}</h3>
                <p className="text-sm text-gray-500 mb-5">
                  {t('public.contact.sentDesc')}
                </p>
                <button onClick={() => setSent(false)} className="btn-primary">
                  {t('public.contact.sendNew')}
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                      {t('public.contact.fullName')} <span className="text-red-500">*</span>
                    </label>
                    <input className="input w-full" placeholder={t('public.contact.fullNamePlaceholder')} {...register('full_name')} />
                    {errors.full_name && <p className="text-xs text-red-500 mt-1">{t(errors.full_name.message!)}</p>}
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('public.about.phone')}</label>
                    <input className="input w-full" placeholder={t('public.contact.phonePlaceholder')} {...register('phone')} />
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">{t('public.about.email')}</label>
                  <input className="input w-full" type="email" placeholder={t('public.contact.emailPlaceholder')} {...register('email')} />
                  {errors.email && <p className="text-xs text-red-500 mt-1">{t(errors.email.message!)}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    {t('public.contact.subjectLabel')} <span className="text-red-500">*</span>
                  </label>
                  <input className="input w-full" placeholder={t('public.contact.subjectPlaceholder')} {...register('subject')} />
                  {errors.subject && <p className="text-xs text-red-500 mt-1">{t(errors.subject.message!)}</p>}
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-700 mb-1.5 block">
                    {t('public.contact.messageLabel')} <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    className="input w-full resize-none"
                    rows={5}
                    placeholder={t('public.contact.messagePlaceholder')}
                    {...register('message')}
                  />
                  {errors.message && <p className="text-xs text-red-500 mt-1">{t(errors.message.message!)}</p>}
                </div>

                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isSubmitting
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> {t('public.contact.sending')}</>
                    : <><Send className="w-4 h-4" /> {t('public.contact.send')}</>
                  }
                </button>
              </form>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}
