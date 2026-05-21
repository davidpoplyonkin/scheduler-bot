import z from 'zod';

export const AppointmentIn = z.object({
  id: z.number(),
  date: z.string(),
  time: z.string(),
});

export const AppointmentUserGetResponseSchema = z.array(AppointmentIn);

export type AppointmentUserGetResponse = z.infer<typeof AppointmentUserGetResponseSchema>;