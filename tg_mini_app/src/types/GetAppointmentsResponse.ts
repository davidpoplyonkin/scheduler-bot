import z from 'zod';

export const AppointmentSchema = z.object({
  date: z.string(),
  time: z.string(),
});

export const AppointmentListSchema = z.array(AppointmentSchema);

export type AppointmentList = z.infer<typeof AppointmentListSchema>;