// @ts-nocheck
"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Box, Typography, createTheme, ThemeProvider } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import buddhistEra from 'dayjs/plugin/buddhistEra';
import { PickerDay, PickerDayProps } from '@mui/x-date-pickers/PickerDay';
import { Badge } from '@mui/material';
import { useHolidaysQuery } from '@/hooks/useLeave';

// Initialize dayjs plugins
dayjs.extend(customParseFormat);
dayjs.extend(buddhistEra);

class AdapterDayjsBuddhist extends AdapterDayjs {
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
  }
}

// Common styles with Sarabun font
const pickerStyles = {
  fontFamily: 'var(--font-sarabun), Sarabun, system-ui, sans-serif',
  '& .MuiOutlinedInput-root': {
    fontFamily: 'var(--font-sarabun), Sarabun, system-ui, sans-serif',
    borderRadius: 2,
    bgcolor: 'background.paper',
    height: 38,
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: '#2563eb',
    },
    '&.Mui-focused': {
      borderColor: '#2563eb',
      boxShadow: '0 0 0 2px rgba(37, 99, 235, 0.2)',
    },
  },
  '& .MuiInputBase-input': {
    fontFamily: 'var(--font-sarabun), Sarabun, system-ui, sans-serif',
    fontSize: '0.875rem',
  },
};

const layoutStyles = (theme) => ({
  fontFamily: 'var(--font-sarabun), Sarabun, system-ui, sans-serif',
  '& *': {
    fontFamily: 'var(--font-sarabun), Sarabun, system-ui, sans-serif !important',
  },
  '& .MuiPickersLayout-root': {
    fontFamily: 'var(--font-sarabun), Sarabun, system-ui, sans-serif',
    borderRadius: 3,
    overflow: 'hidden',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.08)',
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  '& .MuiPickersToolbar-root': {
    backgroundColor: '#2563eb',
    color: '#ffffff',
    '& *': {
      color: '#ffffff !important',
    },
  },
  '& .MuiPickersCalendarHeader-root': {
    position: 'relative',
  },
  '& .MuiPickersCalendarHeader-label': {
    fontWeight: 'bold',
    color: theme.palette.text.primary,
  },
  '& .MuiPickersArrowSwitcher-button': {
    color: '#2563eb',
  },
  '& .MuiDayCalendar-weekHeader .MuiTypography-root': {
    fontWeight: 'bold',
    color: theme.palette.text.secondary,
  },
  '& .MuiPickersDay-root': {
    fontWeight: 500,
    borderRadius: '50%',
    color: theme.palette.text.primary,
    '&:hover': {
      backgroundColor: theme.palette.mode === 'dark' ? '#3b3b3b' : '#eff6ff',
    },
    '&.Mui-selected': {
      backgroundColor: '#2563eb !important',
      color: '#ffffff !important',
      '&:hover': {
        backgroundColor: '#1d4ed8 !important',
      },
    },
    '&.MuiPickersDay-today': {
      borderColor: '#2563eb',
      '&:not(.Mui-selected)': {
        color: '#2563eb',
      },
    },
  },
  '& .MuiDialogActions-root .MuiButton-root': {
    color: '#2563eb',
    fontWeight: 'bold',
    borderRadius: 2,
    px: 2,
  },
});

/**
 * Premium custom DatePicker component with support for standard popover,
 * inline static calendar, and modal dialog configurations.
 *
 * @param {object} props
 * @param {dayjs.Dayjs | string | null} props.value - Selected date
 * @param {function} props.onChange - Callback triggered on date change
 * @param {'default' | 'inline' | 'modal'} [props.variant='default'] - Picker layout variant
 * @param {string} [props.label] - Field label
 * @param {string} [props.format='DD/MM/YYYY'] - Output date format
 * @param {string} [props.placeholder='วว/ดด/ปปปป'] - Textfield placeholder
 * @param {boolean} [props.fullWidth=true] - Make input full width
 * @param {boolean} [props.disabled=false] - Disable input
 */
function CustomDay(props: PickerDayProps<dayjs.Dayjs> & { holidays?: any[] }) {
  const { day, outsideCurrentMonth, holidays = [], ...other } = props;

  // Formatting day into YYYY-MM-DD for comparison (year is Gregorian here)
  const dateStr = day.format('YYYY-MM-DD');

  const isHoliday = !outsideCurrentMonth && holidays.some((h: any) => {
    const hDateStr = h.date || h.holidayDate || h.startDate || h;
    const formattedHDate = typeof hDateStr === 'string' ? hDateStr.substring(0, 10) : '';
    return dateStr === formattedHDate;
  });

  return (
    <Badge
      key={day.toString()}
      overlap="circular"
      badgeContent={isHoliday ? " " : undefined}
      sx={{
        '& .MuiBadge-badge': {
          backgroundColor: isHoliday ? '#ef4444' : 'transparent',
          width: 6,
          height: 6,
          minWidth: 0,
          borderRadius: '50%',
          padding: 0,
          bottom: 4, 
          right: '50%',
          transform: 'translateX(50%)',
          boxShadow: isHoliday ? '0 0 0 1px #fff' : 'none',
        }
      }}
    >
      <PickerDay {...other} outsideCurrentMonth={outsideCurrentMonth} day={day} />
    </Badge>
  );
}

export interface DatePickerProps {
  value?: any;
  selected?: any;
  onChange?: (date: any) => void;
  variant?: 'default' | 'inline' | 'modal';
  label?: React.ReactNode;
  format?: string;
  placeholder?: string;
  placeholderText?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  minDate?: any;
  maxDate?: any;
  [key: string]: any;
}

