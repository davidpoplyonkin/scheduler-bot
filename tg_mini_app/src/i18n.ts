import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import Backend from 'i18next-http-backend';
import dayjs from 'dayjs';

const tg = window.Telegram.WebApp;

const locales = ['en', 'ru', 'uk'] as const;
const lngCode = tg.initDataUnsafe?.user?.language_code || locales[0];

export const locale = locales.find((l) => (l == lngCode)) || locales[0];

i18n
  .use(Backend)
  .use(initReactI18next)
  .init({
    lng: locale,
    fallbackLng: locales[0],
    ns: ['shared'],
    defaultNS: 'shared',
    backend: {
      // query parameter cache buster
      loadPath: '/locales/{{lng}}/{{ns}}.json?v=${__BUILD_TIME__}',
    },
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

const dayjsImports = {
  en: () => import('dayjs/locale/en'),
  ru: () => import('dayjs/locale/ru'),
  uk: () => import('dayjs/locale/uk'),
};

async function setDayJsLocale(locale: typeof locales[number]) {
  await dayjsImports[locale]();
  dayjs.locale(locale);
}

await setDayJsLocale(locale);
