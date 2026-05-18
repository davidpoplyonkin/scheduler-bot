import z from 'zod';

export const AppointmentIn = z.object({
  date: z.string(),
  time: z.string(),
});

export const AppointmentUserGetResponseSchema = z.array(AppointmentIn);

export type AppointmentUserGetResponse = z.infer<typeof AppointmentUserGetResponseSchema>;