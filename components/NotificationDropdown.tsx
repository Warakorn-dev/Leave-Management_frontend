"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Bell, 
  Check, 
  UserPlus, 
  ShoppingBag, 
  CreditCard, 
  AlertTriangle, 
  CheckCircle2, 
  XCircle, 
  ShieldAlert, 
  Info 
} from 'lucide-react';
import { useNotification, NotificationItem } from '@/hooks/useNotification';

// Helper for Thai relative time
function getRelativeTime(dateString: string): string {
  const date = new Date(dateString);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);

  if (diffMins < 1) return 'เมื่อสักครู่';
  if (diffMins < 60) return `${diffMins} นาทีที่แล้ว`;
  if (diffHours < 24) return `${diffHours} ชั่วโมงที่แล้ว`;
  if (diffDays === 1) return 'เมื่อวาน';
  if (diffDays < 7) return `${diffDays} วันที่แล้ว`;
  
  return date.toLocaleDateString('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric'
  });
}

// Icon mapper per Notification Type
function getNotificationIcon(type?: string) {
  const t = (type || '').toUpperCase();
  switch (t) {
    case 'APPROVE':
    case 'APPROVED':
      return (
        <div className="w-9 h-9 rounded-xl bg-emerald-100 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 flex items-center justify-center shrink-0 shadow-xs">
          <CheckCircle2 className="w-5 h-5" />
        </div>
      );
    case 'REJECT':
    case 'REJECTED':
      return (
        <div className="w-9 h-9 rounded-xl bg-rose-100 dark:bg-rose-950/60 text-rose-600 dark:text-rose-400 flex items-center justify-center shrink-0 shadow-xs">
          <XCircle className="w-5 h-5" />
        </div>
      );
    case 'NEW_ORDER':
    case 'PENDING':
    case 'LEAVE_REQUEST':
      return (
        <div className="w-9 h-9 rounded-xl bg-amber-100 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
          <AlertTriangle className="w-5 h-5" />
        </div>
      );
    case 'USER_REGISTER':
      return (
        <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center shrink-0 shadow-xs">
          <UserPlus className="w-5 h-5" />
        </div>
      );
    case 'SECURITY':
      return (
        <div className="w-9 h-9 rounded-xl bg-red-100 dark:bg-red-950/60 text-red-600 dark:text-red-400 flex items-center justify-center shrink-0 shadow-xs">
          <ShieldAlert className="w-5 h-5" />
        </div>
      );
    case 'SYSTEM':
    default:
      return (
        <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 flex items-center justify-center shrink-0 shadow-xs">
          <Info className="w-5 h-5" />
        </div>
      );
  }
}

