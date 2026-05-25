import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Timeline, Text, ActionIcon, Group } from '@mantine/core'
import { useQuery } from '@tanstack/react-query'
import { IconQrcode } from '@tabler/icons-react'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import { UserAppointmentsQueryOptions } from './index.queries'
import { MainButton } from '../../components/MainButton'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

export const Route = createLazyFileRoute('/user/')({
  component: UserList,
});

function UserList() {
  const navigate = useNavigate();

  const { data: appointments } = useQuery(UserAppointmentsQueryOptions);

  return (
    <>
      <MainButton
        text='Book'
        isActive={true}
        callback={() => {navigate({ to: '/user/booking' })}}
      />
      <Timeline bulletSize={16} lineWidth={2} active={-1} mb='md'>
        {appointments?.map((appt) => (
          <Timeline.Item key={appt.id}>
            <Group justify="space-between" wrap="nowrap">
              <div>
                <Text>{dayjs.utc(appt.date).format('ddd, MMM D')}</Text>
                <Text
                  size='sm'
                  c='dimmed'
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {dayjs.utc(appt.time, 'HH:mm:ss').format('HH:mm')}
                </Text>
              </div>
              <ActionIcon variant='filled' size='lg'>
                <IconQrcode
                  stroke={2}
                  style={{ width: '90%', height: '90%' }}
                />
              </ActionIcon>
            </Group>
          </Timeline.Item>
        ))}
      </Timeline>
    </>
  );
}
