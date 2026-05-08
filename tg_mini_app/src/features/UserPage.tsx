import { useSuspenseQuery } from '@tanstack/react-query'
import { Table } from '@mantine/core'

import crud_api from '../services/crud'
import { AppointmentListSchema } from '../types/GetAppointmentsResponse'

function UserPage() {
  const { data: appointments } = useSuspenseQuery({
    queryKey: ['user-appointments'],
    queryFn: async () => {
      const response = await crud_api.get('/appointments');
      const parsed = AppointmentListSchema.parse(response.data);
      return parsed;
    },
    staleTime: 1000 * 60 * 60,
    retry: false, // handled by an axios inerceptor
  })

  const rows = appointments.map((appointment) => (
    <Table.Tr key={appointment.date}>
      <Table.Td>{appointment.date}</Table.Td>
      <Table.Td>{appointment.time}</Table.Td>
    </Table.Tr>
  ));

  return (
    <Table>
      <Table.Thead>
        <Table.Tr>
          <Table.Th>Date</Table.Th>
          <Table.Th>Time</Table.Th>
        </Table.Tr>
      </Table.Thead>
      <Table.Tbody>{rows}</Table.Tbody>
    </Table>
  );
}

export default UserPage
