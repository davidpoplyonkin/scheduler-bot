import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Table } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'

import { UserAppointmentsQueryOptions } from './index.queries'
import { MainButton } from '../../components/MainButton'

export const Route = createLazyFileRoute('/user/')({
  component: UserList,
})

function UserList() {
  const navigate = useNavigate();

  const { data: appointments } = useQuery(UserAppointmentsQueryOptions);

  const rows = appointments?.map((appointment) => (
    <Table.Tr key={appointment.id}>
      <Table.Td>{appointment.date}</Table.Td>
      <Table.Td>{appointment.time}</Table.Td>
    </Table.Tr>
  ));

  return (
    <>
      <MainButton
        text='Book'
        isActive={true}
        callback={() => {navigate({ to: '/user/booking' })}}
      />
      <Table>
        <Table.Thead>
          <Table.Tr>
            <Table.Th>Date</Table.Th>
            <Table.Th>Time</Table.Th>
          </Table.Tr>
        </Table.Thead>
        <Table.Tbody>{rows}</Table.Tbody>
      </Table>
    </>
  );
}
