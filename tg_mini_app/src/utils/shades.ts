import chroma from 'chroma-js';
import { colorsTuple, type MantineColorsTuple } from '@mantine/core';

export function generateShades(
  baseColor: string = 'blue', 
  targetIndex: number = 7
): MantineColorsTuple {
  const total = 12; // 10 shades + pure white and black to be removed

  const shades = chroma
    .scale(['white', baseColor, 'black'])
    .domain([0, targetIndex + 1, total - 1])
    .mode('lch')
    .colors(total)
    .slice(1, -1); // Remove pure white and black

  return colorsTuple(shades);
}