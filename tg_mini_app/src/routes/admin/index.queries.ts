import { queryOptions, mutationOptions } from '@tanstack/react-query';

import crud_api from '../../services/crud';
import { AppointmentAdminGetResponseSchema } from '../../types/AppointmentAdminGetResponse';
import { ProofVerifyResponseSchema } from '../../types/ProofVerifyResponse';

export const AdminAppointmentsQueryOptions = queryOptions({
  queryKey: ['admin-appointments'],
  queryFn: async () => {
    const response = await crud_api.get('admin/appointments');
    const parsed = AppointmentAdminGetResponseSchema.parse(response.data);
    return parsed;
  },
  staleTime: 1000 * 60 * 5,
  retry: false,
});

export const VerifyProofMutationOptions = mutationOptions({
  mutationFn: async (proof: {
    appointmentId: number;
    claimantId: number;
    authDate: string;
    hash: string;
  }) => {
    const response = await crud_api.post('admin/proofs/verify', proof);
    const parsed = ProofVerifyResponseSchema.parse(response.data);
    return parsed;
  },
});
