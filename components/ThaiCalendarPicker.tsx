"use client";

import React, { useState, useRef, useEffect, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// Thai Calendar Component — ปฏิทินภาษาไทย ใช้ร่วมกันทั้งระบบ
// ═══════════════════════════════════════════════════════════════

// ─── Constants ─────────────────────────────────────────────────
export const THAI_MONTHS = [
  "มกราคม", "กุมภาพันธ์", "มีนาคม", "เมษายน", "พฤษภาคม", "มิถุนายน",
  "กรกฎาคม", "สิงหาคม", "กันยายน", "ตุลาคม", "พฤศจิกายน", "ธันวาคม",
];
export const THAI_DAYS_SHORT = ["อา", "จ", "อ", "พ", "พฤ", "ศ", "ส"];

// ─── Types ─────────────────────────────────────────────────────
interface CalendarDay {
  day: number;
  month: number;
  year: number;
  isCurrentMonth: boolean;
  isToday: boolean;
  dateStr: string; // YYYY-MM-DD
}

// ─── Utilities ─────────────────────────────────────────────────
function buildCalendarDays(month: number, year: number): CalendarDay[] {
  const now = new Date();
  const todayStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;

  const firstDow = new Date(year, month, 1).getDay();
  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const daysInPrev = new Date(year, month, 0).getDate();

  const cells: CalendarDay[] = [];

  // Previous month tail
  const pm = month === 0 ? 11 : month - 1;
  const py = month === 0 ? year - 1 : year;
  for (let i = firstDow - 1; i >= 0; i--) {
    const d = daysInPrev - i;
    const ds = `${py}-${String(pm + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, month: pm, year: py, isCurrentMonth: false, isToday: ds === todayStr, dateStr: ds });
  }

  // Current month
  for (let d = 1; d <= daysInMonth; d++) {
    const ds = `${year}-${String(month + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
    cells.push({ day: d, month, year, isCurrentMonth: true, isToday: ds === todayStr, dateStr: ds });
  }

  // Next month head (fill to 35 or 42)
  const total = cells.length <= 35 ? 35 : 42;
  const nm = month === 11 ? 0 : month + 1;
  const ny = month === 11 ? year + 1 : year;
  let nd = 1;
  while (cells.length < total) {
    const ds = `${ny}-${String(nm + 1).padStart(2, "0")}-${String(nd).padStart(2, "0")}`;
    cells.push({ day: nd, month: nm, year: ny, isCurrentMonth: false, isToday: ds === todayStr, dateStr: ds });
    nd++;
  }

  return cells;
}

function yearList(center: number, span = 15): number[] {
  return Array.from({ length: span * 2 + 1 }, (_, i) => center - span + i);
}

// ─── Internal: Calendar Navigation Header ──────────────────────
function CalendarNav({
  month, year, onPrev, onNext, onMonthChange, onYearChange, minYear, maxYear
}: {
  month: number; year: number;
  onPrev: () => void; onNext: () => void;
  onMonthChange: (m: number) => void; onYearChange: (y: number) => void;
  minYear?: number; maxYear?: number;
}) {
  const years = useMemo(() => {
    if (minYear !== undefined && maxYear !== undefined) {
      const list = [];
      for (let y = minYear; y <= maxYear; y++) list.push(y);
      return list;
    }
    return yearList(new Date().getFullYear());
  }, [minYear, maxYear]);

  return (
    <div className="flex flex-col items-center gap-2 mb-3">
      {/* Title row with navigation arrows */}
      <div className="flex items-center justify-between w-full">
        <button
          type="button"
          onClick={onPrev}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="เดือนก่อนหน้า"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span className="text-[15px] font-bold text-blue-900 select-none tracking-wide">
          {THAI_MONTHS[month]} {year + 543}
        </span>
        <button
          type="button"
          onClick={onNext}
          className="w-8 h-8 flex items-center justify-center text-gray-400 hover:text-blue-600 rounded-full hover:bg-gray-100 transition-colors"
          aria-label="เดือนถัดไป"
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>

      {/* Month & Year dropdowns */}
      <div className="flex items-center gap-3">
        <select
          value={month}
          onChange={(e) => onMonthChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-gray-700 bg-white outline-none focus:border-blue-500 cursor-pointer"
        >
          {THAI_MONTHS.map((m, i) => (
            <option key={i} value={i}>{m}</option>
          ))}
        </select>
        <select
          value={year}
          onChange={(e) => onYearChange(Number(e.target.value))}
          className="border border-gray-300 rounded-md px-2.5 py-1.5 text-[13px] font-medium text-gray-700 bg-white outline-none focus:border-blue-500 cursor-pointer"
        >
          {years.map((y) => (
            <option key={y} value={y}>{y + 543}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ThaiDatePicker — Popup date picker (แทน react-datepicker)
// ═══════════════════════════════════════════════════════════════
import { useLeave } from "@/hooks/useLeave";

export interface ThaiDatePickerProps {
  selected: Date | null;
  onChange: (date: Date | null) => void;
  placeholderText?: string;
  className?: string;
  disabled?: boolean;
  minDate?: Date | null;
  maxDate?: Date | null;
  isPlain?: boolean;
  minYear?: number;
  maxYear?: number;
}

export function ThaiDatePicker({
  selected, onChange, placeholderText = "วว/ดด/ปปปป", className, disabled, minDate, maxDate, isPlain = false, minYear, maxYear
}: ThaiDatePickerProps) {
  const { useHolidaysQuery, useLeavesQuery } = useLeave();
  const { data: holidays = [] } = useHolidaysQuery();
  const { data: allLeaves = [] } = useLeavesQuery();
  const userId = typeof window !== 'undefined' ? sessionStorage.getItem('userId') : null;
  const myLeaves = useMemo(() => allLeaves.filter((l: any) => 
    String(l.userId) === String(userId) || String(l.employee?.userId) === String(userId)
  ), [allLeaves, userId]);

  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState<'bottom' | 'top'>('bottom');
  const [vMonth, setVMonth] = useState(() => (selected ?? new Date()).getMonth());
  const [vYear, setVYear] = useState(() => (selected ?? new Date()).getFullYear());
  const ref = useRef<HTMLDivElement>(null);

  const minDateNorm = useMemo(() => {
    if (!minDate) return null;
    const d = new Date(minDate);
    d.setHours(0, 0, 0, 0);
    return d.getTime();
  }, [minDate]);

  const maxDateNorm = useMemo(() => {
    if (!maxDate) return null;
    const d = new Date(maxDate);
    d.setHours(23, 59, 59, 999);
    return d.getTime();
  }, [maxDate]);

  const cells = useMemo(() => buildCalendarDays(vMonth, vYear), [vMonth, vYear]);

  const selStr = useMemo(() => {
    if (!selected) return "";
    return `${selected.getFullYear()}-${String(selected.getMonth() + 1).padStart(2, "0")}-${String(selected.getDate()).padStart(2, "0")}`;
  }, [selected]);

  const display = useMemo(() => {
    if (!selected) return "";
    return `${String(selected.getDate()).padStart(2, "0")}/${String(selected.getMonth() + 1).padStart(2, "0")}/${selected.getFullYear() + 543}`;
  }, [selected]);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  // Sync view to selected when opening
  useEffect(() => {
    if (open && selected) {
      setVMonth(selected.getMonth());
      setVYear(selected.getFullYear());
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const prev = () => {
    if (vMonth === 0) { setVMonth(11); setVYear((y) => y - 1); }
    else setVMonth((m) => m - 1);
  };
  const next = () => {
    if (vMonth === 11) { setVMonth(0); setVYear((y) => y + 1); }
    else setVMonth((m) => m + 1);
  };

  return (
    <div className="relative" ref={ref}>
      <input
        type="text"
        readOnly
        value={display}
        placeholder={placeholderText}
        disabled={disabled}
        onClick={() => {
          if (disabled) return;
          if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 350) {
              setPopupPos('top');
            } else {
              setPopupPos('bottom');
            }
          }
          setOpen((o) => !o);
        }}
        className={
          className ||
          "w-full border border-gray-300 rounded-md px-3 py-2.5 text-sm outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all text-gray-700 cursor-pointer"
        }
      />

      {open && (
        <div className={`absolute left-0 z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl p-4 w-[330px] animate-in fade-in zoom-in-95 duration-150 ${
          popupPos === 'top' ? 'bottom-full mb-1' : 'top-full mt-1'
        }`}>
          <CalendarNav
            month={vMonth}
            year={vYear}
            onPrev={prev}
            onNext={next}
            onMonthChange={setVMonth}
            onYearChange={setVYear}
            minYear={minYear}
            maxYear={maxYear}
          />

          {/* Day-of-week headers */}
          <div className="grid grid-cols-7 border-b border-gray-100 pb-1.5 mb-1">
            {THAI_DAYS_SHORT.map((d) => (
              <div key={d} className="text-center text-[12px] font-bold text-gray-500 py-1.5">
                {d}
              </div>
            ))}
          </div>

          {/* Day grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {cells.map((c, i) => {
              const isSel = c.dateStr === selStr;
              const cellTime = new Date(c.year, c.month, c.day).getTime();
              const isBeforeMin = minDateNorm !== null && cellTime < minDateNorm;
              const isAfterMax = maxDateNorm !== null && cellTime > maxDateNorm;
              const isHoliday = !isPlain && holidays.some((h: any) => h.date && h.date.split('T')[0] === c.dateStr);
              
              // Check if date overlaps with existing leave
              const isLeave = !isPlain && myLeaves.some((l: any) => {
                if (['REJECTED', 'Rejected', 'CANCELLED', 'Cancelled'].includes(l.status)) return false;
                if (!l.startDate || !l.endDate) return false;
                const s = new Date(l.startDate);
                s.setHours(0,0,0,0);
                const e = new Date(l.endDate);
                e.setHours(23,59,59,999);
                return cellTime >= s.getTime() && cellTime <= e.getTime();
              });

              const isDisabled = isBeforeMin || isAfterMax || isLeave;

              return (
                <button
                  key={i}
                  type="button"
                  disabled={isDisabled}
                  onClick={() => {
                    onChange(new Date(c.year, c.month, c.day));
                    setOpen(false);
                  }}
                  className={[
                    "h-9 flex items-center justify-center text-[13px] rounded transition-all font-medium",
                    (isBeforeMin || isAfterMax) ? "text-gray-300 dark:text-slate-600 bg-gray-50 dark:bg-slate-800/50 cursor-not-allowed" : "",
                    isLeave ? "bg-orange-100 dark:bg-orange-950/60 text-orange-600 dark:text-orange-300 font-bold cursor-not-allowed border border-orange-200 dark:border-orange-800/60" : "",
                    (!c.isCurrentMonth && !isBeforeMin && !isAfterMax && !isLeave ? "text-gray-300 dark:text-slate-600" : ""),
                    c.isCurrentMonth && !isSel && !isDisabled && !isHoliday ? "text-gray-800 dark:text-slate-100 hover:bg-blue-50 dark:hover:bg-blue-900/40" : "",
                    c.isCurrentMonth && !isSel && !isDisabled && isHoliday ? "text-red-600 dark:text-red-400 font-bold hover:bg-red-50 dark:hover:bg-red-950/40" : "",
                    c.isToday && !isSel && !isDisabled ? "border border-blue-500 dark:border-blue-400 font-bold text-blue-600 dark:text-blue-400" : "",
                    isSel && !isDisabled ? "bg-blue-600 text-white font-bold shadow-sm" : "",
                  ].filter(Boolean).join(" ")}
                >
                  {c.day}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ThaiCalendarInline — Full calendar view (หน้าปฏิทินวันลา)
// ═══════════════════════════════════════════════════════════════
export interface ThaiCalendarInlineProps {
  currentDate: Date;
  onDateChange: (date: Date) => void;
  renderDayContent?: (day: number, dateStr: string) => React.ReactNode;
  onDayClick?: (day: number, dateStr: string) => void;
  className?: string;
}

export function ThaiCalendarInline({
  currentDate, onDateChange, renderDayContent, onDayClick, className,
}: ThaiCalendarInlineProps) {
  const month = currentDate.getMonth();
  const year = currentDate.getFullYear();
  const cells = useMemo(() => buildCalendarDays(month, year), [month, year]);

  return (
    <div className={className}>
      {/* Navigation */}
      <CalendarNav
        month={month}
        year={year}
        onPrev={() => onDateChange(new Date(year, month - 1, 1))}
        onNext={() => onDateChange(new Date(year, month + 1, 1))}
        onMonthChange={(m) => onDateChange(new Date(year, m, 1))}
        onYearChange={(y) => onDateChange(new Date(y, month, 1))}
      />

      {/* Calendar Grid */}
      <div className="bg-white rounded-xl overflow-hidden shadow-sm border border-gray-200">
        {/* Day-of-week headers */}
        <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50/80">
          {THAI_DAYS_SHORT.map((d) => (
            <div
              key={d}
              className="text-center text-gray-500 font-bold py-3.5 text-[13px] tracking-wide border-r border-gray-200 last:border-r-0"
            >
              {d}
            </div>
          ))}
        </div>

        {/* Day cells */}
        <div className="grid grid-cols-7">
          {cells.map((c, i) => (
            <div
              key={i}
              onClick={() => c.isCurrentMonth && onDayClick?.(c.day, c.dateStr)}
              className={`min-h-[130px] border-b border-r border-gray-200 p-2 flex flex-col transition-colors ${
                c.isCurrentMonth ? "bg-white hover:bg-blue-50/30" : "bg-gray-50/40"
              } ${c.isCurrentMonth && onDayClick ? "cursor-pointer" : ""}`}
            >
              {/* Day number */}
              <div className="flex justify-end mb-1 px-1 pt-0.5">
                <div
                  className={`w-8 h-8 flex items-center justify-center rounded-full text-[14px] font-bold ${
                    c.isToday ? "border-2 border-blue-500 text-blue-700" : ""
                  } ${c.isCurrentMonth ? "text-gray-700" : "text-gray-300"}`}
                >
                  {c.day}
                </div>
              </div>

              {/* Custom content */}
              {c.isCurrentMonth && renderDayContent && (
                <div className="flex-1 flex flex-col gap-1.5 px-1">
                  {renderDayContent(c.day, c.dateStr)}
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ThaiMonthPicker — Popup month picker (สำหรับหน้าประวัติการลา)
// ═══════════════════════════════════════════════════════════════
export interface ThaiMonthPickerProps {
  value: string; // YYYY-MM
  onChange: (value: string) => void;
  className?: string; // For the trigger button
}

export function ThaiMonthPicker({ value, onChange, className }: ThaiMonthPickerProps) {
  const [open, setOpen] = useState(false);
  const [popupPos, setPopupPos] = useState<'bottom' | 'top'>('bottom');
  const [tempYear, setTempYear] = useState(() => value ? parseInt(value.split('-')[0]) : new Date().getFullYear());
  const ref = useRef<HTMLDivElement>(null);

  const formatMonthYear = (yyyyMM: string) => {
    if (!yyyyMM) return "";
    const [year, month] = yyyyMM.split('-');
    return `${THAI_MONTHS[parseInt(month) - 1]} ${parseInt(year) + 543}`;
  };

  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [open]);

  useEffect(() => {
    if (open && value) {
      setTempYear(parseInt(value.split('-')[0]));
    }
  }, [open, value]);

  return (
    <div className="relative inline-block" ref={ref}>
      <button
        type="button"
        onClick={() => {
          if (!open && ref.current) {
            const rect = ref.current.getBoundingClientRect();
            const spaceBelow = window.innerHeight - rect.bottom;
            if (spaceBelow < 300) {
              setPopupPos('top');
            } else {
              setPopupPos('bottom');
            }
          }
          setOpen((o) => !o);
        }}
        className={
          className ||
          "w-full border border-gray-300 rounded-md px-3 py-2.5 text-[14px] outline-none hover:border-blue-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 bg-white shadow-sm transition-all text-gray-700 cursor-pointer flex items-center justify-between min-w-[200px]"
        }
      >
        <span>{formatMonthYear(value)}</span>
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" className="text-gray-400 ml-2"><rect width="18" height="18" x="3" y="4" rx="2" ry="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/></svg>
      </button>

      {open && (
        <div className={`absolute left-0 z-[9999] bg-white border border-gray-200 rounded-xl shadow-2xl p-5 w-[340px] animate-in fade-in zoom-in-95 duration-200 ${
          popupPos === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
        }`}>
          <div className="flex items-center justify-between mb-5 px-1">
            <button type="button" onClick={() => setTempYear(y => y - 1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m15 18-6-6 6-6" /></svg>
            </button>
            <span className="font-bold text-lg text-black tracking-wide">{tempYear + 543}</span>
            <button type="button" onClick={() => setTempYear(y => y + 1)} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 hover:text-black">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"><path d="m9 18 6-6-6-6" /></svg>
            </button>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."].map((m, i) => {
              const isSelected = value === `${tempYear}-${(i + 1).toString().padStart(2, '0')}`;
              return (
                <button
                  type="button"
                  key={m}
                  onClick={() => {
                    onChange(`${tempYear}-${(i + 1).toString().padStart(2, '0')}`);
                    setOpen(false);
                  }}
                  className={`py-2.5 rounded-xl text-[14px] font-bold transition-all ${isSelected
                      ? 'bg-blue-600 text-white shadow-md shadow-blue-600/20'
                      : 'text-gray-600 hover:bg-blue-50 hover:text-blue-700'
                    }`}
                >
                  {m}
                </button>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
