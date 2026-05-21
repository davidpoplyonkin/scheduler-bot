import '@mantine/core/styles.css';
import '@mantine/dates/styles.css';
import '@mantine/notifications/styles.css';

import { StrictMode, useEffect } from 'react';
import ReactDOM from 'react-dom/client';
import { RouterProvider, createRouter } from '@tanstack/react-router';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { MantineProvider, createTheme } from '@mantine/core';
import { Notifications } from '@mantine/notifications';

// Import the generated route tree
import { routeTree } from './routeTree.gen';
import { generateShades } from './utils/shades';

import { useThemeStore } from './stores/ThemeStore';

const queryClient = new QueryClient();

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

function Root() {
  const colorScheme = useThemeStore((state) => state.colorScheme);
  const primaryColor = useThemeStore((state) => state.primaryColor);
  const backgroundColor = useThemeStore((state) => state.backgroundColor);
  const setTheme = useThemeStore((state) => state.setTheme);

  useEffect(() => {
    tg.ready();

    const handleThemeChange = () => {
      setTheme(
        tg.colorScheme,
        tg.themeParams.button_color,
        tg.themeParams.bg_color
      );
    };

    // Listen for theme changes
    tg.onEvent('themeChanged', handleThemeChange);

    return () => {
      tg.offEvent('themeChanged', handleThemeChange);
    };
  }, []);

  const theme = createTheme({
    colors: {
      tgPrimaryColor: generateShades(primaryColor),

      // When the mode is dark, use the palette derived from the Telegram
      // background color for the app background, the backgrounds of disabled
      // elements, etc.
      dark: generateShades(backgroundColor),

      // Not overriding the `gray` palette (`dark` alternative in light mode)
      // since Telegram's background color in light mode appears to always be
      // white, which isn't a good base for palette generation (e.g. the 7th
      // shade in the palette must match the background color)
    },
    primaryColor: 'tgPrimaryColor',
    primaryShade: 7,
  });

  return (
    <StrictMode>
      <MantineProvider
        theme={theme}
        forceColorScheme={colorScheme}
      >
        <Notifications />
        <QueryClientProvider client={queryClient}>
          <RouterProvider router={router} />
        </QueryClientProvider>
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