'use client';

import { useEffect, useMemo } from 'react';
import { CalendarCheck, CalendarX, CalendarClock } from 'lucide-react';
import {
  analyzeRange,
  buildTakenMap,
  describeHalves,
  type LeaveLike,
  type LeaveMode,
  type DayHalf,
  type HolidayLike,
} from '@/lib/leavePortions';

interface Props {
  startDate: string;
  endDate: string;
  leaveMode: LeaveMode;
  period: 'full' | DayHalf;
  /** every leave the current user can see (own + others); filtered internally */
  leaves: LeaveLike[];
  currentUserId?: string | number | null;
  /** exclude the row being edited so it does not clash with itself */
  excludeRequestId?: string | null;
  holidays?: HolidayLike[];
  /** notified whenever the requested range clashes with an existing booking */
  onConflictChange?: (hasConflict: boolean) => void;
}

export function LeaveDayAvailabilityPreview({
  startDate,
  endDate,
  leaveMode,
  period,
  leaves,
  currentUserId,
  excludeRequestId,
  holidays = [],
  onConflictChange,
}: Props) {
  const takenMap = useMemo(
    () => buildTakenMap(leaves, currentUserId, excludeRequestId),
    [leaves, currentUserId, excludeRequestId],
  );

  const analysis = useMemo(
    () =>
      analyzeRange({
        startDate,
        endDate,
        mode: leaveMode,
        period,
        takenMap,
        holidays,
      }),
    [startDate, endDate, leaveMode, period, takenMap, holidays],
  );

  useEffect(() => {
    onConflictChange?.(analysis.hasConflict);
  }, [analysis.hasConflict, onConflictChange]);

  if (leaveMode === 'hourly' || !startDate || !endDate) return null;
  if (analysis.days.length === 0) return null;

  const workingDays = analysis.days.filter(
    (d) => !d.isWeekend && !d.isHoliday,
  );
  if (workingDays.length === 0) return null;

  return (
    <div className="md:col-span-2 mt-1 rounded-xl border border-gray-200 bg-[#F8FAFC] p-4">
      <div className="mb-3 flex items-center gap-2">
        <CalendarClock className="h-4 w-4 text-blue-600" />
        <p className="text-[13px] font-bold text-gray-800">
          ตรวจสอบวันลา (รายวัน)
        </p>
      </div>

      <ul className="space-y-2">
        {analysis.days.map((day) => {
          const skip = day.isWeekend || day.isHoliday;
          const requestedLabel =
            day.requestedHalves.length === 2
              ? 'เต็มวัน'
              : describeHalves(day.requestedHalves);

          let icon = (
            <CalendarCheck className="h-4 w-4 shrink-0 text-emerald-600" />
          );
          let statusText = `ลาได้ (${requestedLabel})`;
          let statusClass = 'text-emerald-700';

          if (skip) {
            icon = (
              <CalendarClock className="h-4 w-4 shrink-0 text-gray-400" />
            );
            statusText = day.isHoliday ? 'วันหยุดนักขัตฤกษ์' : 'วันหยุดสุดสัปดาห์';
            statusClass = 'text-gray-400';
          } else if (day.conflict) {
            icon = <CalendarX className="h-4 w-4 shrink-0 text-red-600" />;
            statusText = day.remainingLabel
              ? `ลาซ้ำ — วันนี้เหลือเฉพาะ${day.remainingLabel}`
              : 'ลาเต็มวันแล้ว ลาเพิ่มไม่ได้';
            statusClass = 'text-red-600';
          } else if (day.takenHalves.length > 0) {
            // Partially booked already — this day only actually claims the
            // free half, even though the request itself asked for a full day.
            const claimedLabel = describeHalves(day.claimedHalves);
            statusText = `ลาได้ (${claimedLabel}) — มีลาเดิม ${describeHalves(
              day.takenHalves,
            )}`;
          }

          return (
            <li
              key={day.date}
              className="flex items-start gap-2 text-[12.5px] leading-5"
            >
              {icon}
              <span className="min-w-[86px] font-semibold text-gray-700">
                {day.thDate}
              </span>
              <span className={`font-medium ${statusClass}`}>{statusText}</span>
            </li>
          );
        })}
      </ul>

      <p className="mt-3 text-[12.5px] font-semibold text-gray-700">
        รวมวันลาที่จะถูกหักตามช่วงนี้: {analysis.totalDays} วัน
      </p>

      {analysis.hasConflict && (
        <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-[12px] font-medium text-red-700">
          บางวันในช่วงที่เลือกทับซ้อนกับการลาเดิมของคุณ กรุณาปรับช่วงวันที่ หรือ
          เปลี่ยนรูปแบบการลาให้ตรงกับช่วงเวลาที่ยังว่าง
          {leaveMode === 'full_day' && ' (เช่น เลือก "ครึ่งวัน" ในวันที่มีลาอยู่แล้ว)'}
        </p>
      )}
    </div>
  );
}

export default LeaveDayAvailabilityPreview;
