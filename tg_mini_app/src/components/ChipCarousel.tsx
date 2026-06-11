import { useState, useEffect, useCallback, type ReactElement } from 'react';
import { Carousel } from '@mantine/carousel';
import type { ChipProps } from '@mantine/core';
import type { EmblaCarouselType } from 'embla-carousel';

interface ChipCarouselProps {
  children: ReactElement<ChipProps>[];
  width: number;
  height: number;
  orientation: 'horizontal' | 'vertical';
  align?: 'start' | 'center' | 'end';
}

export function ChipCarousel({
  children,
  width,
  height,
  orientation,
  align = 'start',
}: ChipCarouselProps) {
  const isHorizontal = orientation === 'horizontal';

  const [embla, setEmbla] = useState<EmblaCarouselType | null>(null);
  const [isFirst, setIsFirst] = useState(true);
  const [isLast, setIsLast] = useState(false);

  const gradientStart = isFirst ? '0%' : '10%';
  const gradientEnd = isLast ? '100%' : '90%';
  const gradientDirection = isHorizontal ? 'right' : 'bottom';

  const handleScroll = useCallback(() => {
    if (!embla) return;

    setIsFirst(!embla.canScrollPrev());
    setIsLast(!embla.canScrollNext());
  }, [embla]);

  useEffect(() => {
    if (!embla) return;
    embla.on('scroll', handleScroll);

    return () => {
      embla.off('scroll', handleScroll);
    };
  }, [embla, handleScroll]);

  useEffect(() => {
    handleScroll();
  }, [orientation, handleScroll]);

  const carouselProps = {
    getEmblaApi: setEmbla,
    slideSize: 'auto',
    slideGap: 'sm',
    withControls: false,
    emblaOptions: { slidesToScroll: 'auto' as const },
    ...(isHorizontal && { w: width }),
    ...(!isHorizontal && { h: height, height: height }),
    orientation: orientation,
    styles: {
      root: {
        maskImage: [
          `linear-gradient(to ${gradientDirection}, transparent, black`,
          `${gradientStart}, black ${gradientEnd}, transparent)`
        ].join(' ')
      },
      slide: {
        display: 'flex',
        ...(isHorizontal && { alignContent: `flex-${align}` }),
        ...(!isHorizontal && { justifyContent: `flex-${align}` }),
      }
    }
  };

  return (
    <Carousel {...carouselProps}>
      {children.map((chip) => (
        <Carousel.Slide>
          {chip}
        </Carousel.Slide>
      ))}
    </Carousel>
  );
}
