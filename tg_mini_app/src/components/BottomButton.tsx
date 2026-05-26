import { useEffect } from 'react';

import { resolveCssVar } from '../utils/cssResolver';
import { useThemeStore } from '../stores/ThemeStore';

const tg = window.Telegram.WebApp;

interface BottomButtonProps {
  type?: 'main' | 'secondary';
  text: string;
  isActive: boolean;
  callback: () => void;
}

export function BottomButton({
  type = 'main',
  text,
  isActive,
  callback,
}: BottomButtonProps) {
  const button = type === 'main' ? tg.MainButton : tg.SecondaryButton;

  useEffect(() => {
    button.setText(text);
    button.show();

    const handleButtonClick = () => {
      callback();
    };

    button.onClick(handleButtonClick);

    return () => {
      button.offClick(handleButtonClick);
    };
  }, []);

  const theme = useThemeStore();
  useEffect(() => {
    const updateButton = async () => {
      if (isActive) {
        button.setParams({
          is_active: true,
          color: await resolveCssVar('--mantine-primary-color-filled'),
          text_color: await resolveCssVar('--mantine-primary-color-contrast'),
        });
      } else {
        button.setParams({
          is_active: false,
          color: await resolveCssVar('--mantine-color-disabled'),
          text_color: await resolveCssVar('--mantine-color-disabled-color'),
        });
      }
    };

    updateButton();
  }, [isActive, theme]);

  return null;
}
