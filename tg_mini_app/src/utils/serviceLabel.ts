import type { Service } from '../types/ConstraintUserGetResponse';
import type { TFunction, Namespace } from 'i18next';

const tg = window.Telegram.WebApp;

export function getServiceLabel<NS extends Namespace>(
  t: TFunction<NS>,
  service: Service
): string {
  const userLang = tg.initDataUnsafe.user?.language_code;
  return (
    service.translations.find(t => t.languageCode === userLang)?.name ||
    service.translations.find(t => t.languageCode === 'en')?.name ||
    t('labels.serviceLabel', { ns: 'shared', id: service.id.toString() })
  );
}
