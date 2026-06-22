import z from 'zod';
import { ServiceBasicIn } from './Service';

export const ProofVerifyResponseSchema = z.object({
  appointmentId: z.number(),
  userName: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
  service: ServiceBasicIn,
});

export type ProofVerifyResponse = z.infer<typeof ProofVerifyResponseSchema>;
