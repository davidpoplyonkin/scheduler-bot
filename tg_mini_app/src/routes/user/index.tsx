import { createFileRoute } from '@tanstack/react-router'
import { queryOptions } from '@tanstack/react-query';

import crud_api from '../../services/crud';
import { AppointmentListSchema } from '../../types/GetAppointmentsResponse';

const UserAppointmentsQueryOptions = queryOptions({
  queryKey: ['user-appointments'],
    queryFn: async () => {
      const response = await crud_api.get('/appointments');
      const parsed = AppointmentListSchema.parse(response.data);
      return parsed;
    },
    staleTime: 1000 * 60 * 60,
    retry: false, // handled by an axios inerceptor
})

export const Route = createFileRoute('/user/')({
  loader: async ({ context: { queryClient } }) => {
    return await queryClient.ensureQueryData(UserAppointmentsQueryOptions);
  }
})