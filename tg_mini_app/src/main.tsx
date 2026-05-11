import '@mantine/core/styles.css';

import { StrictMode, useState, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient } from '@tanstack/react-query';
import { MantineProvider, type CSSVariablesResolver } from '@mantine/core';

// Import the generated route tree
import { routeTree } from './routeTree.gen';

const queryClient = new QueryClient()

// Create a new router instance
const router = createRouter({
  routeTree,
  context: {
    queryClient,
  },
  defaultPreloadStaleTime: 0, // Delegate caching to Tanstack Query
})

// Register the router instance for type safety
declare module '@tanstack/react-router' {
  interface Register {
    router: typeof router
  }
}

const tg = window.Telegram.WebApp;

// Match Telegram's CSS variables to Mantine's theming system
const resolver: CSSVariablesResolver = (_theme) => ({
  variables: {},
  light: {
    '--mantine-color-body': 'var(--tg-theme-bg-color, #ffffff)'
  },
  dark: {
    '--mantine-color-body': 'var(--tg-theme-bg-color, #000000)'
  },
});

function Root() {
  const [theme, setTheme] = useState(tg.colorScheme);

  useEffect(() => {
    tg.ready();

    const handleThemeChange = () => {
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
        <RouterProvider router={router} />
      </MantineProvider>
    </StrictMode>
  );
}

// Render the app
const rootElement = document.getElementById('root')!
if (!rootElement.innerHTML) {
  const root = ReactDOM.createRoot(rootElement)
  root.render(<Root />)
}