import i18n from './config';

const INTL_LOCALE_MAP: Record<string, string> = {
  uz: 'uz',
  ru: 'ru',
  en: 'en',
  kaa: 'uz',
};

export function getDateLocale(): string {
  return INTL_LOCALE_MAP[i18n.language] ?? 'uz';
}
