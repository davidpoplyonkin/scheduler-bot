import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Divider, Timeline, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { AdminAppointmentsQueryOptions, VerifyProofMutationOptions } from './index.queries';
import { BottomButton } from '../../components/BottomButton';

const tg = window.Telegram.WebApp;

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const Route = createLazyFileRoute('/admin/')({
  component: AdminList,
})

function AdminList() {
  const navigate = useNavigate();

  const { data } = useQuery(AdminAppointmentsQueryOptions);

  const verifyMutation = useMutation({
    ...VerifyProofMutationOptions,
    onSuccess: (result) => {
      const day = dayjs.utc(result.appointmentDate).format('ddd, MMM D');
      const time = dayjs.utc(result.appointmentTime, 'HH:mm:ss')
        .format('HH:mm');

      notifications.show({
        title: result.userName,
        message: `${day} at ${time}`,
        color: 'green',
      });
    },
    onError: (error: AxiosError<{ detail: string }>) => {
      notifications.show({
        title: 'Verification failed',
        message: error.response?.data?.detail ?? 'Unknown reason',
        color: 'red',
      });
    },
    onMutate: () => tg.SecondaryButton.showProgress(),
    onSettled: () => tg.SecondaryButton.hideProgress(),
  });

  const handleScanQr = () => {
    tg.showScanQrPopup({ text: 'Scan appointment QR' }, (qrData: string) => {
      tg.closeScanQrPopup();
      try {
        const proof = JSON.parse(qrData);
        verifyMutation.mutate(proof);
      } catch {
        notifications.show({
          title: 'Invalid QR',
          message: 'Could not parse QR code',
          color: 'red',
        });
      }
    });
  };

  return (
    <>
      <BottomButton
        type='secondary'
        text='Blackout'
        isActive={true}
        callback={() => {navigate({ to: '/admin/blackout' })}}
      />
      <BottomButton
        text='Scan QR'
        isActive={!verifyMutation.isPending}
        callback={handleScanQr}
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
