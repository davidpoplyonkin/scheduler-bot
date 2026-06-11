import z from 'zod';
import { ServiceIn } from './ConstraintUserGetResponse';

export const ProofVerifyResponseSchema = z.object({
  appointmentId: z.number(),
  userName: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  service: ServiceIn,
});

export type ProofVerifyResponse = z.infer<typeof ProofVerifyResponseSchema>;
