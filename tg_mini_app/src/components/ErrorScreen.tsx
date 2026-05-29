import { useEffect } from 'react';
import { useTranslation } from 'react-i18next';

import { EmptyState } from './EmptyState';
import FatalErrorIcon from '../assets/Fatal Error.svg?react';

const tg = window.Telegram.WebApp;

function ErrorScreen() {
  const { t } = useTranslation();

  useEffect(() => {
    tg.MainButton.hide();
    tg.SecondaryButton.hide();
  }, []);

  return (
    <EmptyState text={t('screens.error')}>
      <FatalErrorIcon height={128} fill='var(--mantine-color-dimmed)' />
    </EmptyState>
  );
}

export default ErrorScreen