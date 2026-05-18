import { queryOptions } from '@tanstack/react-query';

import crud_api from '../../services/crud';
import { ConstraintGetResponseSchema } from '../../types/ConstraintUserGetResponse';
import { BlockUserGetResponseSchema } from '../../types/BlockUserGetResponse';

export const UserConstraintsQueryOptions = queryOptions({
  queryKey: ['user-constraints'],
    queryFn: async () => {
      const response = await crud_api.get('user/constraints');
      const parsed = ConstraintGetResponseSchema.parse(response.data);
      return parsed;
    },
    staleTime: Infinity, // semi-static data
    retry: false, // handled by an axios interceptor
})

export const UserBlocksQueryOptions = (month: string) => queryOptions({
  queryKey: ['user-blocks', month],
  queryFn: async () => {
    const response = await crud_api.get('user/blocks', { params: { month } });
    const parsed = BlockUserGetResponseSchema.parse(response.data);
    return parsed;
  },
  staleTime: 1000 * 60 * 5,
  retry: false, // handled by an axios interceptor
})