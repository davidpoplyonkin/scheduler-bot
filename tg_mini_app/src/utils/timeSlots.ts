import dayjs, { Dayjs } from 'dayjs';

import type { ConstraintGetResponse } from '../types/ConstraintUserGetResponse';

interface Block {
  date: string;
  unavailableSlots: { timeSlotId: number }[];
}

interface TimeSlotAvailableParams {
  date: string;
  slot: ConstraintGetResponse['timeSlots'][number];
  constraints: ConstraintGetResponse;
  blocks: Block[];
  minDateTime: Dayjs;
  maxDateTime: Dayjs;
}

export function timeSlotAvailable({
  date,
  slot,
  constraints,
  blocks,
  minDateTime,
  maxDateTime,
}: TimeSlotAvailableParams): boolean {
  // Check forbidden weekday (Python: 0=Mon..6=Sun, JS dayjs: 0=Sun..6=Sat)
  const jsWeekday = dayjs(date).day();
  const pythonWeekday = (jsWeekday + 6) % 7;
  if (constraints.forbiddenWeekdays.includes(pythonWeekday)) {
    return false;
  }

  // Combine date with slot start time
  const slotDateTime = dayjs.utc(`${date}T${slot.startTime}`);

  // Check if slot is within allowed time range
  if (slotDateTime.isBefore(minDateTime) || slotDateTime.isAfter(maxDateTime)) {
    return false;
  }

  // Find the block corresponding to the chosen date
  const block = blocks.find((b) => b.date === date);

  // Check if the current slot is blocked
  if (block?.unavailableSlots.find((s) => s.timeSlotId === slot.id)) {
    return false;
  }

  return true;
}
