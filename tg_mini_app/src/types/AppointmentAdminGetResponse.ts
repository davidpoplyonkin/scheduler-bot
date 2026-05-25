import z from 'zod';

const AppointmentAdminIn = z.object({
  id: z.number(),
  time: z.string(),
  userId: z.number(),
  userFullName: z.string().nullable(),
});

const AppointmentAdminAggregateIn = z.object({
  date: z.string(),
  appointments: z.array(AppointmentAdminIn),
});

export const AppointmentAdminGetResponseSchema = z.object({
  days: z.array(AppointmentAdminAggregateIn),
});

export type AppointmentAdminGetResponse = z.infer<typeof AppointmentAdminGetResponseSchema>;
