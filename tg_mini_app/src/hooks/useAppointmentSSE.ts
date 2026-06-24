import { useEffect, useRef, useCallback } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { AppointmentSSEResponseSchema } from '../types/AppointmentSSEResponse';
import type { AppointmentStatus } from '../types/AppointmentUserGetResponse';

const SSE_URL = `${import.meta.env.VITE_CRUD_API_URL}/sse/appointments`;

type AppointmentWithStatus = { id: number; status: AppointmentStatus };

export function useAppointmentSSE(queryKey: string) {
  const queryClient = useQueryClient();

  const handleUpdate = useCallback(
    (id: number, status: AppointmentStatus) => {
      queryClient.setQueryData<AppointmentWithStatus[]>(
        [queryKey],
        (old) => {
          if (!old) return old;
          const idx = old.findIndex((a) => a.id === id);
          if (idx === -1) return old;
          const updated = [...old];
          updated[idx] = { ...updated[idx], status };
          return updated;
        }
      );
    },
    [queryClient, queryKey]
  );

  const eventSourceRef = useRef<EventSource | null>(null);

  useEffect(() => {
    const eventSource = new EventSource(SSE_URL, { withCredentials: true });
    eventSourceRef.current = eventSource;

    eventSource.onmessage = (event) => {
      let data;
      try {
        data = AppointmentSSEResponseSchema.parse(JSON.parse(event.data));
      } catch {
        // Ignore invalid messages (JSON parse errors or Zod validation errors)
        return;
      }
      handleUpdate(data.id, data.status);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [handleUpdate]);
}
