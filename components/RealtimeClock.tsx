"use client";

import { useState, useEffect } from "react";
import { Clock, Calendar } from "lucide-react";

export function RealtimeClock() {
  const [now, setNow] = useState<Date | null>(null);

  useEffect(() => {
    setNow(new Date());
    const timer = setInterval(() => {
      setNow(new Date());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  if (!now) {
    return (
      <div className="h-8 w-44 bg-slate-100 dark:bg-slate-800 animate-pulse rounded-full" />
    );
  }

  const thaiDays = ["วันอาทิตย์", "วันจันทร์", "วันอังคาร", "วันพุธ", "วันพฤหัสบดี", "วันศุกร์", "วันเสาร์"];
  const thaiMonths = ["ม.ค.", "ก.พ.", "มี.ค.", "เม.ย.", "พ.ค.", "มิ.ย.", "ก.ค.", "ส.ค.", "ก.ย.", "ต.ค.", "พ.ย.", "ธ.ค."];

  const dayName = thaiDays[now.getDay()];
  const dateNum = now.getDate();
  const monthName = thaiMonths[now.getMonth()];
  const thaiYear = now.getFullYear() + 543;

  const hours = String(now.getHours()).padStart(2, "0");
  const minutes = String(now.getMinutes()).padStart(2, "0");
  const seconds = String(now.getSeconds()).padStart(2, "0");

  return (
    <div className="flex items-center gap-2 sm:gap-3 bg-[#F4F6F9] dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-800 border border-slate-200/90 dark:border-slate-700 px-3 sm:px-4 py-1.5 rounded-full shadow-sm transition-colors text-slate-700 dark:text-slate-200 select-none">
      {/* Date */}
      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-semibold text-slate-700 dark:text-slate-200">
        <Calendar className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={2.5} />
        <span className="hidden md:inline">{dayName} </span>
        <span>{dateNum} {monthName} {thaiYear}</span>
      </div>

      <div className="w-[1px] h-3.5 bg-slate-300 dark:bg-slate-600 shrink-0" />

      {/* Time */}
      <div className="flex items-center gap-1.5 text-xs sm:text-[13px] font-bold font-mono text-blue-600 dark:text-blue-400 shrink-0">
        <Clock className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" strokeWidth={2.5} />
        <span>{hours}:{minutes}:{seconds}</span>
      </div>
    </div>
  );
}
