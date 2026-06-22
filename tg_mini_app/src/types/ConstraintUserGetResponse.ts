import z from 'zod';
import { ServiceIn } from './Service';

export const TimeSlotIn = z.object({
  id: z.number().int(),
  startTime: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)(:([0-5]\d))?$/),
});

export const ConstraintGetResponseSchema = z.object({
  timeSlots: z.array(TimeSlotIn),
  services: z.array(ServiceIn),
  minAdvanceMinutes: z.number(),
  maxAdvanceDays: z.number(),
  forbiddenWeekdays: z.array(z.number()),
});

export type ConstraintGetResponse = z.infer<typeof ConstraintGetResponseSchema>;