export default function DatePicker({
  value,
  selected, // Backwards compatibility with ThaiDatePicker
  onChange,
  variant = 'default',
  label,
  format = 'DD/MM/BBBB', // Default to Buddhist Era
  placeholder,
  placeholderText, // Backwards compatibility
  fullWidth = true,
  disabled = false,
  minDate,
  maxDate,
  ...props
}: DatePickerProps) {
  const actualValue = value !== undefined ? value : selected;
  const actualPlaceholder = placeholder || placeholderText || 'วว/ดด/ปปปป';

  // Ensure dayjs object
  const dateValue = actualValue
    ? dayjs.isDayjs(actualValue)
      ? actualValue
      : dayjs(actualValue)
    : null;

  // Convert minDate/maxDate if they are Date objects
  const parsedMinDate = minDate ? dayjs(minDate) : undefined;
  const parsedMaxDate = maxDate ? dayjs(maxDate) : undefined;

  const [isDark, setIsDark] = useState(false);

  useEffect(() => {
    const checkDark = () => {
      setIsDark(document.documentElement.classList.contains('dark'));
    };
    checkDark();
    const observer = new MutationObserver(checkDark);
    observer.observe(document.documentElement, { attributes: true, attributeFilter: ['class'] });
    return () => observer.disconnect();
  }, []);

  const muiTheme = useMemo(() => {
    return createTheme({
      palette: {
        mode: isDark ? 'dark' : 'light',
        primary: {
          main: '#2563eb',
        },
        background: {
          paper: isDark ? '#111827' : '#ffffff',
          default: isDark ? '#0b1120' : '#ffffff',
        },
        text: {
          primary: isDark ? '#f8fafc' : '#1e293b',
          secondary: isDark ? '#cbd5e1' : '#64748b',
        },
        divider: isDark ? 'rgba(255, 255, 255, 0.12)' : 'rgba(0, 0, 0, 0.12)',
      },
      typography: {
        fontFamily: 'var(--font-sarabun), "Sarabun", system-ui, -apple-system, sans-serif',
      },
    });
  }, [isDark]);

  const { data: holidaysData = [] } = useHolidaysQuery();

  const handleDateChange = (newValue) => {
    if (onChange) {
      if (newValue && dayjs.isDayjs(newValue)) {
        if (props.views && props.views.length === 2 && props.views.includes('year') && props.views.includes('month')) {
           // If it's a month picker (like ThaiMonthPicker), return YYYY-MM
           onChange(newValue.format('YYYY-MM'));
        } else if (selected !== undefined) {
           // If used as ThaiDatePicker, return a Date object
           onChange(newValue.toDate());
        } else {
           onChange(newValue);
        }
      } else {
        onChange(newValue);
      }
    }
  };

  const renderPicker = () => {
    switch (variant) {
      case 'inline':
        return (
          <Box sx={(theme) => ({ maxWidth: 360, ...layoutStyles(theme) })}>
            <StaticDatePicker
              value={dateValue}
              onChange={handleDateChange}
              disabled={disabled}
              minDate={parsedMinDate}
              maxDate={parsedMaxDate}
              views={props.views || ['year', 'month', 'day']}
              openTo={props.openTo || 'day'}
              slots={{
                day: CustomDay,
              }}
              slotProps={{
                actionBar: { actions: [] }, // Remove cancel/ok buttons for clean inline calendar
                toolbar: { toolbarTitle: 'BASIC', hidden: false },
                day: { holidays: holidaysData } as any,
              }}
              {...props}
            />
          </Box>
        );
      case 'modal':
        return (
          <MobileDatePicker
            value={dateValue}
            onChange={handleDateChange}
            disabled={disabled}
            format={format}
            minDate={parsedMinDate}
            maxDate={parsedMaxDate}
            views={props.views || ['year', 'month', 'day']}
            openTo={props.openTo || 'day'}
            slots={{
              day: CustomDay,
            }}
            slotProps={{
              toolbar: {
                toolbarTitle: 'BASIC',
                hidden: false,
              },
              textField: {
                size: 'small',
                fullWidth: fullWidth,
                placeholder: actualPlaceholder,
                sx: pickerStyles,
              },
              layout: {
                sx: layoutStyles,
              },
              dialog: {
                PaperProps: {
                  sx: {
                    borderRadius: 3,
                    overflow: 'hidden',
                  },
                },
              },
              day: { holidays: holidaysData } as any,
            }}
            {...props}
          />
        );
      case 'default':
      default:
        return (
          <MuiDatePicker
            value={dateValue}
            onChange={handleDateChange}
            disabled={disabled}
            format={format}
            minDate={parsedMinDate}
            maxDate={parsedMaxDate}
            views={props.views || ['year', 'month', 'day']}
            openTo={props.openTo || 'day'}
            slots={{
              day: CustomDay,
            }}
            slotProps={{
              textField: {
                size: 'small',
                fullWidth: fullWidth,
                placeholder: actualPlaceholder,
                sx: pickerStyles,
              },
              layout: {
                sx: layoutStyles,
              },
              day: { holidays: holidaysData } as any,
            }}
            {...props}
          />
        );
    }
  };

  return (
    <ThemeProvider theme={muiTheme}>
      <LocalizationProvider dateAdapter={AdapterDayjsBuddhist} adapterLocale="th">
        <Box sx={{ width: '100%' }}>
          {label && (
            <Typography
              variant="body2"
              fontWeight="bold"
              sx={{ mb: 0.5, color: 'text.primary' }}
            >
              {label}
            </Typography>
          )}
          {renderPicker()}
        </Box>
      </LocalizationProvider>
    </ThemeProvider>
  );
}
