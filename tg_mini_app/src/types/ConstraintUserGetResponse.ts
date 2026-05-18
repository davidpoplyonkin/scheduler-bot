import z from 'zod';

export const TimeSlotIn = z.object({
  id: z.number().int(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/),
});

export const ConstraintGetResponseSchema = z.object({
  timeSlots: z.array(TimeSlotIn),
});

export type ConstraintGetResponse = z.infer<typeof ConstraintGetResponseSchema>;