import { queryOptions } from '@tanstack/react-query';

import getToken from '../utils/auth';

export const AuthQueryOptions = queryOptions({
  queryKey: ['auth'],
  queryFn: getToken,
  staleTime: Infinity,
  retry: false,
})