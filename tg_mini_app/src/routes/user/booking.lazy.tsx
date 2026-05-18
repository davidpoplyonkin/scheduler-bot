import { createLazyFileRoute, useRouteContext } from '@tanstack/react-router'
import { Chip, Flex, Text, Transition, useMatches } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DatePicker } from '@mantine/dates';
import { useEffect, useState } from 'react';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { useQuery } from '@tanstack/react-query';

import { UserBlocksQueryOptions } from './booking.queries';

dayjs.extend(customParseFormat);

export const Route = createLazyFileRoute('/user/booking')({
  component: BookingForm,
})

const tg = window.Telegram.WebApp;

function BookingForm() {
  const { queryClient } = useRouteContext({ from: '__root__' })

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
  } = useQuery(UserBlocksQueryOptions(curMonth), queryClient);

  queryClient.prefetchQuery(UserBlocksQueryOptions(prevMonth));
  queryClient.prefetchQuery(UserBlocksQueryOptions(nextMonth));

  useEffect(() => {
  
      // Render Telegram MainButton
      tg.MainButton.setText('Submit');
      tg.MainButton.show();
  
      // Open the booking form
      const handleMainButtonClick = () => {
        console.log('Booking submitted!');
      };
  
      tg.MainButton.onClick(handleMainButtonClick);
  
      return () => {
        tg.MainButton.hide();
        tg.MainButton.offClick(handleMainButtonClick);
      };
    }, []);

  const form = useForm({
    mode: 'controlled',
    initialValues: {
      date: null as string | null,
      slot: null as number | null,
    },
  });

  const excludeDateFn = (date: string) => {
    if (blocksLoading) {
      return true; // exclude by default
    }

    const block = blocksResponse?.blocks.find((b) => b.date === date);
    if (block?.unavailableSlots.length === constraints.timeSlots.length) {
      return true; // exclude if there are no available slots
    }

    return false
  };

  const chipTransition = useMatches({
    base: { // slide bottom
      in: {
        opacity: 1,
        transform: 'translateY(0)', 
        gridTemplateRows: '1fr',
        marginTop: 'var(--mantine-spacing-sm)'
      },
      out: {
        opacity: 0,
        transform: 'translateY(-50px)',
        gridTemplateRows: '0fr',
        marginTop: 0
      },
      common: { display: 'grid' },
      transitionProperty: 'opacity, transform, grid-template-rows, margin-top',
    },
    xs: { // slide right
      in: {
        opacity: 1,
        transform: 'translateX(0)', 
        gridTemplateColumns: '1fr',
        marginLeft: 'var(--mantine-spacing-sm)'
      },
      out: {
        opacity: 0,
        transform: 'translateX(-100px)',
        gridTemplateColumns: '0fr',
        marginLeft: 0
      },
      common: { display: 'grid' },
      transitionProperty: 'opacity, transform, grid-template-columns, margin-left',
    }
  });

  const chips = constraints.timeSlots.map((slot) => {
    const date = form.getValues().date;

    // find the block corresponding to the chosen date
    const block = blocksResponse?.blocks.find((b) => b.date === date);

    // check if the current slot is available
    const disabled = block?.unavailableSlots.find(
      (s) => s.timeSlotId === slot.id
    ) !== undefined;

    return (
      <Chip
        value={slot.id.toString()}
        disabled={disabled}
        styles={{ input: {display: 'block'}}} // necessary for a smooth transition
      >
        <Text style={{ fontVariantNumeric: 'tabular-nums' }}>
          { dayjs(slot.startTime, 'HH:mm:ss').format('HH:mm') }
        </Text>
      </Chip>
    );
});

  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <Flex
        direction={{ base: 'column', xs: 'row' }}
        align='center'
        justify='center'
        gap={0}
      >
        <DatePicker
          {...form.getInputProps('date')}
          size='md'
          hideOutsideDates // Hide days from prev/next month
          maxLevel='month' // Disable month/year selection
          excludeDate={excludeDateFn}
          onChange={(value) => {
            // Update selected date
            form.setFieldValue('date', value);
            form.setFieldValue('slot', null);
          }}
          onDateChange={setDate}
        />

        <Transition 
          mounted={form.values.date !== null} 
          transition={chipTransition}
          duration={400} 
          timingFunction='ease'
        >
          {(styles) => (
            <div style={{ ...styles }}>
              <Chip.Group {...form.getInputProps('slot')}>
                <Flex
                  direction={{ base: 'row', xs: 'column' }}
                  justify='center'
                  wrap='wrap'
                  gap='sm'
                  style={{ minWidth: 0, minHeight: 0 }}
                >
                  {chips}
                </Flex>
              </Chip.Group>
            </div>
          )}
        </Transition>
      </Flex>
    </form>
  );
}
