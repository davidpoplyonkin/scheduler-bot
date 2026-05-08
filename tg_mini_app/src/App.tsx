import '@mantine/core/styles.css';

import { lazy } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';
import { Container } from '@mantine/core';

import getToken from './utils/auth';
import { RoleSchema } from './types/Role';

// Lazy load the components
const AdminPage = lazy(() => import('./features/AdminPage'));
const UserPage = lazy(() => import('./features/UserPage'));

function App() {
  // On the client side, the role is checked only once - to determine whether to
  // show user or admin UI; so, using the role as is rather than saving it to a
  // state.
  const { data: role } = useSuspenseQuery({
    queryKey: ['auth-init'],
    queryFn: getToken,
    staleTime: Infinity,
    retry: false,
  });

  // If a hacker sets their role to "admin", they will see an empty admin UI
  return (
    <Container
      size={480}
      pt='var(--tg-safe-area-inset-top)'
      pb='var(--tg-safe-area-inset-bottom)'
      ps='var(--tg-safe-area-inset-left)'
      pe='var(--tg-safe-area-inset-right)'
    >
      { role === RoleSchema.enum.admin ? <AdminPage /> : <UserPage /> }
    </Container>
  );
}

export default App
