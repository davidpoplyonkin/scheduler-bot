import z from 'zod';

export const ProofGenerateResponseSchema = z.object({
  appointmentId: z.number(),
  claimantId: z.number(),
  authDate: z.string(),
  hash: z.string(),
});

export type ProofGenerateResponse = z.infer<typeof ProofGenerateResponseSchema>;
