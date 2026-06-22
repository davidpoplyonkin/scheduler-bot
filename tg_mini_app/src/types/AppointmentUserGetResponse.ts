import z from 'zod';
import { ServiceIn } from './ConstraintUserGetResponse';

export const AppointmentStatus = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED']);

export const AppointmentIn = z.object({
  id: z.number(),
  date: z.string(),
  time: z.string(),
  service: ServiceIn,
  status: AppointmentStatus,
});

export const AppointmentUserGetResponseSchema = z.array(AppointmentIn);

export type AppointmentUserGetResponse = z.infer<typeof AppointmentUserGetResponseSchema>;