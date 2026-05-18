import { createFileRoute, redirect } from '@tanstack/react-router'

import { AuthQueryOptions } from './index.queries';

export const Route = createFileRoute('/')({
  beforeLoad: async ({ context: { queryClient } }) => {
    // Fetch the user role from the API
    const role = await queryClient.ensureQueryData(AuthQueryOptions);

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