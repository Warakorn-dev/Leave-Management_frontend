// Leave-day helpers used by lib/leaveDuration.ts and the HR leave-request page.
// D-09 (14 ต.ค. 2569): the old mock-era API helpers that lived here (/api/leaves,
// /api/users, /api/dashboard/stats, ... — none exist in the backend, none were
// used) were removed. Real holidays come from the backend (/leave/holidays,
// /hr/holidays); the lists below are only the fallback when none are passed in.

// Fixed Thai public holidays (MM-DD)
export const FIXED_HOLIDAYS = [
  { monthDay: '01-01', title: 'วันขึ้นปีใหม่' },
  { monthDay: '04-06', title: 'วันจักรี' },
  { monthDay: '04-13', title: 'วันสงกรานต์' },
  { monthDay: '04-14', title: 'วันสงกรานต์' },
  { monthDay: '04-15', title: 'วันสงกรานต์' },
  { monthDay: '05-01', title: 'วันแรงงานแห่งชาติ' },
  { monthDay: '05-04', title: 'วันฉัตรมงคล' },
  { monthDay: '07-28', title: 'วันเฉลิมพระชนมพรรษา ร.10' },
  { monthDay: '08-12', title: 'วันแม่แห่งชาติ' },
  { monthDay: '10-13', title: 'วันคล้ายวันสวรรคต ร.9' },
  { monthDay: '10-23', title: 'วันปิยมหาราช' },
  { monthDay: '12-05', title: 'วันพ่อแห่งชาติ' },
  { monthDay: '12-10', title: 'วันรัฐธรรมนูญ' },
  { monthDay: '12-31', title: 'วันสิ้นปี' },
];

// Floating Thai public holidays (YYYY-MM-DD) like Buddhist holidays
export const FLOATING_HOLIDAYS = [
  { date: '2026-03-03', title: 'วันมาฆบูชา' },
  { date: '2026-05-31', title: 'วันวิสาขบูชา' },
  { date: '2026-07-29', title: 'วันอาสาฬหบูชา' },
  { date: '2026-07-30', title: 'วันเข้าพรรษา' },
];

export const getPublicHolidays = (year: number) => {
  const fixed = FIXED_HOLIDAYS.map(h => ({
    date: `${year}-${h.monthDay}`,
    title: h.title
  }));
  const floating = FLOATING_HOLIDAYS.filter(h => h.date.startsWith(`${year}-`));
  return [...fixed, ...floating];
};

const checkIsHoliday = (
  d: Date,
  customHolidays?: { date?: string }[],
): boolean => {
  if (customHolidays && customHolidays.length > 0) {
    const dTime = new Date(d);
    dTime.setHours(0, 0, 0, 0);
    return customHolidays.some(h => {
      if (!h.date) return false;
      const hDate = new Date(h.date);
      hDate.setHours(0, 0, 0, 0);
      return hDate.getTime() === dTime.getTime();
    });
  }

  const md = `${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
  const ymd = `${d.getFullYear()}-${md}`;
  return FIXED_HOLIDAYS.some(h => h.monthDay === md) || FLOATING_HOLIDAYS.some(h => h.date === ymd);
};

export const calculateLeaveDays = (startDate: string, endDate: string, startFormat?: string, endFormat?: string, customHolidays?: { date?: string }[]): number => {
  const s = new Date(startDate);
  const e = new Date(endDate);
  if (isNaN(s.getTime()) || isNaN(e.getTime())) return 1;
  if (s > e) return 0;

  let count = 0;
  const current = new Date(s);
  while (current <= e) {
    const dayOfWeek = current.getDay();

    // 0 = Sunday, 6 = Saturday
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
    const isHoliday = checkIsHoliday(current, customHolidays);

    if (!isWeekend && !isHoliday) {
      count++;
    }
    current.setDate(current.getDate() + 1);
  }

  if (count === 0) return 0; // if only requested on weekends/holidays

  const isSWeekendOrHoliday = s.getDay() === 0 || s.getDay() === 6 || checkIsHoliday(s, customHolidays);
  const isEWeekendOrHoliday = e.getDay() === 0 || e.getDay() === 6 || checkIsHoliday(e, customHolidays);

  if (s.getTime() === e.getTime()) {
    if ((startFormat === 'morning' || startFormat === 'afternoon') && !isSWeekendOrHoliday) {
      count -= 0.5;
    }
  } else {
    if (startFormat === 'afternoon' && !isSWeekendOrHoliday) {
      count -= 0.5;
    }
    if (endFormat === 'morning' && !isEWeekendOrHoliday) {
      count -= 0.5;
    }
  }

  return Math.max(0, count);
};
