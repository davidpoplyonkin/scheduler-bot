import { createLazyFileRoute, useNavigate } from '@tanstack/react-router';
import { useQuery, useMutation } from '@tanstack/react-query';
import { Badge, Divider, Group, Timeline, Text } from '@mantine/core';
import { notifications } from '@mantine/notifications';
import { useTranslation } from 'react-i18next';
import { useMemo } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';

import { AdminAppointmentsQueryOptions, VerifyProofMutationOptions } from './index.queries';
import { BottomButton } from '../../components/BottomButton';
import { EmptyState } from '../../components/EmptyState';
import { useAppointmentSSE } from '../../hooks/useAppointmentSSE';
import type { AppointmentAdminIn } from '../../types/AppointmentAdminGetResponse';
import SearchingIcon from '../../assets/Searching.svg?react';

const tg = window.Telegram.WebApp;

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const Route = createLazyFileRoute('/admin/')({
  component: AdminList,
})

function AdminList() {
  const { t } = useTranslation(['admin', 'shared']);
  const navigate = useNavigate();

  useAppointmentSSE('admin-appointments');

  const { data: appointments } = useQuery(AdminAppointmentsQueryOptions);

  // Filter cancelled and aggregate by date
  const appointmentsByDate = useMemo(() => {
    if (!appointments) return undefined;

    const byDate = new Map<string, AppointmentAdminIn[]>();
    for (const appt of appointments) {
      if (appt.status === 'CANCELLED') continue;
      const existing = byDate.get(appt.date);
      if (existing) {
        existing.push(appt);
      } else {
        byDate.set(appt.date, [appt]);
      }
    }
    return byDate;
  }, [appointments]);

  const verifyMutation = useMutation({
    ...VerifyProofMutationOptions,
    onSuccess: (result) => {
      const day = dayjs.utc(result.appointmentDate).format('dd, MMM D');
      const time = dayjs.utc(result.appointmentTime, 'HH:mm:ss')
        .format('HH:mm');
      const serviceName = result.service.name;

      notifications.show({
        title: `${serviceName} · ${result.userName}`,
        message: `${day} ${t('datetime.at', { ns: 'shared' })} ${time}`,
        color: 'green',
      });
    },
    // throwOnError and onError removed - handled by axios interceptor
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
      {appointmentsByDate?.size === 0 ? (
        <EmptyState text={t('screens.noAppointments', { ns: 'shared' })}>
          <SearchingIcon height={128} fill='var(--mantine-color-dimmed)' />
        </EmptyState>
      ) : (
        appointmentsByDate && [...appointmentsByDate.entries()].map(([date, appts]) => (
          <div key={date}>
            <Divider
              label={dayjs.utc(date).format('dd, MMM D')}
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
              {appts.map((appt) => (
                <Timeline.Item key={appt.id}>
                  <Group gap='xs'>
                    <Text truncate='end'>
                      {appt.service.name}
                    </Text>
                    <Badge size='sm' variant='outline'>
                      {t(`statuses.${appt.status}`, { ns: 'shared' })}
                    </Badge>
                  </Group>
                  <Text
                    size='sm'
                    c='dimmed'
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {dayjs.utc(appt.time, 'HH:mm:ss').format('HH:mm')} · {appt.userFullName ?? t('user.fallbackName', { ns: 'admin', userId: appt.userId })}
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
