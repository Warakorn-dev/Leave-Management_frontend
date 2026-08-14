// @ts-nocheck
'use client';

import React, { useState } from 'react';
import {
  Box,
  Typography,
  Grid,
  Paper,
  IconButton,
  Button,
  Divider,
} from '@mui/material';
import KeyboardArrowLeftIcon from '@mui/icons-material/KeyboardArrowLeft';
import KeyboardArrowRightIcon from '@mui/icons-material/KeyboardArrowRight';
import EditIcon from '@mui/icons-material/Edit';
import DatePicker from './DatePicker';
import DateTimePicker from './DateTimePicker';
import TimePicker from './TimePicker';
import dayjs from 'dayjs';

export default function DateAndTimeShowcase() {
  const [selectedDate1, setSelectedDate1] = useState(dayjs('2021-12-14'));
  const [selectedDateTime, setSelectedDateTime] = useState(
    dayjs('2021-12-14 18:00')
  );
  const [selectedMonth, setSelectedMonth] = useState('Mar');
  const [selectedDateInline, setSelectedDateInline] = useState(
    dayjs('2022-03-11')
  );
  const [selectedTime, setSelectedTime] = useState(
    dayjs('2020-01-01 03:01', 'YYYY-MM-DD HH:mm')
  );

  // Month Picker State
  const months = [
    'Jan',
    'Feb',
    'Mar',
    'Apr',
    'May',
    'Jun',
    'Jul',
    'Aug',
    'Sep',
    'Oct',
    'Nov',
    'Dec',
  ];

  return (
    <Box sx={{ p: 4, bgcolor: '#fbfbfd', minHeight: '100vh' }}>
      <Typography
        variant="h4"
        fontWeight="bold"
        sx={{ mb: 4, color: '#333333', textAlign: 'center' }}
      >
        Date & Time Pickers Showcase
      </Typography>

      <Grid container spacing={5} justifyContent="center">
        {/* ==================== React Date Picker Section ==================== */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px dashed #cccccc',
              bgcolor: 'transparent',
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                mb: 3,
                color: '#4a4a4a',
                borderBottom: '1px solid #eaeaea',
                pb: 1,
              }}
            >
              React Date Picker
            </Typography>

            {/* Date Picker */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#888888', mb: 1, fontWeight: 'bold' }}
              >
                Date Picker (วันเดือนปี)
              </Typography>
              <DatePicker
                variant="inline"
                value={selectedDate1}
                onChange={setSelectedDate1}
              />
            </Box>

            {/* Date & Time Picker */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#888888', mb: 1, fontWeight: 'bold' }}
              >
                Date & Time Picker (วันเดือนปีเวลา)
              </Typography>
              <DateTimePicker
                variant="inline"
                value={selectedDateTime}
                onChange={setSelectedDateTime}
              />
            </Box>

            {/* Month Picker Demo */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#888888', mb: 1, fontWeight: 'bold' }}
              >
                Month Picker (เลือกเดือน)
              </Typography>
              <Paper
                elevation={0}
                sx={{
                  width: 200,
                  border: '1px solid #eaeaea',
                  borderRadius: 3,
                  overflow: 'hidden',
                  p: 1.5,
                  bgcolor: '#ffffff',
                }}
              >
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    mb: 1.5,
                  }}
                >
                  <Typography variant="body2" fontWeight="bold">
                    2021
                  </Typography>
                  <Box>
                    <IconButton size="small">
                      <KeyboardArrowLeftIcon fontSize="small" />
                    </IconButton>
                    <IconButton size="small">
                      <KeyboardArrowRightIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                <Grid container spacing={1}>
                  {months.map((m) => {
                    const isSelected = selectedMonth === m;
                    return (
                      <Grid item xs={4} key={m}>
                        <Button
                          fullWidth
                          size="small"
                          onClick={() => setSelectedMonth(m)}
                          sx={{
                            minWidth: 0,
                            fontSize: '0.75rem',
                            py: 1,
                            borderRadius: 1.5,
                            color: isSelected ? '#ffffff' : '#333333',
                            bgcolor: isSelected
                              ? '#6b38fb !important'
                              : 'transparent',
                            '&:hover': {
                              bgcolor: isSelected
                                ? '#5521e6 !important'
                                : '#f3e5f5',
                            },
                          }}
                        >
                          {m}
                        </Button>
                      </Grid>
                    );
                  })}
                </Grid>
              </Paper>
            </Box>
          </Paper>
        </Grid>

        {/* ==================== Material Date Picker Section ==================== */}
        <Grid item xs={12} md={6}>
          <Paper
            elevation={0}
            sx={{
              p: 3,
              borderRadius: 4,
              border: '1px dashed #cccccc',
              bgcolor: 'transparent',
            }}
          >
            <Typography
              variant="h6"
              fontWeight="bold"
              sx={{
                mb: 3,
                color: '#4a4a4a',
                borderBottom: '1px solid #eaeaea',
                pb: 1,
              }}
            >
              Material Date Picker
            </Typography>

            {/* Date Inline */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#888888', mb: 1, fontWeight: 'bold' }}
              >
                Date Inline
              </Typography>
              <DatePicker
                variant="inline"
                value={selectedDateInline}
                onChange={setSelectedDateInline}
                slotProps={{
                  calendarHeader: {
                    sx: {
                      '& .MuiPickersCalendarHeader-labelContainer': {
                        '&::after': {
                          content: '" ▾"',
                          fontSize: '0.8rem',
                          color: '#666',
                        },
                      },
                    },
                  },
                }}
              />
            </Box>

            {/* Date Modal Demo */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#888888', mb: 1, fontWeight: 'bold' }}
              >
                Date Modal Preview
              </Typography>
              <Paper
                elevation={6}
                sx={{
                  maxWidth: 320,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                }}
              >
                {/* Custom Purple Header */}
                <Box
                  sx={{
                    bgcolor: '#6b38fb',
                    color: '#ffffff',
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.8,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      BASIC
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedDateInline.format('ddd, MMM DD')}
                    </Typography>
                  </Box>
                  <IconButton size="small" sx={{ color: '#ffffff' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
                {/* Calendar */}
                <Box>
                  <DatePicker
                    variant="inline"
                    value={selectedDateInline}
                    onChange={setSelectedDateInline}
                    slotProps={{
                      layout: {
                        sx: {
                          '& .MuiPickersLayout-root': {
                            border: 'none',
                            boxShadow: 'none',
                            borderRadius: 0,
                          },
                        },
                      },
                    }}
                  />
                </Box>
                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    p: 1,
                    bgcolor: '#ffffff',
                    gap: 1,
                  }}
                >
                  <Button
                    size="small"
                    sx={{ color: '#6b38fb', fontWeight: 'bold' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    sx={{ color: '#6b38fb', fontWeight: 'bold' }}
                  >
                    Ok
                  </Button>
                </Box>
              </Paper>
            </Box>

            {/* Time Modal Demo */}
            <Box sx={{ mb: 4 }}>
              <Typography
                variant="subtitle2"
                sx={{ color: '#888888', mb: 1, fontWeight: 'bold' }}
              >
                Time Modal Preview (เวลา)
              </Typography>
              <Paper
                elevation={6}
                sx={{
                  maxWidth: 320,
                  borderRadius: 3,
                  overflow: 'hidden',
                  boxShadow: '0 8px 24px rgba(0,0,0,0.1)',
                }}
              >
                {/* Custom Purple Header */}
                <Box
                  sx={{
                    bgcolor: '#6b38fb',
                    color: '#ffffff',
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  <Box>
                    <Typography
                      variant="caption"
                      sx={{
                        opacity: 0.8,
                        textTransform: 'uppercase',
                        letterSpacing: 1,
                      }}
                    >
                      BASIC
                    </Typography>
                    <Typography variant="h5" fontWeight="bold">
                      {selectedTime.format('hh:mm A')}
                    </Typography>
                  </Box>
                  <IconButton size="small" sx={{ color: '#ffffff' }}>
                    <EditIcon fontSize="small" />
                  </IconButton>
                </Box>
                {/* Clock face */}
                <Box>
                  <TimePicker
                    variant="inline"
                    value={selectedTime}
                    onChange={setSelectedTime}
                    slotProps={{
                      layout: {
                        sx: {
                          '& .MuiPickersLayout-root': {
                            border: 'none',
                            boxShadow: 'none',
                            borderRadius: 0,
                          },
                        },
                      },
                    }}
                  />
                </Box>
                {/* Actions */}
                <Box
                  sx={{
                    display: 'flex',
                    justifyContent: 'flex-end',
                    p: 1,
                    bgcolor: '#ffffff',
                    gap: 1,
                  }}
                >
                  <Button
                    size="small"
                    sx={{ color: '#6b38fb', fontWeight: 'bold' }}
                  >
                    Cancel
                  </Button>
                  <Button
                    size="small"
                    sx={{ color: '#6b38fb', fontWeight: 'bold' }}
                  >
                    Ok
                  </Button>
                </Box>
              </Paper>
            </Box>
          </Paper>
        </Grid>
      </Grid>
    </Box>
  );
}
