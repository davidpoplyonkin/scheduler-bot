import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { Divider, Timeline, Text } from '@mantine/core';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { AdminAppointmentsQueryOptions } from './index.queries';
import { MainButton } from '../../components/MainButton';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const Route = createLazyFileRoute('/admin/')({
  component: AdminList,
})

function AdminList() {
  const navigate = useNavigate();

  const { data } = useQuery(AdminAppointmentsQueryOptions)

  return (
    <>
      <MainButton
        text='Blackout'
        isActive={true}
        callback={() => {navigate({ to: '/admin/blackout' })}}
      />
      {data?.days.map((day) => (
        <div key={day.date}>
          <Divider
            label={dayjs.utc(day.date).format('ddd, MMM D')}
            labelPosition='left'
            size={2}
            mb='md'
            style={{
              position: 'sticky',
              top: 0,
              backgroundColor: 'var(--mantine-color-body)',
              zIndex: 1,
            }}
            styles={{label: {fontSize: 'var(--mantine-font-size-sm)'}}}
          />
          <Timeline bulletSize={16} lineWidth={2} active={-1} mb='md'>
            {day.appointments.map((appt) => (
              <Timeline.Item key={appt.id}>
                <Text truncate='end'>
                  {appt.userFullName ?? `User ${appt.userId}`}
                </Text>
                <Text
                  size='sm'
                  c='dimmed'
                  style={{ fontVariantNumeric: 'tabular-nums' }}
                >
                  {dayjs.utc(appt.time, 'HH:mm:ss').format('HH:mm')}
                </Text>
              </Timeline.Item>
            ))}
          </Timeline>
        </div>
      ))}
    </>
  )
}
