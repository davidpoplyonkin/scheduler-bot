import { useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { useAppointmentSSE } from './useAppointmentSSE';
import type { AppointmentSSEResponse } from '../types/AppointmentSSEResponse';
import type { AppointmentUserGetResponse } from '../types/AppointmentUserGetResponse';

export function useUserAppointmentSSE() {
  const queryClient = useQueryClient();

  const handleUpdate = useCallback(
    (data: AppointmentSSEResponse) => {
      queryClient.setQueryData<AppointmentUserGetResponse>(
        ['user-appointments'],
        (old) => {
          if (!old) return old;
          const idx = old.findIndex((a) => a.id === data.id);
          if (idx === -1) return old; // Unknown ID - do nothing
          const updated = [...old];
          updated[idx] = { ...updated[idx], status: data.status };
          return updated;
        }
      );
    },
    [queryClient]
  );

  useAppointmentSSE(handleUpdate);
}
