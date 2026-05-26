import z from 'zod';

export const ProofVerifyResponseSchema = z.object({
  appointmentId: z.number(),
  userName: z.string(),
  appointmentDate: z.string(),
  appointmentTime: z.string(),
});

export type ProofVerifyResponse = z.infer<typeof ProofVerifyResponseSchema>;
