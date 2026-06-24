import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Timeline, Text, ActionIcon, Group, Modal, Box, Badge } from '@mantine/core'
import { useDisclosure } from '@mantine/hooks'
import { useQuery, useMutation } from '@tanstack/react-query'
import { IconQrcode } from '@tabler/icons-react'
import { QRCode } from 'react-qr-code'
import { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import dayjs from 'dayjs'
import utc from 'dayjs/plugin/utc'
import customParseFormat from 'dayjs/plugin/customParseFormat'

import { UserAppointmentsQueryOptions, GenerateProofMutationOptions } from './index.queries'
import { BottomButton } from '../../components/BottomButton'
import { EmptyState } from '../../components/EmptyState'
import { type ProofGenerateResponse } from '../../types/ProofGenerateResponse'
import { type AppointmentStatus } from '../../types/AppointmentUserGetResponse'
import { useUserAppointmentSSE } from '../../hooks/useUserAppointmentSSE'
import SearchingIcon from '../../assets/Searching.svg?react'

dayjs.extend(customParseFormat)
dayjs.extend(utc)

export const Route = createLazyFileRoute('/user/')({
  component: UserList,
});

const tg = window.Telegram.WebApp;

function UserList() {
  const { t } = useTranslation(['user', 'shared']);

  useUserAppointmentSSE();

  useEffect(() => {
    tg.SecondaryButton.hide();
  }, []);

  const navigate = useNavigate();

  const { data: appointments } = useQuery(UserAppointmentsQueryOptions);

  // Filter out cancelled appointments for display
  const visibleAppointments = appointments?.filter(
    (appt) => appt.status !== 'CANCELLED'
  );

  const [opened, { open, close }] = useDisclosure(false);
  const [proofData, setProofData] = useState<ProofGenerateResponse | null>(null);

  const [modalTitle, setModalTitle] = useState('');
  const [loadingId, setLoadingId] = useState<number | null>(null);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState<number | null>(null);
  const selectedAppointmentStatusRef = useRef<AppointmentStatus | null>(null);

  useEffect(() => {
    if (selectedAppointmentStatusRef.current === 'COMPLETED') {
      close();
      selectedAppointmentStatusRef.current = null;
    }
  }, [appointments, close]);

  const mutation = useMutation({
    ...GenerateProofMutationOptions,
    onSuccess: (data) => {
      setProofData(data);
      open();
    },
    onMutate: (data) => {
      setLoadingId(data)
    },
    onSettled: (_data) => {
      setLoadingId(null);
    },
    throwOnError: true,
  });

  return (
    <>
      <BottomButton
        text={t('buttons.book', { ns: 'user' })}
        isActive={true}
        callback={() => {navigate({ to: '/user/booking' })}}
      />
      {visibleAppointments?.length === 0 ? (
        <EmptyState text={t('screens.noAppointments', { ns: 'shared' })}>
          <SearchingIcon height={128} fill='var(--mantine-color-dimmed)' />
        </EmptyState>
      ) : (
        <Timeline bulletSize={16} lineWidth={2} active={-1} mb='md'>
          {visibleAppointments?.map((appt) => {
            if (appt.id === selectedAppointmentId) {
              selectedAppointmentStatusRef.current = appt.status;
            }

            const day = dayjs.utc(appt.date).format('dd, MMM D');
            const time = dayjs.utc(appt.time, 'HH:mm:ss').format('HH:mm');
            const dayTime = [
              day,
              t('datetime.at', { ns: 'shared' }),
              time
            ].join(' ');
            const service = appt.service.name

            return <Timeline.Item key={appt.id}>
              <Group justify='space-between' wrap='nowrap'>
                <div>
                  <Group gap='xs'>
                    <Text>{service}</Text>
                    <Badge size='sm' variant='outline'>
                      {t(`statuses.${appt.status}`, { ns: 'shared' })}
                    </Badge>
                  </Group>
                  <Text
                    size='sm'
                    c='dimmed'
                    style={{ fontVariantNumeric: 'tabular-nums' }}
                  >
                    {dayTime}
                  </Text>
                </div>
                <ActionIcon
                  variant='filled'
                  disabled={appt.status !== "CONFIRMED"}
                  size='lg'
                  onClick={() => {
                    mutation.mutate(appt.id);
                    setModalTitle(`${service} · ${dayTime}`);
                    setSelectedAppointmentId(appt.id);
                  }}
                  loading={loadingId === appt.id}
                >
                  <IconQrcode
                    stroke={2}
                    style={{ width: '90%', height: '90%' }}
                  />
                </ActionIcon>
              </Group>
            </Timeline.Item>
          })}
        </Timeline>
      )}
      <Modal
        opened={opened}
        onClose={() => {
          close();
          setSelectedAppointmentId(null);
          selectedAppointmentStatusRef.current = null;
        }}
        title={modalTitle}
        size='xs'
        centered
      >
        <Box
          data-autofocus // to prevent the close button from being auto-focused
          tabIndex={-1}
          style={{ outline: 'none' }}
        >
          <QRCode
            value={JSON.stringify(proofData)}
            size={256}
            fgColor='var(--mantine-color-text)'
            bgColor='transparent'
            style={{ height: 'auto', width: '100%' }}
          />
        </Box>
      </Modal>
    </>
  );
}
