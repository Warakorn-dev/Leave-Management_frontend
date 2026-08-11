// @ts-nocheck
'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { DatePicker as MuiDatePicker } from '@mui/x-date-pickers/DatePicker';
import { StaticDatePicker } from '@mui/x-date-pickers/StaticDatePicker';
import { MobileDatePicker } from '@mui/x-date-pickers/MobileDatePicker';
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

// Common styles to enforce EPP's premium purple design
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
  '& .MuiPickersCalendarHeader-root': {
    position: 'relative',
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
export interface DatePickerProps {
  [x: string]: any;
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
              slotProps={{
                actionBar: { actions: [] }, // Remove cancel/ok buttons for clean inline calendar
                toolbar: { toolbarTitle: 'BASIC', hidden: false },
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
            }}
            {...props}
          />
        );
    }
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
