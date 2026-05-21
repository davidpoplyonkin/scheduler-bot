import { type ReactNode, type ComponentProps } from 'react';
import { Chip, Flex, Transition, useMatches } from '@mantine/core';

interface ChipTransitionProps {
  mounted: boolean;
  chipGroupProps: Omit<ComponentProps<typeof Chip.Group>, 'children'>;
  chips: ReactNode;
}

export function ChipTransition({ mounted, chipGroupProps, chips }: ChipTransitionProps) {
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

  return (
    <Transition
      mounted={mounted}
      transition={chipTransition}
      duration={400}
      timingFunction='ease'
    >
      {(styles) => (
        <div style={{ ...styles }}>
          <Chip.Group {...chipGroupProps}>
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
  );
}
