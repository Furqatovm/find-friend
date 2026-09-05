import React from 'react';
import { cn } from '@/lib/utils';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
  icon?: React.ReactNode;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helperText, icon, id, ...props }, ref) => {
    const inputId = id || (label ? label.toLowerCase().replace(/\s+/g, '-') : undefined);

    return (
      <div className="w-full space-y-1.5">
        {label && (
          <label htmlFor={inputId} className="block text-xs font-bold text-neutral-700 dark:text-[#D4D4D4]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-neutral-400 dark:text-[#8A8A8A] pointer-events-none flex items-center">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-white dark:bg-[#0F0F0F] text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] rounded-xl px-3.5 py-2 text-sm border border-neutral-200 dark:border-[#242424] transition-all duration-150',
              'focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A] focus:ring-1 focus:ring-neutral-400/30 dark:focus:ring-white/20',
              'disabled:opacity-40 disabled:cursor-not-allowed shadow-xs',
              icon && 'pl-10',
              error && 'border-red-500/80 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-red-500 dark:text-red-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
