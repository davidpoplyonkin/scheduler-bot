import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Divider, Timeline, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { AxiosError } from 'axios';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { AdminAppointmentsQueryOptions, VerifyProofMutationOptions } from './index.queries';
import { BottomButton } from '../../components/BottomButton';
import { EmptyState } from '../../components/EmptyState';
import SearchingIcon from '../../assets/Searching.svg?react';
import { getServiceLabel } from '../../utils/serviceLabel';

const tg = window.Telegram.WebApp;

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const Route = createLazyFileRoute('/admin/')({
  component: AdminList,
})

function AdminList() {
  const { t } = useTranslation(['admin', 'shared']);
  const navigate = useNavigate();

  const { data } = useQuery(AdminAppointmentsQueryOptions);

  const verifyMutation = useMutation({
    ...VerifyProofMutationOptions,
    onSuccess: (result) => {
      const day = dayjs.utc(result.appointmentDate).format('dd, MMM D');
      const time = dayjs.utc(result.appointmentTime, 'HH:mm:ss')
        .format('HH:mm');
      const serviceName = getServiceLabel(t, result.service);

      notifications.show({
        title: `${serviceName} · ${result.userName}`,
        message: `${day} ${t('datetime.at', { ns: 'shared' })} ${time}`,
        color: 'green',
      });
    },
    throwOnError: (error: AxiosError) => {
      // throw an error for non-422 status codes
      if (error.response?.status !== 422) {
        return true; 
      }

      return false;
    },
    onError: (error) => {
      if (error instanceof AxiosError && error.response?.status === 409) {
        notifications.show({
          title: t('notifications.verificationFailedTitle', { ns: 'admin' }),
          message: t('notifications.verificationFailed', { ns: 'admin' }),
          color: 'red',
        });
      }
    },
    onMutate: () => tg.SecondaryButton.showProgress(),
    onSettled: () => tg.SecondaryButton.hideProgress(),
  });

  const handleScanQr = () => {
    tg.showScanQrPopup(
      { text: t('qrScanner.scanPrompt', { ns: 'admin' }) },
      (qrData: string) => {
        tg.closeScanQrPopup();
        try {
          const proof = JSON.parse(qrData);
          verifyMutation.mutate(proof);
        } catch {
          notifications.show({
            title: t('notifications.invalidQrTitle', { ns: 'admin' }),
            message: t('notifications.invalidQrMessage', { ns: 'admin' }),
            color: 'red',
          });
        }
      }
    );
  };

  return (
    <>
      <BottomButton
        type='secondary'
        text={t('buttons.blackout', { ns: 'admin' })}
        isActive={true}
        callback={() => {navigate({ to: '/admin/blackout' })}}
      />
      <BottomButton
        text={t('buttons.scanQr', { ns: 'admin' })}
        isActive={!verifyMutation.isPending}
        callback={handleScanQr}
      />
      {data?.days.length === 0 ? (
        <EmptyState text={t('screens.noAppointments', { ns: 'shared' })}>
          <SearchingIcon height={128} fill='var(--mantine-color-dimmed)' />
        </EmptyState>
      ) : (
        data?.days.map((day) => (
          <div key={day.date}>
            <Divider
              label={dayjs.utc(day.date).format('dd, MMM D')}
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
                    {getServiceLabel(t, appt.service)} · {appt.userFullName ?? t('user.fallbackName', { ns: 'admin', userId: appt.userId })}
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
        ))
      )}
    </>
  )
}