export function NotificationDropdown() {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const router = useRouter();

  const { notifications, unreadCount, markAsRead, markAllAsRead, refetch } = useNotification();

  // Close dropdown on click outside or ESC key
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleToggle = () => {
    const nextState = !isOpen;
    setIsOpen(nextState);
    if (nextState) {
      refetch();
    }
  };

  const handleItemClick = async (item: NotificationItem) => {
    if (!item.isRead) {
      await markAsRead(item.id);
    }
    if (item.redirectUrl) {
      setIsOpen(false);
      let targetUrl = item.redirectUrl;
      
      // Fallback for existing notifications in database with invalid URL
      if (targetUrl === '/dashboard/user/page') {
        const path = window.location.pathname;
        if (path.includes('/ceo')) targetUrl = '/dashboard/ceo/dashboard';
        else if (path.includes('/hr')) targetUrl = '/dashboard/hr/dashboard';
        else if (path.includes('/manager')) targetUrl = '/dashboard/manager/status';
        else targetUrl = '/dashboard/user/status';
      }
      
      router.push(targetUrl);
    }
  };

  // Limit to 15 latest items
  const displayedItems = notifications.slice(0, 15);

  return (
    <div className="relative" ref={dropdownRef}>
      {/* Bell Trigger Button */}
      <button
        type="button"
        onClick={handleToggle}
        className="relative p-2.5 rounded-full text-slate-600 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-blue-600 dark:hover:text-blue-400 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500/20"
        aria-label="การแจ้งเตือน"
      >
        <Bell className="w-5 h-5" strokeWidth={1.75} />
        {/* Badge - Only show if unreadCount > 0 */}
        {unreadCount > 0 && (
          <span className="absolute top-1 right-1 min-w-[18px] h-[18px] px-1 bg-rose-500 text-white text-[10px] font-bold rounded-full flex items-center justify-center border-2 border-white dark:border-slate-900 shadow-sm animate-in zoom-in-50 duration-200">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Container */}
      {isOpen && (
        <>
          {/* Mobile Backdrop */}
          <div
            className="fixed inset-0 z-40 sm:hidden"
            onClick={() => setIsOpen(false)}
          />

          <div className="absolute right-0 mt-3 w-[calc(100vw-24px)] sm:w-[380px] bg-white dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-3xl shadow-2xl overflow-hidden z-50 animate-in fade-in slide-in-from-top-2 duration-200">
            {/* Header */}
            <div className="px-5 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-slate-50/50 dark:bg-slate-800/40">
              <h3 className="font-bold text-base text-slate-900 dark:text-white flex items-center gap-2">
                การแจ้งเตือน
                {unreadCount > 0 && (
                  <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-blue-100 dark:bg-blue-950 text-blue-600 dark:text-blue-400">
                    {unreadCount} ใหม่
                  </span>
                )}
              </h3>
              {unreadCount > 0 && (
                <button
                  type="button"
                  onClick={() => markAllAsRead()}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 flex items-center gap-1 transition-colors"
                >
                  <Check className="w-3.5 h-3.5" /> ทำเครื่องหมายว่าอ่านทั้งหมด
                </button>
              )}
            </div>

            {/* Notification List (Scrollable, Max 10 items) */}
            <div className="max-h-[380px] overflow-y-auto divide-y divide-slate-100 dark:divide-slate-800/60 custom-scrollbar">
              {displayedItems.length > 0 ? (
                displayedItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item)}
                    className={`p-4 flex items-start gap-3 cursor-pointer transition-colors hover:bg-slate-50 dark:hover:bg-slate-800/60 relative group ${
                      !item.isRead ? 'bg-blue-50/40 dark:bg-blue-950/20' : ''
                    }`}
                  >
                    {/* Notification Icon */}
                    {getNotificationIcon(item.type)}

                    {/* Content */}
                    <div className="flex-1 min-w-0 pr-2">
                      <div className="flex justify-between items-start gap-2">
                        <h4
                          className={`text-sm leading-snug truncate ${
                            !item.isRead
                              ? 'font-bold text-slate-900 dark:text-white'
                              : 'font-semibold text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {item.title}
                        </h4>
                        {/* Unread Blue Dot */}
                        {!item.isRead && (
                          <span className="w-2.5 h-2.5 rounded-full bg-blue-500 shrink-0 mt-1 shadow-sm" />
                        )}
                      </div>
                      <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 line-clamp-2 leading-relaxed">
                        {item.message}
                      </p>
                      <p className="text-[11px] font-medium text-slate-400 dark:text-slate-500 mt-2">
                        {getRelativeTime(item.createdAt)}
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                /* Empty State */
                <div className="py-12 px-6 flex flex-col items-center justify-center text-center">
                  <div className="w-14 h-14 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center mb-4 text-slate-400 dark:text-slate-500">
                    <Bell className="w-7 h-7" strokeWidth={1.5} />
                  </div>
                  <h4 className="text-base font-bold text-slate-900 dark:text-white mb-1">
                    ไม่มีการแจ้งเตือน
                  </h4>
                  <p className="text-xs text-slate-500 dark:text-slate-400">
                    คุณได้อ่านการแจ้งเตือนทั้งหมดแล้ว
                  </p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-3 bg-slate-50/80 dark:bg-slate-800/40 border-t border-slate-100 dark:border-slate-800 text-center">
              <button
                type="button"
                onClick={() => {
                  setIsOpen(false);
                }}
                className="text-xs font-semibold text-slate-500 hover:text-slate-800 dark:text-slate-400 dark:hover:text-slate-200 transition-colors"
              >
                {displayedItems.length > 0 ? 'ซ่อนการแจ้งเตือน' : 'ไม่มีการแจ้งเตือนเพิ่มเติม'}
              </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
