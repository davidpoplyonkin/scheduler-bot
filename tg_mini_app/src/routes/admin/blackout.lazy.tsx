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

import { BlocksQueryOptions } from '../index.queries';
import { CreateBlackoutMutationOptions } from './blackout.queries';
import { BottomButton } from '../../components/BottomButton';
import { ChipTransition } from '../../components/ChipTransition';
import { timeSlotAvailable } from '../../utils/timeSlots';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const Route = createLazyFileRoute('/admin/blackout')({
  component: BlackoutForm,
})

const tg = window.Telegram.WebApp;

function BlackoutForm() {
  const { t } = useTranslation(['admin', 'shared']);

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
  } = useQuery(BlocksQueryOptions(curMonth));

  queryClient.prefetchQuery(BlocksQueryOptions(prevMonth));
  queryClient.prefetchQuery(BlocksQueryOptions(nextMonth));

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      dateRange: [null, null] as [string | null, string | null],
      slots: [] as number[],
    },
    validate: {
      dateRange: (value) => {
        if (!value[0] || !value[1]) return t('validation.dateRangeRequired', { ns: 'admin' });
        return null;
      },
    },
  });

  const formRef = useRef<HTMLFormElement>(null);

  const mutation = useMutation({
    ...CreateBlackoutMutationOptions,
    onSuccess: () => {
      navigate({ to: '/admin' });

      notifications.show({
        title: t('notifications.success', { ns: 'shared' }),
        message: t('notifications.blackoutCreated', { ns: 'admin' }),
        color: 'green',
      });
    },
    onMutate: () => { tg.MainButton.showProgress() },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['blocks'] });
      tg.MainButton.hideProgress();
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate({
      startDate: values.dateRange[0]!,
      endDate: values.dateRange[1]!,
      slots: values.slots,
    });
  });

  // Trigger submission on Telegram BottomButton click
  const triggerSubmit = () => {
    if (formRef.current) {
      formRef.current.requestSubmit();
    }
  }

  const formValid = form.isValid();

  // Time in server's timezone - not UTC
  const serverTime = dayjs.utc(blocksResponse?.serverTime.slice(0, 19));

  // Compute min/max datetime from server time
  const minDateTime = serverTime.add(constraints.minAdvanceMinutes, 'minute');
  const maxDateTime = serverTime.add(constraints.maxAdvanceDays, 'day');

  // Check if a single day is selected
  const [startDate, endDate] = form.values.dateRange;
  const isOneDayRange = startDate === endDate && startDate !== null;

  const isSlotAvailable = (date: string, slot: typeof constraints.timeSlots[number]) =>
    timeSlotAvailable({
      date,
      slot,
      constraints,
      blocks: blocksResponse?.blocks ?? [],
      minDateTime,
      maxDateTime,
    });

  const chips = constraints.timeSlots.map((s) => {
    const disabled = isOneDayRange ? !isSlotAvailable(startDate, s) : true;

    return (
      <Chip
        key={s.id}
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
          type='range'
          allowSingleDateInRange
          value={form.values.dateRange}
          size='md'
          minDate={minDateTime.toDate()}
          maxDate={maxDateTime.toDate()}
          hideOutsideDates // Hide days from prev/next month
          maxLevel='month' // Disable month/year selection
          onChange={(value) => {
            form.setFieldValue('dateRange', value);
            form.setFieldValue('slots', []);
          }}
          onDateChange={(date) => {
            setDate(date);

            // Reset the form values because a time slot availability is only
            // verifiable for the current month
            if (isOneDayRange) {
              form.setFieldValue('dateRange', [startDate, null]);
            }
            form.setFieldValue('slots', []);
          }}
        />

        <ChipTransition
          mounted={isOneDayRange}
          chipGroupProps={{
            ...form.getInputProps('slots'),
            multiple: true,
          }}
          chips={chips}
        />
      </Flex>
    </form>
  );
}
