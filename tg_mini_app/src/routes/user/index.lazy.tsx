import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { useEffect } from 'react'
import { Table } from '@mantine/core'

import { UserAppointmentsQueryOptions } from './index.queries'
import { useQuery } from '@tanstack/react-query'

export const Route = createLazyFileRoute('/user/')({
  component: UserList,
})

const tg = window.Telegram.WebApp;

function UserList() {
  const navigate = useNavigate();
  
  useEffect(() => {

    // Render Telegram MainButton
    tg.MainButton.setText("Book");
    tg.MainButton.show();

    // Open the booking form
    const handleMainButtonClick = () => {
      navigate({ to: '/user/booking' });
    };

    tg.MainButton.onClick(handleMainButtonClick);

    return () => {
      tg.MainButton.offClick(handleMainButtonClick);
    };
  }, []);

  const { data: appointments } = useQuery(UserAppointmentsQueryOptions);

  const rows = appointments?.map((appointment) => (
    <Table.Tr key={appointment.id}>
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
