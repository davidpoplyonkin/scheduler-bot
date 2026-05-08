import '@mantine/core/styles.css';

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Suspense, useState, useEffect } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { MantineProvider, type CSSVariablesResolver } from '@mantine/core';

import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

import App from './App.tsx'

const tg = window.Telegram.WebApp;

const resolver: CSSVariablesResolver = (_theme) => ({
  variables: {},
  light: {
    '--mantine-color-body': 'var(--tg-theme-bg-color, #ffffff)'
  },
  dark: {
    '--mantine-color-body': 'var(--tg-theme-bg-color, #000000)'
  },
});

const queryClient = new QueryClient()

function Root() {
  const [theme, setTheme] = useState(tg.colorScheme);

  useEffect(() => {
    tg.ready();

    const handleThemeChange = () => {
      console.log('Theme changed to', tg.colorScheme);
      setTheme(tg.colorScheme);
    };

    // Listen for theme changes
    tg.onEvent('themeChanged', handleThemeChange);

    return () => {
      tg.offEvent('themeChanged', handleThemeChange);
    };
  }, []);

  return (
    <StrictMode>
      <MantineProvider forceColorScheme={theme} cssVariablesResolver={resolver}>
        <QueryClientProvider client={queryClient}>
          <ErrorBoundary fallback={<ErrorScreen />}>
            <Suspense fallback={<LoadingScreen />}>
              <App />
            </Suspense>
          </ErrorBoundary>
        </QueryClientProvider>
      </MantineProvider>
    </StrictMode>
  );
}

createRoot(document.getElementById('root')!).render(<Root />);