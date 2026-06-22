import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Chip, Flex, Text, useMatches } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DatePicker } from '@mantine/dates';
import { useState, useRef, useEffect } from 'react';
import { useElementSize } from '@mantine/hooks';
import { useTranslation } from 'react-i18next';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notifications } from '@mantine/notifications';

import { BlocksQueryOptions } from '../index.queries';
import { CreateAppointmentMutationOptions } from './booking.queries';
import { BottomButton } from '../../components/BottomButton';
import { ChipCarousel } from '../../components/ChipCarousel';
import { timeSlotAvailable } from '../../utils/timeSlots';
import { StructuredApiError } from '../../types/error';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const Route = createLazyFileRoute('/user/booking')({
  component: BookingForm,
})

const tg = window.Telegram.WebApp;

const getCurrencyInfo = (code: number): { symbol: string; exponent: number } => {
  const map: Record<number, { symbol: string; exponent: number }> = {
    980: { symbol: 'UAH', exponent: 2 },
    840: { symbol: 'USD', exponent: 2 },
  };
  return map[code] ?? { symbol: '', exponent: 2 };
};

function BookingForm() {
  const { t } = useTranslation(['user', 'shared']);

  useEffect(() => {
    tg.SecondaryButton.hide();
  }, []);

  const queryClient = useQueryClient()
  const navigate = useNavigate();

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
      service: null as number | null,
      date: null as string | null,
      slot: null as number | null,
    },
    validate: {
      service: (value) => (value ? null : t('validation.serviceRequired', { ns: 'user' })),
      date: (value) => (value ? null : t('validation.dateRequired', { ns: 'user' })),
      slot: (value) => (value ? null : t('validation.timeSlotRequired', { ns: 'user' })),
    },
  });

  const mutation = useMutation({
    ...CreateAppointmentMutationOptions,
    onSuccess: (data) => {
      // Invalidate queries so returning user sees fresh data
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });

      if (data.paymentUrl) {
        // Open payment page in external browser and close mini app
        tg.openLink(data.paymentUrl);
        tg.close();
      } else {
        // Free service - show success notification and redirect to appointments list
        notifications.show({
          title: t('notifications.success', { ns: 'shared' }),
          message: t('notifications.appointmentBooked', { ns: 'user' }),
          color: 'green',
        });
        navigate({ to: '/user' });
      }
    },
    onError: (error) => {
      // If the chosen slot was booked while the user was filling the form,
      // reset the form so they can pick another slot.
      // Notification is shown by the axios interceptor.
      if (error instanceof StructuredApiError && error.nonCritical) {
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
    mutation.mutate({ date: values.date!, slot: values.slot!, service: values.service! });
  });

  // Trigger submission on Telegram BottomButton click
  const triggerSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  }

  const formRef = useRef<HTMLFormElement>(null);
  const formValid = form.isValid();

  // Compute button text based on selected service
  const selectedServiceId = form.getValues().service;
  const selectedService = selectedServiceId
    ? constraints.services.find(s => s.id === Number(selectedServiceId))
    : null;

  const buttonText = (() => {
    if (!selectedService) return t('buttons.submit', { ns: 'shared' });
    if (selectedService.amountMinor === 0) return t('buttons.book', { ns: 'user' });

    const { symbol, exponent } = getCurrencyInfo(selectedService.currencyCode);
    const amount = (selectedService.amountMinor / Math.pow(10, exponent)).toFixed(0);
    return `${t('buttons.pay', { ns: 'user' })} ${amount} ${symbol}`;
  })();

  const { ref: datePickerRef, width, height } = useElementSize();
  const orientation = useMatches({ base: 'horizontal' as const, xs: 'vertical' as const });

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

  const serviceChips = constraints.services.map((s) =>  (
    <Chip value={s.id.toString()}>
      { s.name }
    </Chip>
  ));

  const timeSlotChips = constraints.timeSlots.map((s) => {
    const date = form.getValues().date;

    const disabled = date ? !isSlotAvailable(date, s) : true;

    return (
      <Chip value={s.id.toString()} disabled={disabled}>
        <Text style={{ fontVariantNumeric: 'tabular-nums' }}>
          { dayjs.utc(s.startTime, 'HH:mm:ss').format('HH:mm') }
        </Text>
      </Chip>
    );
  });

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <BottomButton
        text={buttonText}
        isActive={formValid}
        callback={triggerSubmit}
      />
      <Flex
        direction={orientation === 'horizontal' ? 'column' : 'row' }
        align='center'
        justify='center'
        gap='md'
      >
        {/* Service */}
        <Chip.Group {...form.getInputProps('service')}>
          <ChipCarousel
            width={width}
            height={height}
            orientation={orientation}
            align='end'
          >
            {serviceChips}
          </ChipCarousel>
        </Chip.Group>

        {/* Date */}
        <DatePicker
          ref={datePickerRef}
          {...form.getInputProps('date')}
          size='md'
          minDate={minDateTime.toDate()}
          maxDate={maxDateTime.toDate()}
          hideOutsideDates // Hide days from prev/next month
          maxLevel='month' // Disable month/year selection
          excludeDate={(date: string) => {
            // exclude by default
            if (blocksLoading) { return true; }

            // Check if any of the time slots is available
            return !constraints.timeSlots.some((s) => isSlotAvailable(date, s));
          }}
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

        {/* Time Slot */}
        <Chip.Group {...form.getInputProps('slot')}>
          <ChipCarousel
            width={width}
            height={height}
            orientation={orientation}
            align='start'
          >
            {timeSlotChips}
          </ChipCarousel>
        </Chip.Group>
      </Flex>
    </form>
  );
}
