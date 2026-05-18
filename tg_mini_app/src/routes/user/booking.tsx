import { createFileRoute } from '@tanstack/react-router'

import { UserConstraintsQueryOptions } from './booking.queries';
import { UserBlocksQueryOptions } from './booking.queries';


export const Route = createFileRoute('/user/booking')({
  loader: async ({ context: { queryClient } }) => {
    // Get current month in YYYY-MM format
    const month = new Date().toISOString().slice(0, 7);

    const [constraints, blocksResponse ] = await Promise.all([
      queryClient.ensureQueryData(UserConstraintsQueryOptions),
      queryClient.ensureQueryData(UserBlocksQueryOptions(month)),
    ]);

    return { constraints, blocksResponse };
  }
})