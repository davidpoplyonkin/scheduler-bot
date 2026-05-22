import z from 'zod';

const BlockIn = z.object({
  timeSlotId: z.number().int(),
});

const BlockAggregateIn = z.object({
  date: z.string(),
  unavailableSlots: z.array(BlockIn),
})

export const BlockUserGetResponseSchema = z.object({
  serverTime: z.string(),
  blocks: z.array(BlockAggregateIn),
});

export type BlockUserGetResponse = z.infer<typeof BlockUserGetResponseSchema>;