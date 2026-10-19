'use client';

/**
 * Shared fields of the leave request form, used by every "สร้างคำลา" page
 * (employee / manager / HR) and every "แก้ไขคำขอลา" form, so all six screens
 * look and behave the same. The layout is the employee create page's
 * (app/dashboard/user/request), which is the reference design.
 */

import { DatePicker, compactDateFieldSx } from '@/components/DateAndTime';
import { LeaveTimePicker } from '@/components/LeaveTimePicker';
import { LeaveDayAvailabilityPreview } from '@/components/LeaveDayAvailabilityPreview';
import type { LeaveBalance } from '@/hooks/useLeaveBalance';
import type {
  DayPortion,
  HolidayLike,
  LeaveLike,
  LeaveMode,
} from '@/lib/leavePortions';
import { LeaveTypeSelect } from './LeaveTypeSelect';

export interface LeaveFormValues {
  type: string;
  leaveMode: string;
  period: string;
  startDate: string;
  endDate: string;
  leaveDate: string;
  startTime: string;
  endTime: string;
  reason: string;
}

export const EMPTY_LEAVE_FORM: LeaveFormValues = {
  type: '',
  leaveMode: 'full_day',
  period: 'full',
  startDate: '',
  endDate: '',
  leaveDate: '',
  startTime: '',
  endTime: '',
  reason: '',
};

/** DatePicker onChange can hand back a dayjs-like object or a plain date string. */
export function formatPickerValue(val: unknown): string {
  if (val && typeof val === 'object') {
    const dayjsLike = val as { format?: (f: string) => string };
    if (typeof dayjsLike.format === 'function') {
      return dayjsLike.format('YYYY-MM-DD');
    }
  }
  if (typeof val === 'string') {
    return val.substring(0, 10);
  }
  return '';
}

export const fieldLabelClass =
  'text-[13px] font-semibold text-gray-800 block mb-2';

const modeOptionClass =
  'flex items-center gap-2 cursor-pointer bg-white border border-gray-200 px-4 py-2 rounded-lg hover:border-blue-400 transition-colors';

interface Props {
  values: LeaveFormValues;
  onChange: (patch: Partial<LeaveFormValues>) => void;
  balances: LeaveBalance[];
  /** Edit forms: the leave's own type stays selectable even if its quota looks used up. */
  keepEnabledTypeId?: string;
  isDateDisabled?: (date: unknown) => boolean;
  /** Leaves of the requester, for the per-day availability check. */
  leaves: LeaveLike[];
  currentUserId?: string | null;
  /** Edit forms: the request being edited, so it does not clash with itself. */
  excludeRequestId?: string;
  holidays?: HolidayLike[];
  onConflictChange?: (hasConflict: boolean) => void;
  /**
   * "ลารายชั่วโมง" is switched off company-wide (as on the employee page).
   * An existing hourly leave still shows its hourly fields when edited.
   */
  allowHourly?: boolean;
}

