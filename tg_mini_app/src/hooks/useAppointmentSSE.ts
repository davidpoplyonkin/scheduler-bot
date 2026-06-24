import { useEffect, useRef } from 'react';
import {
  AppointmentSSEResponseSchema,
  type AppointmentSSEResponse,
} from '../types/AppointmentSSEResponse';

const SSE_URL = `${import.meta.env.VITE_CRUD_API_URL}/sse/appointments`;

export function useAppointmentSSE(
  onUpdate: (data: AppointmentSSEResponse) => void
) {
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
      onUpdate(data);
    };

    eventSource.onerror = () => {
      eventSource.close();
    };

    return () => {
      eventSource.close();
      eventSourceRef.current = null;
    };
  }, [onUpdate]);
}
