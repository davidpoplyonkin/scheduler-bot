import z from 'zod';
import { ServiceBasicIn } from './Service';
import { AppointmentStatus } from './AppointmentUserGetResponse';

export const AppointmentAdminInSchema = z.object({
  id: z.number(),
  date: z.string(),
  time: z.string(),
  userId: z.number(),
  userFullName: z.string().nullable(),
  service: ServiceBasicIn,
  status: AppointmentStatus,
});

export type AppointmentAdminIn = z.infer<typeof AppointmentAdminInSchema>;

export const AppointmentAdminGetResponseSchema = z.array(AppointmentAdminInSchema);

export type AppointmentAdminGetResponse = z.infer<typeof AppointmentAdminGetResponseSchema>;
