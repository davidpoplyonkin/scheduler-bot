import { useEffect } from 'react';

import { resolveCssVar } from '../utils/cssResolver';
import { useThemeStore } from '../stores/ThemeStore';

const tg = window.Telegram.WebApp;

interface MainButtonProps {
  text: string;
  isActive: boolean;
  callback: () => void;
}

export function MainButton({ text, isActive, callback }: MainButtonProps) {
  useEffect(() => {
    tg.MainButton.setText(text);
    tg.MainButton.show();

    const handleMainButtonClick = () => {
      callback();
    };

    tg.MainButton.onClick(handleMainButtonClick);

    return () => {
      tg.MainButton.offClick(handleMainButtonClick);
    };
  }, []);

  const theme = useThemeStore();
  useEffect(() => {
    const updateMainButton = async () => {
      if (isActive) {
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
  }, [isActive, theme]);

  return null;
}
