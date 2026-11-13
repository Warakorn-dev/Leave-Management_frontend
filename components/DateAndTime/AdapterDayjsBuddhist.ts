/* eslint-disable @typescript-eslint/ban-ts-comment -- MUI X Date Pickers' adapter typings do not allow reassigning formatTokenMap/formats/parse; the original copies of this class in DatePicker/DateTimePicker needed the same escape hatch. */
// @ts-nocheck
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import buddhistEra from 'dayjs/plugin/buddhistEra';

dayjs.extend(customParseFormat);
dayjs.extend(buddhistEra);

/**
 * MUI date adapter that shows years in the Buddhist era (BBBB, e.g. 2569).
 *
 * dayjs's buddhistEra plugin only FORMATS BBBB; it cannot parse it. Parsing
 * "05/01/2570" with a BBBB token ignores the typed year and falls back to the
 * current one, so a date field only ever accepted the current year (the year
 * could not be typed, and the arrow keys stopped at it). `parse` therefore
 * converts the typed Buddhist year to Gregorian and parses it with YYYY.
 */
export class AdapterDayjsBuddhist extends AdapterDayjs {
  constructor(options) {
    super(options);
    this.formatTokenMap = {
      ...this.formatTokenMap,
      BBBB: 'year',
      BB: 'year',
    };
    this.formats = {
      ...this.formats,
      year: 'BBBB',
      monthAndYear: 'MMMM BBBB',
      keyboardDate: 'DD/MM/BBBB',
    };

    // The adapter's methods are instance properties, not prototype methods,
    // so keep the original and wrap it (`super.parse` does not exist).
    const parseGregorian = this.parse;
    this.parse = (value, format) => {
      if (!value || !format.includes('BBBB')) return parseGregorian(value, format);

      const gregorianFormat = format.replace('BBBB', 'YYYY');
      // BBBB is the last number in every format used here (DD/MM/BBBB, MM/BBBB).
      const year = /(\d{4})(?!.*\d)/.exec(value);
      if (!year) return parseGregorian(value, gregorianFormat); // incomplete: invalid
      const gregorian = String(Number(year[1]) - 543).padStart(4, '0');
      return parseGregorian(
        value.slice(0, year.index) + gregorian + value.slice(year.index + 4),
        gregorianFormat,
      );
    };
  }
}
