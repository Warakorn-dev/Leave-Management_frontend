'use client';

import { useEffect, useState } from 'react';
import { Lock } from 'lucide-react';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const formatClock = (ms: number) => {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
};

/**
 * Modal shown when the login attempt limit is reached: a circular countdown
 * until the user may try again. Closing it keeps the login button disabled
 * (it shows the remaining time) until the countdown ends.
 */
export default function LoginLockoutModal({
  until,
  totalMs,
  maxAttempts,
  isDark,
  onClose,
}: {
  until: number;
  totalMs: number;
  maxAttempts: number;
  isDark: boolean;
  onClose: () => void;
}) {
  const [now, setNow] = useState(() => Date.now());

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 250);
    return () => clearInterval(id);
  }, []);

  const remaining = Math.max(0, until - now);
  useEffect(() => {
    if (remaining === 0) onClose();
  }, [remaining, onClose]);

  const fraction = totalMs > 0 ? remaining / totalMs : 0;

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="lockout-title"
    >
      <div
        className={`w-full max-w-sm rounded-3xl p-8 text-center shadow-2xl animate-in fade-in zoom-in-95 duration-300 ${
          isDark ? 'bg-[#0b1437] text-white border border-white/10' : 'bg-white text-slate-800'
        }`}
      >
        <div className="relative mx-auto w-40 h-40">
          <svg viewBox="0 0 128 128" className="w-40 h-40 -rotate-90" aria-hidden="true">
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              className={isDark ? 'stroke-white/10' : 'stroke-slate-200'}
            />
            <circle
              cx="64"
              cy="64"
              r={RADIUS}
              fill="none"
              strokeWidth="10"
              strokeLinecap="round"
              stroke="#ef4444"
              strokeDasharray={CIRCUMFERENCE}
              strokeDashoffset={CIRCUMFERENCE * (1 - fraction)}
              style={{ transition: 'stroke-dashoffset 0.25s linear' }}
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <Lock className="w-5 h-5 text-red-500 mb-1" aria-hidden="true" />
            <span className="text-3xl font-bold tabular-nums" aria-live="polite">
              {formatClock(remaining)}
            </span>
            <span className={`text-xs ${isDark ? 'text-white/60' : 'text-slate-500'}`}>
              นาที : วินาที
            </span>
          </div>
        </div>

        <h2 id="lockout-title" className="mt-6 text-lg font-bold">
          ระงับการเข้าสู่ระบบชั่วคราว
        </h2>
        <p className={`mt-2 text-sm leading-relaxed ${isDark ? 'text-white/70' : 'text-slate-600'}`}>
          คุณใส่รหัสผ่านผิดครบ {maxAttempts} ครั้ง
          <br />
          กรุณารอจนครบเวลาแล้วลองใหม่อีกครั้ง
        </p>
        <p className={`mt-3 text-xs ${isDark ? 'text-white/50' : 'text-slate-400'}`}>
          หากลืมรหัสผ่าน ใช้ &quot;ลืมรหัสผ่าน&quot; ที่หน้าเข้าสู่ระบบได้
        </p>

        <button
          type="button"
          onClick={onClose}
          className="mt-6 w-full h-10 rounded-lg bg-[#0056b3] hover:bg-[#004494] text-white font-bold text-[15px] transition-colors"
        >
          ตกลง
        </button>
      </div>
    </div>
  );
}
