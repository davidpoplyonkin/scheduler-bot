import { create } from 'zustand';

const tg = window.Telegram.WebApp
type ColorScheme = typeof tg.colorScheme
type Color = typeof tg.themeParams.button_color

interface ThemeState {
  colorScheme: ColorScheme;
  primaryColor: Color;
  backgroundColor: Color;
  setTheme: (
    colorScheme: ColorScheme,
    primaryColor: Color,
    backgroundColor: Color,
  ) => void;
}

export const useThemeStore = create<ThemeState>((set) => ({
  colorScheme: tg.colorScheme,
  primaryColor: tg.themeParams.button_color,
  backgroundColor: tg.themeParams.bg_color,
  setTheme: (colorScheme, primaryColor, backgroundColor) => set(
    { colorScheme, primaryColor, backgroundColor }
  ),
}));