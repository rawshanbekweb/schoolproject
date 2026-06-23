import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import uz from './locales/uz.json';
import ru from './locales/ru.json';
import en from './locales/en.json';
import kaa from './locales/kaa.json';

export const LANG_STORAGE_KEY = 'app_lang';
export const SUPPORTED_LANGS = ['uz', 'ru', 'en', 'kaa'] as const;

const stored = localStorage.getItem(LANG_STORAGE_KEY);
const initialLang = SUPPORTED_LANGS.includes(stored as any) ? stored! : 'uz';

i18n.use(initReactI18next).init({
  resources: {
    uz: { translation: uz },
    ru: { translation: ru },
    en: { translation: en },
    kaa: { translation: kaa },
  },
  lng: initialLang,
  fallbackLng: 'uz',
  interpolation: { escapeValue: false },
});

export default i18n;
