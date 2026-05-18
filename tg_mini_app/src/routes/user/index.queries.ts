import { queryOptions } from '@tanstack/react-query';

import crud_api from '../../services/crud';
import { AppointmentUserGetResponseSchema } from '../../types/AppointmentUserGetResponse';

export const UserAppointmentsQueryOptions = queryOptions({
  queryKey: ['user-appointments'],
    queryFn: async () => {
      const response = await crud_api.get('user/appointments');
      const parsed = AppointmentUserGetResponseSchema.parse(response.data);
      return parsed;
    },
    staleTime: 1000 * 60 * 60,
    retry: false, // handled by an axios interceptor
})