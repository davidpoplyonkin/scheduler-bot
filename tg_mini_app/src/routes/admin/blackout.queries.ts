import { mutationOptions } from '@tanstack/react-query';

import crud_api from '../../services/crud';

export const CreateBlackoutMutationOptions = mutationOptions({
  mutationFn: async (values: { startDate: string; endDate: string; slots: number[] }) => {
    return crud_api.post('admin/blackout', values);
  },
});
