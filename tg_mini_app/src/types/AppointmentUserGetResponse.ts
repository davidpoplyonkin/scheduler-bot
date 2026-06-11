import z from 'zod';
import { ServiceIn } from './ConstraintUserGetResponse';

export const AppointmentIn = z.object({
  id: z.number(),
  date: z.string(),
  time: z.string(),
  service: ServiceIn,
});

export const AppointmentUserGetResponseSchema = z.array(AppointmentIn);

export type AppointmentUserGetResponse = z.infer<typeof AppointmentUserGetResponseSchema>;