import { mutationOptions } from '@tanstack/react-query';

import crud_api from '../../services/crud';

export const CreateAppointmentMutationOptions = mutationOptions({
  mutationFn: async (values: { date: string; slot: number; service: number }) => {
    const response = await crud_api.post<{
      id: number;
      date: string;
      time: string;
      paymentUrl: string;
    }>('user/appointments', {
      date: values.date,
      timeSlotId: values.slot,
      serviceId: values.service
    });
    return response.data;
  },
})
