import { queryOptions } from '@tanstack/react-query';

import crud_api from '../../services/crud';
import { AppointmentAdminGetResponseSchema } from '../../types/AppointmentAdminGetResponse';

export const AdminAppointmentsQueryOptions = queryOptions({
  queryKey: ['admin-appointments'],
  queryFn: async () => {
    const response = await crud_api.get('admin/appointments');
    const parsed = AppointmentAdminGetResponseSchema.parse(response.data);
    return parsed;
  },
  staleTime: 1000 * 60 * 5,
  retry: false,
});
