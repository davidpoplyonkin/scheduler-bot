import { createFileRoute } from '@tanstack/react-router'

import { ConstraintsQueryOptions, BlocksQueryOptions } from '../index.queries';

export const Route = createFileRoute('/admin/blackout')({
  loader: async ({ context: { queryClient } }) => {
    // Get current month in YYYY-MM format
    const month = new Date().toISOString().slice(0, 7);

    const [constraints, blocksResponse] = await Promise.all([
      queryClient.ensureQueryData(ConstraintsQueryOptions),
      queryClient.ensureQueryData({
        ...BlocksQueryOptions(month),
        revalidateIfStale: true,
      }),
    ]);

    return { constraints, blocksResponse };
  }
})
