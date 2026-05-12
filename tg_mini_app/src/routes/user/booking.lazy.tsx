import { createLazyFileRoute } from '@tanstack/react-router'
import { Group, Chip, Flex, Text } from '@mantine/core';
import { useForm } from '@mantine/form';
import { DatePicker } from '@mantine/dates';
import { useEffect } from 'react';

export const Route = createLazyFileRoute('/user/booking')({
  component: BookingForm,
})

const tg = window.Telegram.WebApp;

function BookingForm() {
  useEffect(() => {
  
      // Render Telegram MainButton
      tg.MainButton.setText("Submit");
      tg.MainButton.show();
  
      // Open the booking form
      const handleMainButtonClick = () => {
        console.log("Booking submitted!");
      };
  
      tg.MainButton.onClick(handleMainButtonClick);
  
      return () => {
        tg.MainButton.hide();
        tg.MainButton.offClick(handleMainButtonClick);
      };
    }, []);

  const form = useForm({
    mode: 'uncontrolled',
    initialValues: {
      date: null,
    },
  });

  return (
    <form onSubmit={form.onSubmit((values) => console.log(values))}>
      <Flex
        direction={{ base: 'column', xs: 'row' }}
        justify='center'
        align='center'
        gap='sm'
      >
        <DatePicker
          key={form.key('date')}
          {...form.getInputProps('date')}
        />
        <Chip.Group>
          <Group justify='center'>
            <Chip value="1"><Text style={{ fontVariantNumeric: 'tabular-nums' }}>09:00</Text></Chip>
            <Chip value="2"><Text style={{ fontVariantNumeric: 'tabular-nums' }}>10:00</Text></Chip>
            <Chip value="3"><Text style={{ fontVariantNumeric: 'tabular-nums' }}>11:00</Text></Chip>
            <Chip value="4"><Text style={{ fontVariantNumeric: 'tabular-nums' }}>12:00</Text></Chip>
          </Group>
        </Chip.Group>
      </Flex>
    </form>
  );
}