import { format, parseISO } from 'date-fns';
import { th } from 'date-fns/locale';
import { calculateLeaveDays } from '@/lib/api/store';
import type { Leave } from '@/lib/api/types';

/**
 * Human-readable date range for a leave, e.g. "1 - 5 ม.ค." or, for an hourly
 * leave, with the clock time appended ("1 ม.ค. (09:00 - 12:00 น.)").
 */
export function formatLeaveDateRange(
  startDateStr: string,
  endDateStr: string,
  leave?: Leave,
): string {
  try {
    const start = parseISO(startDateStr);
    const end = parseISO(endDateStr);
    const startDay = format(start, 'd');
    const startMonth = format(start, 'MMM', { locale: th });
    const endDay = format(end, 'd');
    const endMonth = format(end, 'MMM', { locale: th });

    let baseStr = '';
    if (startDateStr.split('T')[0] === endDateStr.split('T')[0]) {
      baseStr = `${startDay} ${startMonth}.`;
    } else if (startMonth === endMonth) {
      baseStr = `${startDay} - ${endDay} ${startMonth}.`;
    } else {
      baseStr = `${startDay} ${startMonth}. - ${endDay} ${endMonth}.`;
    }

    if (leave) {
      const mode = leave.startFormat || leave.leaveMode;
      if (
        mode === 'hourly' ||
        (leave.leaveHours &&
          leave.leaveHours < 8 &&
          mode !== 'full' &&
          mode !== 'full_day' &&
          mode !== 'half_day' &&
          mode !== 'morning' &&
          mode !== 'afternoon')
      ) {
        let startT = leave.startTime;
        if (!startT && startDateStr.includes('T')) {
          startT = format(start, 'HH:mm');
        }
        let endT = leave.endTime;
        if (!endT && endDateStr.includes('T')) {
          endT = format(end, 'HH:mm');
        }

        if (startT && endT && startT !== endT) {
          return `${baseStr} (${startT} - ${endT} น.)`;
        }
      }
    }

    return baseStr;
  } catch {
    return startDateStr;
  }
}

/**
 * Human-readable duration for a leave: hours for hourly/sub-half-day leaves,
 * "0.5 วัน" for a half day, otherwise the day count (falling back to
 * `calculateLeaveDays` when the row has no persisted total).
 */
export function formatLeaveDuration(
  leave: Leave,
  holidaysData: { date?: string }[],
): string {
  const days = Number(leave.totalDays || leave.durationDays || 0);
  const mode = leave.startFormat || leave.leaveMode;
  if (mode === 'hourly' || (days > 0 && days < 0.5)) {
    const hours = leave.leaveHours
      ? Number(leave.leaveHours)
      : Number((days * 8).toFixed(2));
    const h = Math.floor(hours);
    const m = Math.round((hours - h) * 60);
    return m === 0 ? `${h} ชม.` : `${h}.${m.toString().padStart(2, '0')} ชม.`;
  }
  if (
    mode === 'half_day' ||
    mode === 'morning' ||
    mode === 'afternoon' ||
    days === 0.5
  ) {
    return `0.5 วัน`;
  }
  const finalDays =
    days > 0
      ? days
      : calculateLeaveDays(
          leave.startDate,
          leave.endDate,
          leave.startFormat,
          leave.endFormat,
          holidaysData,
        );
  return `${finalDays} วัน`;
}
