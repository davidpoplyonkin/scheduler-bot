import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Chip, Flex, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DatePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { BlocksQueryOptions } from '../index.queries';
import { CreateAppointmentMutationOptions } from './booking.queries';
import { BottomButton } from '../../components/BottomButton';
import { ChipTransition } from '../../components/ChipTransition';
import { timeSlotAvailable } from '../../utils/timeSlots';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const Route = createLazyFileRoute('/user/booking')({
  component: BookingForm,
})

const tg = window.Telegram.WebApp;

function BookingForm() {
  const { t } = useTranslation(['user', 'shared']);

  useEffect(() => {
    tg.SecondaryButton.hide();
  }, []);

  const queryClient = useQueryClient()

  const { constraints } = Route.useLoaderData();

  // State to derive the current and adjacent months - not the selected date
  const [date, setDate] = useState(new Date().toISOString());

  const curMonth = dayjs(date).format('YYYY-MM')
  const prevMonth = dayjs(date).add(-1, 'month').format('YYYY-MM')
  const nextMonth = dayjs(date).add(1, 'month').format('YYYY-MM')

  // Fetch the data for the current and adjacent months
  const {
    data: blocksResponse,
    isLoading: blocksLoading
  } = useQuery(BlocksQueryOptions(curMonth));

  queryClient.prefetchQuery(BlocksQueryOptions(prevMonth));
  queryClient.prefetchQuery(BlocksQueryOptions(nextMonth));

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      date: null as string | null,
      slot: null as number | null,
    },
    validate: {
      date: (value) => (value ? null : t('validation.dateRequired', { ns: 'user' })),
      slot: (value) => (value ? null : t('validation.timeSlotRequired', { ns: 'user' })),
    },
  });

  // Redirect the user upon submission
  const navigate = useNavigate();
  const mutation = useMutation({
    ...CreateAppointmentMutationOptions,
    onSuccess: () => {
      // Ensure that the home page shows the new appointment
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
      navigate({ to: '/user' });

      // Show a success message
      notifications.show({
        title: t('notifications.success', { ns: 'shared' }),
        message: t('notifications.appointmentBooked', { ns: 'user' }),
        color: 'green',
      });
    },
    throwOnError: (error: AxiosError) => {
      // throw an error for non-409 status codes
      if (error.response?.status !== 409) {
        return true; 
      }

      return false;
    },
    onError: (error) => {
      // If the chosen slot was booked while the user was filling the form
      if (error instanceof AxiosError && error.response?.status === 409) {
        // Show an error message
        notifications.show({
          title: t('notifications.slotUnavailableTitle', { ns: 'user' }),
          message: t('notifications.slotUnavailable', { ns: 'user' }),
          color: 'red',
        });

        form.setFieldValue('date', null);
        form.setFieldValue('slot', null);
      }
    },
    onMutate: () => { tg.MainButton.showProgress() },
    onSettled: () => {
      // No matter who books the slot: the user (success) or someone else
      // (error 409), the unavailable slots list is no longer up to date
      queryClient.invalidateQueries({ queryKey: ['blocks'] });

      tg.MainButton.hideProgress();
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate({ date: values.date!, slot: values.slot! });
  });

  // Trigger submission on Telegram BottomButton click
  const triggerSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  }

  const formRef = useRef<HTMLFormElement>(null);
  const formValid = form.isValid();

  // Time in server's timezone - not UTC
  const serverTime = dayjs.utc(blocksResponse?.serverTime.slice(0, 19));

  // Compute min/max datetime from server time
  const minDateTime = serverTime.add(constraints.minAdvanceMinutes, 'minute');
  const maxDateTime = serverTime.add(constraints.maxAdvanceDays, 'day');

  const isSlotAvailable = (date: string, slot: typeof constraints.timeSlots[number]) =>
    timeSlotAvailable({
      date,
      slot,
      constraints,
      blocks: blocksResponse?.blocks ?? [],
      minDateTime,
      maxDateTime,
    });

  const DateUnavailable = (date: string) => {
    if (blocksLoading) {
      return true; // exclude by default
    }

    // Check if any of the time slots is available
    return !constraints.timeSlots.some((s) => isSlotAvailable(date, s));
  };

  const chips = constraints.timeSlots.map((s) => {
    const date = form.getValues().date;

    const disabled = date ? !isSlotAvailable(date, s) : true;

    return (
      <Chip
        value={s.id.toString()}
        disabled={disabled}
        styles={{ input: {display: 'block'}}} // necessary for a smooth transition
      >
        <Text style={{ fontVariantNumeric: 'tabular-nums' }}>
          { dayjs.utc(s.startTime, 'HH:mm:ss').format('HH:mm') }
        </Text>
      </Chip>
    );
});

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <BottomButton
        text={t('buttons.submit', { ns: 'shared' })}
        isActive={formValid}
        callback={triggerSubmit}
      />
      <Flex
        direction={{ base: 'column', xs: 'row' }}
        align='center'
        justify='center'
        gap={0}
      >
        <DatePicker
          {...form.getInputProps('date')}
          size='md'
          minDate={minDateTime.toDate()}
          maxDate={maxDateTime.toDate()}
          hideOutsideDates // Hide days from prev/next month
          maxLevel='month' // Disable month/year selection
          excludeDate={DateUnavailable}
          onChange={(value) => {
            // Update selected date
            form.setFieldValue('date', value);
            form.setFieldValue('slot', null);
          }}
          onDateChange={(date) => {
            setDate(date);

            // Reset the form values because a time slot availability is only
            // verifiable for the current month
            form.setFieldValue('date', null);
            form.setFieldValue('slot', null);
          }}
        />

        <ChipTransition
          mounted={form.values.date !== null}
          chipGroupProps={form.getInputProps('slot')}
          chips={chips}
        />
      </Flex>
    </form>
  );
}
