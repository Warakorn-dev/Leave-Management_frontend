"use client";

import React from 'react';
import { NotificationDropdown } from '@/components/NotificationDropdown';

export function TopNavbar() {
  return (
    <div className="w-full bg-white dark:bg-slate-900 border-b border-slate-200 dark:border-slate-800 px-8 py-3 flex justify-end items-center sticky top-0 z-40 shadow-sm">
      <NotificationDropdown />
    </div>
  );
}

