import { createLazyFileRoute, useNavigate } from '@tanstack/react-router'
import { Chip, Flex, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DatePicker } from '@mantine/dates';
import { notifications } from '@mantine/notifications';
import { useState, useRef } from 'react';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AxiosError } from 'axios';

import { UserBlocksQueryOptions, CreateAppointmentMutationOptions } from './booking.queries';
import { MainButton } from '../../components/MainButton';
import { ChipTransition } from '../../components/ChipTransition';

dayjs.extend(customParseFormat);
dayjs.extend(utc);

export const Route = createLazyFileRoute('/user/booking')({
  component: BookingForm,
})

const tg = window.Telegram.WebApp;

function BookingForm() {
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
  } = useQuery(UserBlocksQueryOptions(curMonth));

  queryClient.prefetchQuery(UserBlocksQueryOptions(prevMonth));
  queryClient.prefetchQuery(UserBlocksQueryOptions(nextMonth));

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      date: null as string | null,
      slot: null as number | null,
    },
    validate: {
      date: (value) => (value ? null : 'Date is required'),
      slot: (value) => (value ? null : 'Time slot is required'),
    },
  });

  // Redirect the user upon submission
  const navigate = useNavigate();
  const mutation = useMutation({
    ...CreateAppointmentMutationOptions,
    onSuccess: () => {
      // Ensure that the home page shows the new appointment
      queryClient.invalidateQueries({ queryKey: ['user-appointments'] });
      queryClient.invalidateQueries({ queryKey: ['user-blocks'] });
      navigate({ to: '/user' });

      // Show a success message
      notifications.show({
        title: 'Success',
        message: 'The appointment was booked successfully',
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
          title: 'Slot unavailable',
          message: 'The chosen time slot is no longer available',
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
      queryClient.invalidateQueries({ queryKey: ['user-blocks'] });

      tg.MainButton.hideProgress();
    },
  });

  const handleSubmit = form.onSubmit((values) => {
    mutation.mutate({ date: values.date!, slot: values.slot! });
  });

  // Trigger submission on Telegram MainButton click
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

  const timeSlotAvailable = (
    date: string,
    slot: typeof constraints.timeSlots[number]
  ) => {
    // Combine date with slot start time
    const slotDateTime = dayjs.utc(`${date}T${slot.startTime}`);

    // Check if slot is within allowed time range
    if (slotDateTime.isBefore(minDateTime) || slotDateTime.isAfter(maxDateTime)) {
      return false;
    }

    // Find the block corresponding to the chosen date
    const block = blocksResponse?.blocks.find((b) => b.date === date);

    // Check if the current slot is blocked
    if (block?.unavailableSlots.find((s) => s.timeSlotId === slot.id)) {
      return false;
    }

    return true;
  }

  const DateUnavailable = (date: string) => {
    if (blocksLoading) {
      return true; // exclude by default
    }

    // Check forbidden weekday (Python: 0=Mon..6=Sun, JS dayjs: 0=Sun..6=Sat)
    const jsWeekday = dayjs(date).day();
    const pythonWeekday = (jsWeekday + 6) % 7;
    if (constraints.forbiddenWeekdays.includes(pythonWeekday)) {
      return true;
    }

    // Check if any of the time slots is available
    return !constraints.timeSlots.some((s) => {
      return timeSlotAvailable(date, s);
    });
  };

  const chips = constraints.timeSlots.map((s) => {
    const date = form.getValues().date;

    const disabled = date ? !timeSlotAvailable(date, s) : true;

    return (
      <Chip
        value={s.id.toString()}
        disabled={disabled}
        styles={{ input: {display: 'block'}}} // necessary for a smooth transition
      >
        <Text style={{ fontVariantNumeric: 'tabular-nums' }}>
          { dayjs(s.startTime, 'HH:mm:ss').format('HH:mm') }
        </Text>
      </Chip>
    );
});

  return (
    <form ref={formRef} onSubmit={handleSubmit}>
      <MainButton formValid={formValid} triggerSubmit={triggerSubmit} />
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
