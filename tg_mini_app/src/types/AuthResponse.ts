import z from 'zod';

import { RoleSchema } from './Role';

export const AuthResponseSchema = z.object({
  role: RoleSchema,
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;