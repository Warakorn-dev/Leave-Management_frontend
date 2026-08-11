// @ts-nocheck
'use client';

import React, { useRef, useEffect } from 'react';
import { Box, Typography, Button } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DateTimePicker as MuiDateTimePicker } from '@mui/x-date-pickers/DateTimePicker';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import customParseFormat from 'dayjs/plugin/customParseFormat';
import buddhistEra from 'dayjs/plugin/buddhistEra';

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

// Styling matching EPP's signature purple theme
const pickerStyles = {
  '& .MuiOutlinedInput-root': {
    borderRadius: 2,
    bgcolor: 'background.paper',
    height: 38,
    transition: 'all 0.2s',
    '&:hover': {
      borderColor: '#6b38fb',
    },
    '&.Mui-focused': {
      borderColor: '#6b38fb',
      boxShadow: '0 0 0 2px rgba(107, 56, 251, 0.2)',
    },
  },
};

const layoutStyles = (theme) => ({
  '& .MuiPickersLayout-root': {
    borderRadius: 3,
    overflow: 'hidden',
    boxShadow: theme.palette.mode === 'dark' ? '0 8px 32px rgba(0,0,0,0.5)' : '0 8px 32px rgba(0,0,0,0.08)',
    border: `1px solid ${theme.palette.divider}`,
    backgroundColor: theme.palette.background.paper,
  },
  '& .MuiPickersToolbar-root': {
    backgroundColor: '#6b38fb',
    color: '#ffffff',
    '& *': {
      color: '#ffffff !important',
    },
  },
  '& .MuiPickersCalendarHeader-label': {
    fontWeight: 'bold',
    color: theme.palette.text.primary,
  },
  '& .MuiPickersArrowSwitcher-button': {
    color: '#6b38fb',
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
      backgroundColor: theme.palette.mode === 'dark' ? '#3b3b3b' : '#f3e5f5',
    },
    '&.Mui-selected': {
      backgroundColor: '#6b38fb !important',
      color: '#ffffff !important',
      '&:hover': {
        backgroundColor: '#5521e6 !important',
      },
    },
    '&.MuiPickersDay-today': {
      borderColor: '#6b38fb',
      '&:not(.Mui-selected)': {
        color: '#6b38fb',
      },
    },
  },
  '& .MuiDialogActions-root .MuiButton-root': {
    color: '#6b38fb',
    fontWeight: 'bold',
  },
});

// Generate time slots helper
const generateTimeSlots = (start = '00:00', end = '23:45', interval = 15) => {
  const slots = [];
  let current = dayjs(`2020-01-01 ${start}`, 'YYYY-MM-DD HH:mm');
  const targetEnd = dayjs(`2020-01-01 ${end}`, 'YYYY-MM-DD HH:mm');
  while (current.isBefore(targetEnd) || current.isSame(targetEnd)) {
    slots.push(current.format('HH:mm'));
    current = current.add(interval, 'minute');
  }
  return slots;
};

/**
 * Premium custom DateTimePicker component with support for standard popover,
 * and high-fidelity side-by-side inline calendar and time slot picker.
 *
 * @param {object} props
 * @param {dayjs.Dayjs | string | null} props.value - Selected date & time
 * @param {function} props.onChange - Callback triggered on change
 * @param {'default' | 'inline'} [props.variant='default'] - Picker layout variant
 * @param {string} [props.label] - Field label
 * @param {string} [props.format='DD/MM/YYYY HH:mm'] - Output date-time format
 * @param {string} [props.placeholder='วว/ดด/ปปปป นน:นน'] - Textfield placeholder
 * @param {boolean} [props.fullWidth=true] - Make input full width
 * @param {boolean} [props.disabled=false] - Disable input
 * @param {string} [props.timeStart='00:00'] - Start time for side-by-side slot picker
 * @param {string} [props.timeEnd='23:45'] - End time for side-by-side slot picker
 * @param {number} [props.timeInterval=15] - Minutes interval between slots
 */
export interface DateTimePickerProps {
  [x: string]: any;
  value?: any;
  onChange?: (date: any) => void;
  variant?: 'default' | 'inline';
  label?: React.ReactNode;
  format?: string;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
  timeStart?: string;
  timeEnd?: string;
  timeInterval?: number;
}

