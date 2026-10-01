'use client';

import { useCallback, useEffect, useState } from 'react';
import { Eye, EyeOff, KeyRound, Lock } from 'lucide-react';
import Swal from 'sweetalert2';
import { authApi } from '@/lib/api/auth.api';

const MIN_LENGTH = 6;

const inputClass =
  'w-full border-0 bg-white rounded-xl px-4 py-3.5 pr-11 text-sm font-medium text-slate-700 outline-none ring-1 ring-slate-200/60 focus:ring-2 focus:ring-blue-500/20 shadow-inner transition-all';
const labelClass =
  'text-[13px] font-bold text-slate-500 mb-2 flex items-center gap-2 uppercase tracking-wider';

/**
 * Change-password card for every role's settings page.
 * Business rule: the first change needs no current password; after the user has
 * changed it once, the current password is required (the server enforces this;
 * the field is shown based on GET /auth/password-status).
 */
export default function ChangePasswordCard({
  className = 'mt-6',
}: {
  /** Outer spacing; defaults to a gap below the profile card. */
  className?: string;
}) {
  const [requiresCurrent, setRequiresCurrent] = useState<boolean | null>(null);
  const [form, setForm] = useState({ current: '', next: '', confirm: '' });
  const [show, setShow] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadStatus = useCallback(async () => {
    try {
      const res = await authApi.getPasswordStatus();
      setRequiresCurrent(Boolean(res.data?.requiresCurrentPassword));
    } catch {
      // Fail safe: ask for the current password; the server decides anyway.
      setRequiresCurrent(true);
    }
  }, []);

  useEffect(() => {
    void loadStatus();
  }, [loadStatus]);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (requiresCurrent && !form.current) {
      setError('กรุณากรอกรหัสผ่านปัจจุบัน');
      return;
    }
    if (form.next.length < MIN_LENGTH) {
      setError(`รหัสผ่านใหม่ต้องมีอย่างน้อย ${MIN_LENGTH} ตัวอักษร`);
      return;
    }
    if (form.next !== form.confirm) {
      setError('รหัสผ่านใหม่และการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }

    setSaving(true);
    try {
      const res = await authApi.changePassword({
        ...(requiresCurrent ? { currentPassword: form.current } : {}),
        newPassword: form.next,
      });
      // The server signed out every other device and issued a new token pair
      // for this one; switch to it so this session keeps working.
      const tokens = res.data as
        | { accessToken?: string; refreshToken?: string }
        | undefined;
      if (tokens?.accessToken) {
        sessionStorage.setItem('accessToken', tokens.accessToken);
        if (tokens.refreshToken) {
          sessionStorage.setItem('refreshToken', tokens.refreshToken);
        }
      }
      setForm({ current: '', next: '', confirm: '' });
      await Swal.fire({
        icon: 'success',
        title: 'เปลี่ยนรหัสผ่านเรียบร้อยแล้ว',
        text: 'อุปกรณ์อื่นที่เข้าสู่ระบบด้วยบัญชีนี้ถูกออกจากระบบแล้ว ครั้งต่อไปที่เปลี่ยนรหัสผ่าน ต้องกรอกรหัสผ่านปัจจุบันด้วย',
        confirmButtonColor: '#2563eb',
      });
      await loadStatus();
    } catch {
      // The API interceptor already shows the server's message (e.g. wrong current password).
    } finally {
      setSaving(false);
    }
  };

  const field = (
    key: 'current' | 'next' | 'confirm',
    label: string,
    autoComplete: string,
  ) => (
    <div className="group">
      <label htmlFor={`pw-${key}`} className={labelClass}>
        <Lock className="w-4 h-4 text-blue-400 group-hover:text-blue-600 transition-colors" />
        {label}
      </label>
      <div className="relative">
        <input
          id={`pw-${key}`}
          type={show ? 'text' : 'password'}
          autoComplete={autoComplete}
          value={form[key]}
          onChange={(e) => setForm((f) => ({ ...f, [key]: e.target.value }))}
          className={inputClass}
        />
        <button
          type="button"
          onClick={() => setShow((s) => !s)}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
          aria-label={show ? 'ซ่อนรหัสผ่าน' : 'แสดงรหัสผ่าน'}
        >
          {show ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
        </button>
      </div>
    </div>
  );

  return (
    <section
      className={`bg-white/70 backdrop-blur-xl rounded-3xl shadow-xl border border-white/50 p-4 sm:p-8 max-w-[850px] mx-auto ${className}`}
    >
      <div className="flex items-center gap-3 mb-6">
        <div className="w-9 h-9 bg-blue-100 text-blue-600 rounded-xl flex items-center justify-center shrink-0">
          <KeyRound className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-base font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {requiresCurrent === false
              ? 'การเปลี่ยนรหัสผ่านครั้งแรกไม่ต้องกรอกรหัสผ่านเดิม'
              : 'กรอกรหัสผ่านปัจจุบันเพื่อยืนยันตัวตน'}
          </p>
        </div>
      </div>

      {requiresCurrent === null ? (
        <p className="text-sm text-slate-500">กำลังโหลด...</p>
      ) : (
        <form onSubmit={submit} className="space-y-5" noValidate>
          {requiresCurrent && field('current', 'รหัสผ่านปัจจุบัน', 'current-password')}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {field('next', 'รหัสผ่านใหม่', 'new-password')}
            {field('confirm', 'ยืนยันรหัสผ่านใหม่', 'new-password')}
          </div>
          <p className="text-xs text-slate-500">
            รหัสผ่านต้องมีอย่างน้อย {MIN_LENGTH} ตัวอักษร
          </p>
          {error && (
            <p role="alert" className="text-sm font-medium text-red-600">
              {error}
            </p>
          )}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={saving}
              className="px-5 py-2.5 rounded-xl bg-blue-600 text-white text-sm font-bold shadow-sm hover:bg-blue-700 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกรหัสผ่านใหม่'}
            </button>
          </div>
        </form>
      )}
    </section>
  );
}
