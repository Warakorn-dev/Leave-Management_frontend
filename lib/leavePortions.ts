/**
 * Front-end mirror of the backend `leave-portion.util.ts`.
 *
 * A calendar day holds at most one full day of leave, made of one or two
 * non-overlapping halves ("morning" / "afternoon"). These helpers let the
 * request / edit screens judge availability per day and per half instead of
 * blocking a whole day whenever any leave touches it.
 *
 * The backend stays the source of truth; this only drives the picker + preview.
 */

export type DayHalf = 'morning' | 'afternoon';
export type DayPortion = 'full' | DayHalf;
export type LeaveMode = 'full_day' | 'half_day' | 'hourly';

export const BLOCKING_EXCLUDED_STATUSES = [
  'REJECTED',
  'Rejected',
  'CANCELLED',
  'Cancelled',
];

export interface LeaveLike {
  id?: string;
  status?: string;
  startDate?: string | Date;
  endDate?: string | Date;
  startFormat?: string | null;
  endFormat?: string | null;
  leaveMode?: string | null;
  userId?: string | number;
  employeeId?: string | number;
}

const NOON_MINUTES = 12 * 60;

export function toDayKey(value: string | Date): string {
  const d = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(d.getTime())) return '';
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}-${String(
    d.getUTCDate(),
  ).padStart(2, '0')}`;
}

/** 'YYYY-MM-DD' -> '15/9/2569' (Buddhist year) */
export function toThaiDate(dayKey: string): string {
  const [y, m, d] = dayKey.split('-');
  if (!y || !m || !d) return dayKey;
  return `${Number(d)}/${Number(m)}/${Number(y) + 543}`;
}

export function normalizePortion(fmt?: string | null): DayPortion {
  if (fmt === 'morning' || fmt === 'afternoon') return fmt;
  return 'full';
}

export function halvesOfPortion(portion: DayPortion): DayHalf[] {
  if (portion === 'morning') return ['morning'];
  if (portion === 'afternoon') return ['afternoon'];
  return ['morning', 'afternoon'];
}

export function describeHalves(halves: DayHalf[]): string {
  const hasMorning = halves.includes('morning');
  const hasAfternoon = halves.includes('afternoon');
  if (hasMorning && hasAfternoon) return 'เต็มวัน';
  if (hasMorning) return 'ครึ่งวันเช้า';
  if (hasAfternoon) return 'ครึ่งวันบ่าย';
  return '-';
}

export function remainingHalfLabel(existingHalves: DayHalf[]): string | null {
  const hasMorning = existingHalves.includes('morning');
  const hasAfternoon = existingHalves.includes('afternoon');
  if (hasMorning && hasAfternoon) return null;
  if (hasMorning) return 'ครึ่งวันบ่าย';
  if (hasAfternoon) return 'ครึ่งวันเช้า';
  return 'เต็มวัน';
}

export function expandLeaveHalves(leave: LeaveLike): Map<string, Set<DayHalf>> {
  const map = new Map<string, Set<DayHalf>>();
  if (!leave.startDate || !leave.endDate) return map;
  const start = new Date(leave.startDate);
  const end = new Date(leave.endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())) return map;

  const startKey = toDayKey(start);
  const endKey = toDayKey(end);
  const isHourly =
    leave.leaveMode === 'hourly' ||
    leave.startFormat === 'hourly' ||
    leave.endFormat === 'hourly';

  if (isHourly) {
    const halves = new Set<DayHalf>();
    const startMin = start.getUTCHours() * 60 + start.getUTCMinutes();
    const endMin = end.getUTCHours() * 60 + end.getUTCMinutes();
    if (startMin < NOON_MINUTES) halves.add('morning');
    if (endMin > NOON_MINUTES || endMin <= startMin) halves.add('afternoon');
    if (halves.size === 0) halves.add('afternoon');
    map.set(startKey, halves);
    return map;
  }

  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );
  let guard = 0;
  while (cursor <= last && guard < 750) {
    guard += 1;
    const key = toDayKey(cursor);
    let portion: DayPortion = 'full';
    if (key === startKey && key === endKey) {
      portion = normalizePortion(leave.startFormat);
    } else if (key === startKey) {
      portion = leave.startFormat === 'afternoon' ? 'afternoon' : 'full';
    } else if (key === endKey) {
      portion = leave.endFormat === 'morning' ? 'morning' : 'full';
    }
    map.set(key, new Set(halvesOfPortion(portion)));
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }
  return map;
}

/** Union the half-day slots already booked by this employee, keyed by day. */
export function buildTakenMap(
  leaves: LeaveLike[],
  currentUserId?: string | number | null,
  excludeRequestId?: string | null,
): Map<string, Set<DayHalf>> {
  const taken = new Map<string, Set<DayHalf>>();
  for (const leave of leaves || []) {
    if (!leave) continue;
    if (excludeRequestId && String(leave.id) === String(excludeRequestId))
      continue;
    if (leave.status && BLOCKING_EXCLUDED_STATUSES.includes(leave.status))
      continue;
    if (currentUserId != null) {
      const owner = leave.userId ?? leave.employeeId;
      if (owner != null && String(owner) !== String(currentUserId)) continue;
    }
    for (const [day, halves] of expandLeaveHalves(leave)) {
      const acc = taken.get(day) ?? new Set<DayHalf>();
      halves.forEach((h) => acc.add(h));
      taken.set(day, acc);
    }
  }
  return taken;
}

/** Half-day slots a requested leave would occupy on a given day. */
export function requestedHalvesForDay(
  dayKey: string,
  startKey: string,
  endKey: string,
  mode: LeaveMode,
  period: 'full' | DayHalf,
): DayHalf[] {
  if (mode === 'full_day' || mode === 'hourly') return ['morning', 'afternoon'];
  // half_day: the FE sends period as both start and end format
  if (startKey === endKey) return halvesOfPortion(normalizePortion(period));
  if (dayKey === startKey)
    return period === 'afternoon' ? ['afternoon'] : ['morning', 'afternoon'];
  if (dayKey === endKey)
    return period === 'morning' ? ['morning'] : ['morning', 'afternoon'];
  return ['morning', 'afternoon'];
}

export interface DayAnalysis {
  date: string;
  thDate: string;
  isWeekend: boolean;
  isHoliday: boolean;
  takenHalves: DayHalf[];
  requestedHalves: DayHalf[];
  /**
   * The halves this day will actually claim once submitted: `requestedHalves`
   * minus whatever is already taken. A full-day request landing on a day
   * that is already half-booked degrades to a half-day claim here instead of
   * being rejected outright — only when this ends up empty is the day a real
   * conflict. Mirrors the backend's `planDayPortions`.
   */
  claimedHalves: DayHalf[];
  conflict: boolean;
  /** the half still free when the day is partially booked */
  remainingLabel: string | null;
}

export interface RangeAnalysis {
  days: DayAnalysis[];
  conflictDays: DayAnalysis[];
  hasConflict: boolean;
  /** sum of claimed days across the range (full = 1, half = 0.5) */
  totalDays: number;
}

export type HolidayLike =
  | string
  | { date?: string | Date; holidayDate?: string | Date };

function isHolidayKey(dayKey: string, holidays: HolidayLike[]): boolean {
  if (!holidays || holidays.length === 0) return false;
  return holidays.some((h) => {
    const raw = typeof h === 'string' ? h : h?.date ?? h?.holidayDate;
    if (raw instanceof Date) return toDayKey(raw) === dayKey;
    if (typeof raw !== 'string') return false;
    return raw.substring(0, 10) === dayKey;
  });
}

/**
 * Walk every day in [startDate, endDate] and describe how a requested leave
 * (mode + period) lines up with what is already booked.
 */
export function analyzeRange(params: {
  startDate: string;
  endDate: string;
  mode: LeaveMode;
  period: 'full' | DayHalf;
  takenMap: Map<string, Set<DayHalf>>;
  holidays?: HolidayLike[];
}): RangeAnalysis {
  const { startDate, endDate, mode, period, takenMap, holidays = [] } = params;
  const days: DayAnalysis[] = [];
  const empty: RangeAnalysis = {
    days,
    conflictDays: [],
    hasConflict: false,
    totalDays: 0,
  };
  if (!startDate || !endDate) return empty;

  const start = new Date(startDate);
  const end = new Date(endDate);
  if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime()) || start > end)
    return empty;

  const startKey = toDayKey(start);
  const endKey = toDayKey(end);

  const cursor = new Date(
    Date.UTC(start.getUTCFullYear(), start.getUTCMonth(), start.getUTCDate()),
  );
  const last = new Date(
    Date.UTC(end.getUTCFullYear(), end.getUTCMonth(), end.getUTCDate()),
  );
  let guard = 0;
  while (cursor <= last && guard < 400) {
    guard += 1;
    const key = toDayKey(cursor);
    const weekday = cursor.getUTCDay();
    const isWeekend = weekday === 0 || weekday === 6;
    const isHoliday = isHolidayKey(key, holidays);
    const takenHalves = [...(takenMap.get(key) ?? new Set<DayHalf>())].sort() as DayHalf[];
    const requestedHalves = requestedHalvesForDay(
      key,
      startKey,
      endKey,
      mode,
      period,
    );
    // What this day actually gets to claim: requested minus already-taken. A
    // full-day request landing on a half-booked day degrades to the free
    // half instead of being blocked; only an empty result is a real conflict.
    const claimedHalves = requestedHalves.filter(
      (h) => !takenHalves.includes(h),
    );
    const conflict = !isWeekend && !isHoliday && claimedHalves.length === 0;

    days.push({
      date: key,
      thDate: toThaiDate(key),
      isWeekend,
      isHoliday,
      takenHalves,
      requestedHalves,
      claimedHalves,
      conflict,
      remainingLabel: takenHalves.length
        ? remainingHalfLabel(takenHalves)
        : null,
    });
    cursor.setUTCDate(cursor.getUTCDate() + 1);
  }

  const conflictDays = days.filter((d) => d.conflict);
  const totalDays = days
    .filter((d) => !d.isWeekend && !d.isHoliday && !d.conflict)
    .reduce((sum, d) => sum + d.claimedHalves.length * 0.5, 0);
  return {
    days,
    conflictDays,
    hasConflict: conflictDays.length > 0,
    totalDays,
  };
}

/**
 * Should the DatePicker disable this day for the current mode/period?
 * Only when there is genuinely no room left for what the user is trying to book.
 */
export function isDayUnavailable(
  date: unknown,
  mode: LeaveMode,
  period: 'full' | DayHalf,
  takenMap: Map<string, Set<DayHalf>>,
): boolean {
  if (!date) return false;
  let key = '';
  const dayjsLike = date as { isValid?: () => boolean; format?: (f: string) => string };
  if (typeof dayjsLike?.isValid === 'function' && dayjsLike.isValid()) {
    key = dayjsLike.format!('YYYY-MM-DD');
  } else if (date instanceof Date) {
    if (Number.isNaN(date.getTime())) return false;
    key = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
      date.getDate(),
    ).padStart(2, '0')}`;
  } else if (typeof date === 'string') {
    key = date.substring(0, 10);
  } else {
    return false;
  }

  const taken = takenMap.get(key);
  if (!taken || taken.size === 0) return false;

  const bothTaken = taken.has('morning') && taken.has('afternoon');
  if (bothTaken) return true;
  // full_day: a day with only one half taken is still pickable — it degrades
  // to a half-day claim on that one day instead of being blocked (see
  // `analyzeRange` / the backend's `planDayPortions`).
  if (mode === 'hourly') return bothTaken;
  // half_day: blocked only if the chosen half is the one already taken
  if (period === 'morning') return taken.has('morning');
  if (period === 'afternoon') return taken.has('afternoon');
  return false;
}
