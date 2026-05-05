import { Suspense, lazy } from 'react';
import { ErrorBoundary } from 'react-error-boundary';
import { useSuspenseQuery } from '@tanstack/react-query';

import LoadingScreen from './components/LoadingScreen';
import ErrorScreen from './components/ErrorScreen';
import getToken from './utils/auth';
import { RoleSchema } from './types/Role';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'

const queryClient = new QueryClient()

// Lazy load the components
const AdminPage = lazy(() => import('./features/AdminPage'));
const UserPage = lazy(() => import('./features/UserPage'));

function MainContent() {
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
  return role === RoleSchema.enum.admin ? <AdminPage /> : <UserPage />;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <ErrorBoundary fallback={<ErrorScreen />}>
        <Suspense fallback={<LoadingScreen />}>
          <MainContent />
        </Suspense>
      </ErrorBoundary>
    </QueryClientProvider>
  );
}

export default App
