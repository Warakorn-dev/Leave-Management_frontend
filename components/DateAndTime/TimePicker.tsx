// @ts-nocheck
'use client';

import React from 'react';
import { Box, Typography } from '@mui/material';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import { TimePicker as MuiTimePicker } from '@mui/x-date-pickers/TimePicker';
import { StaticTimePicker } from '@mui/x-date-pickers/StaticTimePicker';
import { MobileTimePicker } from '@mui/x-date-pickers/MobileTimePicker';
import dayjs from 'dayjs';
import 'dayjs/locale/th';
import customParseFormat from 'dayjs/plugin/customParseFormat';

// Initialize dayjs plugins
dayjs.extend(customParseFormat);

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
    boxShadow:
      theme.palette.mode === 'dark'
        ? '0 8px 32px rgba(0,0,0,0.5)'
        : '0 8px 32px rgba(0,0,0,0.08)',
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
  '& .MuiClock-clock': {
    backgroundColor: theme.palette.mode === 'dark' ? '#2d2d2d' : '#f5f5f5',
  },
  '& .MuiClock-pin': {
    backgroundColor: '#6b38fb',
  },
  '& .MuiClockPointer-root': {
    backgroundColor: '#6b38fb',
  },
  '& .MuiClockPointer-thumb': {
    borderColor: '#6b38fb',
    backgroundColor: '#6b38fb',
  },
  '& .MuiClockNumber-selectAnimate': {
    fontSize: '0.9rem',
    color: theme.palette.text.primary,
    '&.Mui-selected': {
      color: '#ffffff !important',
      backgroundColor: '#6b38fb',
    },
  },
  '& .MuiTimePickerToolbar-ampmSelection .MuiTimePickerToolbar-ampmLabelActive':
  {
    color: '#ffffff',
    fontWeight: 'bold',
  },
  '& .MuiDialogActions-root .MuiButton-root': {
    color: '#6b38fb',
    fontWeight: 'bold',
    borderRadius: 2,
    px: 2,
  },
});

/**
 * Premium custom TimePicker component with support for standard popover,
 * inline clock dial, and modal dialog configurations.
 *
 * @param {object} props
 * @param {dayjs.Dayjs | string | null} props.value - Selected time
 * @param {function} props.onChange - Callback triggered on change
 * @param {'default' | 'inline' | 'modal'} [props.variant='default'] - Picker layout variant
 * @param {string} [props.label] - Field label
 * @param {string} [props.format='HH:mm'] - Output time format
 * @param {string} [props.placeholder='นน:นน'] - Textfield placeholder
 * @param {boolean} [props.fullWidth=true] - Make input full width
 * @param {boolean} [props.disabled=false] - Disable input
 */
export interface TimePickerProps {
  [x: string]: any;
  value?: any;
  onChange?: (date: any) => void;
  variant?: 'default' | 'inline' | 'modal';
  label?: React.ReactNode;
  format?: string;
  placeholder?: string;
  fullWidth?: boolean;
  disabled?: boolean;
}

export default function TimePicker({
  value,
  onChange,
  variant = 'default',
  label,
  format = 'HH:mm',
  placeholder = 'นน:นน',
  fullWidth = true,
  disabled = false,
  ...props
}: TimePickerProps) {
  // Ensure dayjs object and normalize string separators (e.g., '08.00' -> '08:00')
  const cleanValue = typeof value === 'string' ? value.replace('.', ':').trim() : value;
  const timeValue = cleanValue
    ? dayjs.isDayjs(cleanValue)
      ? cleanValue
      : dayjs(`2020-01-01 ${cleanValue}`, `YYYY-MM-DD ${format}`)
    : null;

  const handleTimeChange = (newValue) => {
    if (onChange) {
      onChange(newValue);
    }
  };

  const renderPicker = () => {
    switch (variant) {
      case 'inline':
        return (
          <Box sx={(theme) => ({ maxWidth: 320, ...layoutStyles(theme) })}>
            <StaticTimePicker
              value={timeValue}
              onChange={handleTimeChange}
              disabled={disabled}
              slotProps={{
                actionBar: { actions: [] }, // Remove cancel/ok buttons for clean inline card
                toolbar: { toolbarTitle: 'BASIC', hidden: false },
              }}
              {...props}
            />
          </Box>
        );
      case 'modal':
      case 'default':
      default:
        return (
          <MobileTimePicker
            value={timeValue}
            onChange={handleTimeChange}
            disabled={disabled}
            format={format}
            slotProps={{
              toolbar: {
                toolbarTitle: 'BASIC',
                hidden: false,
              },
              textField: {
                size: 'small',
                fullWidth: fullWidth,
                placeholder: placeholder,
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
    }
  };

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="th">
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
