import z from 'zod';
import { AppointmentStatus } from './AppointmentUserGetResponse';

export const AppointmentSSEResponseSchema = z.object({
  id: z.number(),
  status: AppointmentStatus,
});

export type AppointmentSSEResponse = z.infer<typeof AppointmentSSEResponseSchema>;
