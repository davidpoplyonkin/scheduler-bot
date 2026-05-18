import { createFileRoute } from '@tanstack/react-router'

import { UserAppointmentsQueryOptions } from './index.queries';

export const Route = createFileRoute('/user/')({
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData(UserAppointmentsQueryOptions);
  }
})