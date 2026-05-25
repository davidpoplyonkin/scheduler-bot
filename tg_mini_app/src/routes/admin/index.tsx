import { createFileRoute } from '@tanstack/react-router'

import { AdminAppointmentsQueryOptions } from './index.queries';

export const Route = createFileRoute('/admin/')({
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData({
      ...AdminAppointmentsQueryOptions,
      revalidateIfStale: true,
    });
  }
})
