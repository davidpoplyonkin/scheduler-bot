import { mutationOptions } from '@tanstack/react-query';

import crud_api from '../../services/crud';

export const CreateAppointmentMutationOptions = mutationOptions({
  mutationFn: async (values: { date: string; slot: number }) => {
    return crud_api.post('user/appointments', {
      date: values.date,
      timeSlotId: values.slot
    });
  },
})
