import * as React from 'react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { cn } from '@/lib/api/utils';

function Input({ className, type, ...props }: React.ComponentProps<'input'>) {
  return (
    <InputPrimitive
      type={type}
      data-slot="input"
      className={cn(
        'w-full bg-[#f8fafc] dark:bg-slate-800/80 border border-[#e2e8f0] dark:border-slate-700 px-4 py-3.5 rounded-xl text-[15px] text-slate-800 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-blue-100 dark:focus:ring-blue-500/20 transition-all placeholder:text-[#94a3b8] dark:placeholder:text-slate-500 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-slate-100 dark:disabled:bg-slate-900 disabled:opacity-50 aria-invalid:border-red-500 aria-invalid:ring-red-100',
        className,
      )}
      {...props}
    />
  );
}

export { Input };
