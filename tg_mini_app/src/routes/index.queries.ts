import { queryOptions } from '@tanstack/react-query';

import getToken from '../utils/auth';
import crud_api from '../services/crud';
import { ConstraintGetResponseSchema } from '../types/ConstraintUserGetResponse';
import { BlockUserGetResponseSchema } from '../types/BlockUserGetResponse';

export const AuthQueryOptions = queryOptions({
  queryKey: ['auth'],
  queryFn: getToken,
  staleTime: Infinity,
  retry: false,
})

export const ConstraintsQueryOptions = queryOptions({
  queryKey: ['constraints'],
  queryFn: async () => {
    const response = await crud_api.get('shared/constraints');
    const parsed = ConstraintGetResponseSchema.parse(response.data);
    return parsed;
  },
  staleTime: Infinity, // semi-static data
  retry: false, // handled by an axios interceptor
})

export const BlocksQueryOptions = (month: string) => queryOptions({
  queryKey: ['blocks', month],
  queryFn: async () => {
    const response = await crud_api.get('shared/blocks', { params: { month } });
    const parsed = BlockUserGetResponseSchema.parse(response.data);
    return parsed;
  },
  staleTime: 1000 * 60 * 5,
  retry: false, // handled by an axios interceptor
})