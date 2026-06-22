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
    button.show();

    const handleButtonClick = () => {
      callback();
    };

    button.onClick(handleButtonClick);

    return () => {
      button.offClick(handleButtonClick);
    };
  }, []);

  useEffect(() => {
    button.setText(text);
  }, [text])

  const theme = useThemeStore();
  useEffect(() => {
    const updateButton = async () => {
      if (isActive) {
        button.setParams({
          is_active: true,
          color: await resolveCssVar('--mantine-primary-color-filled'),
          text_color: await resolveCssVar('--mantine-primary-color-contrast'),
          position: 'top'
        });
      } else {
        button.setParams({
          is_active: false,
          color: await resolveCssVar('--mantine-color-disabled'),
          text_color: await resolveCssVar('--mantine-color-disabled-color'),
          position: 'top'
        });
      }
    };

    updateButton();
  }, [isActive, theme]);

  return null;
}
