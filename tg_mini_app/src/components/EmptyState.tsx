import { Center, Stack, Text } from '@mantine/core';
import { type ReactNode } from 'react';

interface EmptyStateProps {
  children: ReactNode;
  text: string;
}

export function EmptyState({ children, text }: EmptyStateProps) {
  return (
    <Center h='var(--tg-viewport-height)'>
      <Stack align='center' gap='md'>
        {children}
        <Text c='dimmed'>{text}</Text>
      </Stack>
    </Center>
  );
}
