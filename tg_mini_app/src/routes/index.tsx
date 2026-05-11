import { createFileRoute, redirect } from '@tanstack/react-router'
import { queryOptions } from '@tanstack/react-query';

import getToken from '../utils/auth';

const authQueryOptions = queryOptions({
  queryKey: ['auth'],
  queryFn: getToken,
  staleTime: Infinity,
  retry: false,
})

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context: { queryClient } }) => {
    // Fetch the user role from the API
    const role = await queryClient.ensureQueryData(authQueryOptions);

    // Conditionally redirect based on the user's role
    if (role === 'admin') {
      throw redirect({
        to: '/admin',
        replace: true, // prevent the '/' from staying in history
      })
    } else {
      throw redirect({
        to: '/user',
        replace: true,
      })
    }
  }
})