export function LeaveFormFields({
  values,
  onChange,
  balances,
  keepEnabledTypeId,
  isDateDisabled,
  leaves,
  currentUserId,
  excludeRequestId,
  holidays,
  onConflictChange,
  allowHourly = false,
}: Props) {
  const { leaveMode, period } = values;
  const showHourlyOption = allowHourly || leaveMode === 'hourly';

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6 mb-6">
        {/* Leave Type */}
        <div className="md:col-span-1">
          <label className={fieldLabelClass}>ประเภทการลา</label>
          <LeaveTypeSelect
            value={values.type}
            onChange={(type) => onChange({ type })}
            balances={balances}
            keepEnabledTypeId={keepEnabledTypeId}
          />
        </div>

        {/* รูปแบบการลา */}
        <div className="md:col-span-1">
          <label className={fieldLabelClass}>รูปแบบการลา</label>
          <div className="flex flex-wrap gap-x-6 gap-y-3 mt-1">
            <label className={modeOptionClass}>
              <input
                type="radio"
                name="leaveMode"
                checked={leaveMode === 'full_day'}
                onChange={() => onChange({ leaveMode: 'full_day', period: 'full' })}
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">เต็มวัน</span>
            </label>
            <label className={modeOptionClass}>
              <input
                type="radio"
                name="leaveMode"
                checked={leaveMode === 'half_day'}
                onChange={() =>
                  onChange({ leaveMode: 'half_day', period: 'morning' })
                }
                className="w-4 h-4 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">ครึ่งวัน</span>
            </label>
            {showHourlyOption && (
              <label className={modeOptionClass}>
                <input
                  type="radio"
                  name="leaveMode"
                  checked={leaveMode === 'hourly'}
                  onChange={() => onChange({ leaveMode: 'hourly' })}
                  className="w-4 h-4 text-blue-600 focus:ring-blue-500"
                />
                <span className="text-sm font-medium text-gray-700">
                  ลารายชั่วโมง
                </span>
              </label>
            )}
          </div>
        </div>

        {leaveMode === 'hourly' ? (
          <>
            <div className="md:col-span-2 md:w-[calc(50%-1.5rem)]">
              <label className={fieldLabelClass}>วันที่ลา</label>
              <DatePicker
                value={values.leaveDate || null}
                onChange={(val: unknown) =>
                  onChange({ leaveDate: formatPickerValue(val) })
                }
                shouldDisableDate={isDateDisabled}
                placeholderText="วว/ดด/ปปปป"
              />
            </div>
            <div className="md:col-span-2">
              <LeaveTimePicker
                startTime={values.startTime}
                endTime={values.endTime}
                onChangeStartTime={(startTime) => onChange({ startTime })}
                onChangeEndTime={(endTime) => onChange({ endTime })}
              />
            </div>
          </>
        ) : (
          <>
            {/* Mobile: start/end share one row; md+: `contents` lets them flow into the parent 2-col grid */}
            <div className="grid grid-cols-2 gap-3 md:contents">
              <div className="min-w-0">
                <label className={fieldLabelClass}>วันที่เริ่มต้น</label>
                <DatePicker
                  value={values.startDate || null}
                  onChange={(val: unknown) =>
                    onChange({ startDate: formatPickerValue(val) })
                  }
                  shouldDisableDate={isDateDisabled}
                  placeholderText="วว/ดด/ปปปป"
                  sx={compactDateFieldSx}
                />
                {leaveMode === 'half_day' && (
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-2 mt-3">
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="period"
                        value="morning"
                        checked={period === 'morning'}
                        onChange={() => onChange({ period: 'morning' })}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-400 focus:ring-blue-500"
                      />
                      ครึ่งวันเช้า
                    </label>
                    <label className="flex items-center gap-1.5 text-xs text-gray-700 cursor-pointer">
                      <input
                        type="radio"
                        name="period"
                        value="afternoon"
                        checked={period === 'afternoon'}
                        onChange={() => onChange({ period: 'afternoon' })}
                        className="w-3.5 h-3.5 text-blue-600 border-gray-400 focus:ring-blue-500"
                      />
                      ครึ่งวันบ่าย
                    </label>
                  </div>
                )}
              </div>
              <div className="min-w-0">
                <label className={fieldLabelClass}>วันที่สิ้นสุด</label>
                <DatePicker
                  value={values.endDate || null}
                  minDate={values.startDate ? values.startDate : undefined}
                  onChange={(val: unknown) =>
                    onChange({ endDate: formatPickerValue(val) })
                  }
                  shouldDisableDate={isDateDisabled}
                  placeholderText="วว/ดด/ปปปป"
                  sx={compactDateFieldSx}
                />
              </div>
            </div>
            <LeaveDayAvailabilityPreview
              startDate={values.startDate}
              endDate={values.endDate}
              leaveMode={leaveMode as LeaveMode}
              period={
                leaveMode === 'half_day' ? ((period as DayPortion) ?? 'full') : 'full'
              }
              leaves={leaves}
              currentUserId={currentUserId}
              excludeRequestId={excludeRequestId}
              holidays={holidays}
              onConflictChange={onConflictChange}
            />
          </>
        )}
      </div>

      {/* Reason */}
      <div className="mb-6">
        <label className={fieldLabelClass}>เหตุผลการลา</label>
        <textarea
          rows={4}
          value={values.reason}
          onChange={(e) => onChange({ reason: e.target.value })}
          className="w-full border border-gray-300 rounded-md px-4 py-3 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 placeholder-gray-400 shadow-sm transition-all resize-none text-gray-700"
          placeholder="ระบุเหตุผลที่ชัดเจน..."
        />
      </div>
    </>
  );
}

export default LeaveFormFields;
