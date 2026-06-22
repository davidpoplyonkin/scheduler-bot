import z from 'zod';

/** Service without pricing - for appointment displays */
export const ServiceBasicIn = z.object({
  id: z.number().int(),
  name: z.string(),
});

/** Service with pricing - for booking form constraints */
export const ServiceIn = ServiceBasicIn.extend({
  amountMinor: z.number().int(),
  currencyCode: z.number().int(),
});

export type ServiceBasic = z.infer<typeof ServiceBasicIn>;
export type Service = z.infer<typeof ServiceIn>;
