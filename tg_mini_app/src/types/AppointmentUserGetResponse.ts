import z from 'zod';
import { ServiceBasicIn } from './Service';

export const AppointmentStatus = z.enum(['PENDING', 'CONFIRMED', 'COMPLETED']);

export const AppointmentIn = z.object({
  id: z.number(),
  date: z.string(),
  time: z.string(),
  service: ServiceBasicIn,
  status: AppointmentStatus,
});

export const AppointmentUserGetResponseSchema = z.array(AppointmentIn);

export type AppointmentUserGetResponse = z.infer<typeof AppointmentUserGetResponseSchema>;