export default function DateTimePicker({
  value,
  onChange,
  variant = 'default',
  label,
  format = 'DD/MM/YYYY HH:mm',
  placeholder = 'วว/ดด/ปปปป นน:นน',
  fullWidth = true,
  disabled = false,
  timeStart = '00:00',
  timeEnd = '23:45',
  timeInterval = 15,
  ...props
}: DateTimePickerProps) {
  const cleanValue = typeof value === 'string' ? value.replace('.', ':').trim() : value;
  const dateValue = cleanValue
    ? dayjs.isDayjs(cleanValue)
      ? cleanValue
      : dayjs(cleanValue, format)
    : null;
  const activeTimeStr = dateValue ? dateValue.format('HH:mm') : '';

  const scrollContainerRef = useRef(null);

  const handleDateChange = (newDate) => {
    if (!newDate) {
      if (onChange) onChange(null);
      return;
    }
    let updatedDate = newDate;
    if (dateValue) {
      updatedDate = updatedDate
        .hour(dateValue.hour())
        .minute(dateValue.minute());
    } else {
      updatedDate = updatedDate.hour(12).minute(0); // Default to noon if no time set yet
    }
    if (onChange) onChange(updatedDate);
  };

  const handleTimeSelect = (timeStr) => {
    const [hours, minutes] = timeStr.split(':').map(Number);
    const baseDate = dateValue || dayjs();
    const updatedDate = baseDate.hour(hours).minute(minutes);
    if (onChange) onChange(updatedDate);
  };

  // Auto-scroll selected time slot into view when variant is inline
  useEffect(() => {
    if (variant === 'inline' && activeTimeStr && scrollContainerRef.current) {
      const selectedEl = scrollContainerRef.current.querySelector(
        '[data-selected="true"]'
      );
      if (selectedEl) {
        selectedEl.scrollIntoView({ block: 'nearest', behavior: 'smooth' });
      }
    }
  }, [activeTimeStr, variant]);

  const renderPicker = () => {
    if (variant === 'inline') {
      const slots = generateTimeSlots(timeStart, timeEnd, timeInterval);
      return (
        <Box
          sx={{
            display: 'inline-flex',
            flexDirection: { xs: 'column', sm: 'row' },
            border: '1px solid',
            borderColor: 'divider',
            borderRadius: 3,
            boxShadow: '0 8px 32px rgba(0,0,0,0.06)',
            overflow: 'hidden',
            bgcolor: 'background.paper',
            maxWidth: '100%',
          }}
        >
          {/* Left: Static calendar */}
          <Box
            sx={(theme) => ({
              ...layoutStyles(theme),
              '& .MuiPickersLayout-root': {
                border: 'none',
                boxShadow: 'none',
                borderRadius: 0,
              },
            })}
          >
            <StaticDatePicker
              value={dateValue}
              onChange={handleDateChange}
              disabled={disabled}
              slotProps={{
                actionBar: { actions: [] },
              }}
              {...props}
            />
          </Box>

          {/* Right: Scrollable time slot picker */}
          <Box
            sx={{
              width: { xs: '100%', sm: 140 },
              borderLeft: { sm: '1px solid', sm: '1px solid divider' },
              borderTop: { xs: '1px solid', xs: '1px solid divider', sm: 'none' },
              borderColor: 'divider',
              display: 'flex',
              flexDirection: 'column',
              maxHeight: { xs: 200, sm: 340 },
            }}
          >
            <Box
              sx={{
                p: 1.5,
                borderBottom: '1px solid',
                borderColor: 'divider',
                textAlign: 'center',
                bgcolor: 'action.hover',
              }}
            >
              <Typography
                variant="caption"
                fontWeight="bold"
                sx={{
                  color: 'text.secondary',
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                }}
              >
                Time Input
              </Typography>
            </Box>
            <Box
              ref={scrollContainerRef}
              sx={{
                overflowY: 'auto',
                flexGrow: 1,
                p: 1,
                display: 'flex',
                flexDirection: { xs: 'row', sm: 'column' },
                flexWrap: { xs: 'wrap', sm: 'nowrap' },
                gap: 0.5,
              }}
            >
              {slots.map((slot) => {
                const isSelected = activeTimeStr === slot;
                return (
                  <Button
                    key={slot}
                    size="small"
                    variant={isSelected ? 'contained' : 'text'}
                    data-selected={isSelected}
                    onClick={() => handleTimeSelect(slot)}
                    disabled={disabled}
                    sx={{
                      minWidth: { xs: 70, sm: '100%' },
                      py: 1,
                      borderRadius: 1.5,
                      fontWeight: isSelected ? 'bold' : 'normal',
                      color: isSelected ? '#ffffff' : 'text.primary',
                      bgcolor: isSelected
                        ? '#6b38fb !important'
                        : 'transparent',
                      '&:hover': {
                        bgcolor: isSelected ? '#5521e6 !important' : '#f3e5f5',
                        color: isSelected ? '#ffffff' : 'primary.main',
                      },
                    }}
                  >
                    {slot}
                  </Button>
                );
              })}
            </Box>
          </Box>
        </Box>
      );
    }

    return (
      <MuiDateTimePicker
        value={dateValue}
        onChange={handleDateChange}
        disabled={disabled}
        format={format}
        slotProps={{
          textField: {
            size: 'small',
            fullWidth: fullWidth,
            placeholder: placeholder,
            sx: pickerStyles,
          },
          layout: {
            sx: layoutStyles,
          },
        }}
        {...props}
      />
    );
  };

  return (
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
  );
}
