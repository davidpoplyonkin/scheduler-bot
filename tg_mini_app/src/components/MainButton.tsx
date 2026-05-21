import { useEffect } from 'react';

import { resolveCssVar } from '../utils/cssResolver';
import { useThemeStore } from '../stores/ThemeStore';

const tg = window.Telegram.WebApp;

interface MainButtonProps {
  formValid: boolean;
  triggerSubmit: () => void;
}

export function MainButton({ formValid, triggerSubmit }: MainButtonProps) {
  useEffect(() => {
    tg.MainButton.setText('Submit');
    tg.MainButton.show();

    const handleMainButtonClick = () => {
      triggerSubmit();
    };

    tg.MainButton.onClick(handleMainButtonClick);

    return () => {
      tg.MainButton.offClick(handleMainButtonClick);
    };
  }, []);

  const theme = useThemeStore();
  useEffect(() => {
    const updateMainButton = async () => {
      if (formValid) {
        tg.MainButton.setParams({
          is_active: true,
          color: await resolveCssVar('--mantine-primary-color-filled'),
          text_color: await resolveCssVar('--mantine-primary-color-contrast'),
        });
      } else {
        tg.MainButton.setParams({
          is_active: false,
          color: await resolveCssVar('--mantine-color-disabled'),
          text_color: await resolveCssVar('--mantine-color-disabled-color'),
        });
      }
    };

    updateMainButton();
  }, [formValid, theme]);

  return null;
}
