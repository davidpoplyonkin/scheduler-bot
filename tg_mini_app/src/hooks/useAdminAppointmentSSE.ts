import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppointmentSSE } from './useAppointmentSSE';
import type { AppointmentSSEResponse } from '../types/AppointmentSSEResponse';
import type { AppointmentAdminGetResponse } from '../types/AppointmentAdminGetResponse';

export function useAdminAppointmentSSE() {
  const queryClient = useQueryClient();

  const handleUpdate = useCallback(
    (data: AppointmentSSEResponse) => {
      queryClient.setQueryData<AppointmentAdminGetResponse>(
        ['admin-appointments'],
        (old) => {
          if (!old) return old;
          for (let i = 0; i < old.days.length; i++) {
            const apptIdx = old.days[i].appointments.findIndex(
              (a) => a.id === data.id
            );
            if (apptIdx !== -1) {
              const newDays = [...old.days];
              const newAppts = [...newDays[i].appointments];
              newAppts[apptIdx] = { ...newAppts[apptIdx], status: data.status };
              newDays[i] = { ...newDays[i], appointments: newAppts };
              return { days: newDays };
            }
          }
          return old; // Unknown ID - do nothing
        }
      );
    },
    [queryClient]
  );

  useAppointmentSSE(handleUpdate);
}
