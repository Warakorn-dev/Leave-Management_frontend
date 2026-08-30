import React, { useMemo, useState, useRef, useEffect } from 'react';
import { Clock, ChevronDown, Check } from 'lucide-react';

interface LeaveTimePickerProps {
  startTime: string;
  endTime: string;
  onChangeStartTime: (val: string) => void;
  onChangeEndTime: (val: string) => void;
  disabled?: boolean;
}

const WORK_TIME_OPTIONS = [
  "08:30", "09:00", "09:30", "10:00", "10:30", "11:00", "11:30", "12:00",
  "13:00", "13:30", "14:00", "14:30", "15:00", "15:30", "16:00", "16:30", "17:00", "17:30"
];

const CustomTimeSelect: React.FC<{
  label: string;
  value: string;
  onChange: (val: string) => void;
  placeholder: string;
  disabled?: boolean;
}> = ({ label, value, onChange, placeholder, disabled }) => {
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="flex-1 w-full relative" ref={containerRef}>
      <label className="text-[13px] font-semibold text-gray-800 mb-1.5 flex items-center gap-1.5">
        <Clock className="w-3.5 h-3.5 text-blue-600" /> {label}
      </label>
      
      <button
        type="button"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between border border-gray-300 rounded-lg px-3.5 py-2.5 text-sm bg-white hover:border-blue-400 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 transition-all text-gray-700 disabled:bg-gray-100 disabled:text-gray-400 cursor-pointer shadow-xs"
      >
        <span className={value ? 'text-gray-900 font-medium' : 'text-gray-400'}>
          {value ? `${value} น.` : placeholder}
        </span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform duration-200 ${isOpen ? 'rotate-180 text-blue-600' : ''}`} />
      </button>

      {isOpen && (
        <div className="absolute z-50 mt-1 w-full bg-white border border-gray-200 rounded-xl shadow-lg max-h-48 overflow-y-auto py-1 text-sm transition-all animate-in fade-in-50 slide-in-from-top-1">
          {WORK_TIME_OPTIONS.map((time) => (
            <button
              key={time}
              type="button"
              onClick={() => {
                onChange(time);
                setIsOpen(false);
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2 text-left hover:bg-blue-50 hover:text-blue-600 transition-colors cursor-pointer ${
                value === time ? 'bg-blue-50 text-blue-600 font-semibold' : 'text-gray-700'
              }`}
            >
              <span>{time} น.</span>
              {value === time && <Check className="w-4 h-4 text-blue-600" />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

export const LeaveTimePicker: React.FC<LeaveTimePickerProps> = ({
  startTime,
  endTime,
  onChangeStartTime,
  onChangeEndTime,
  disabled = false
}) => {
  // คำนวณชั่วโมงและนาทีอัตโนมัติ (หักช่วงพักเที่ยง 12:00 - 13:00 น. หากคาบเกี่ยว)
  const duration = useMemo(() => {
    if (!startTime || !endTime) return null;

    const [startH, startM] = startTime.split(':').map(Number);
    const [endH, endM] = endTime.split(':').map(Number);

    const startTotal = startH * 60 + startM;
    const endTotal = endH * 60 + endM;

    const totalMinutes = endTotal - startTotal;
    
    if (totalMinutes <= 0) {
      return { error: true, text: 'เวลาสิ้นสุดต้องมากกว่าเวลาเริ่ม' };
    }

    // หักเวลาพักเที่ยง (12:00 - 13:00 น. = 720 ถึง 780 นาที)
    const lunchStart = 12 * 60; // 720
    const lunchEnd = 13 * 60;   // 780

    let overlapLunch = 0;
    const overlapStart = Math.max(startTotal, lunchStart);
    const overlapEnd = Math.min(endTotal, lunchEnd);

    if (overlapStart < overlapEnd) {
      overlapLunch = overlapEnd - overlapStart;
    }

    const netMinutes = totalMinutes - overlapLunch;
    const hours = Math.floor(netMinutes / 60);
    const mins = netMinutes % 60;
    
    const textParts = [];
    if (hours > 0) textParts.push(`${hours} ชั่วโมง`);
    if (mins > 0) textParts.push(`${mins} นาที`);

    return { error: false, text: textParts.join(' ') || '0 นาที' };
  }, [startTime, endTime]);

  return (
    <div className="w-full bg-white border border-gray-200 rounded-xl p-4 shadow-sm">
      <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center">
        <CustomTimeSelect
          label="เวลาเริ่มลา"
          value={startTime}
          onChange={onChangeStartTime}
          placeholder="เลือกเวลาเริ่มลา"
          disabled={disabled}
        />
        
        <CustomTimeSelect
          label="เวลาสิ้นสุด"
          value={endTime}
          onChange={onChangeEndTime}
          placeholder="เลือกเวลาสิ้นสุด"
          disabled={disabled}
        />
      </div>

      {duration && (
        <div className={`mt-3 px-3 py-2 rounded-lg text-sm font-medium border ${duration.error ? 'bg-red-50 text-red-600 border-red-100' : 'bg-emerald-50 text-emerald-700 border-emerald-100'} flex items-center justify-between`}>
          <span>รวมเวลาที่ลา:</span>
          <span>{duration.text}</span>
        </div>
      )}
    </div>
  );
};
