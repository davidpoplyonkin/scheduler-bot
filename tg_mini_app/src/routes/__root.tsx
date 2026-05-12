import { createRootRouteWithContext, Outlet } from '@tanstack/react-router';
import { type QueryClient } from '@tanstack/react-query';
import { TanStackRouterDevtools } from '@tanstack/react-router-devtools';
import { Container } from '@mantine/core';

import LoadingScreen from '../components/LoadingScreen';
import ErrorScreen from '../components/ErrorScreen';

const RootLayout = () => (
  <Container
      size={480}
      pt='max(var(--mantine-spacing-xs), var(--tg-safe-area-inset-top))'
      pb='max(var(--mantine-spacing-xs), var(--tg-safe-area-inset-bottom))'
      ps='max(var(--mantine-spacing-xs), var(--tg-safe-area-inset-left))'
      pe='max(var(--mantine-spacing-xs), var(--tg-safe-area-inset-right))'
    >
    <Outlet />
    <TanStackRouterDevtools />
  </Container>
)

interface RootRouterContext {
  queryClient: QueryClient
}

export const Route = createRootRouteWithContext<RootRouterContext>()({
  component: RootLayout,
  pendingComponent: LoadingScreen,
  errorComponent: ErrorScreen,
})