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
          <label htmlFor={inputId} className="block text-xs font-semibold text-[#D4D4D4]">
            {label}
          </label>
        )}
        <div className="relative flex items-center">
          {icon && (
            <div className="absolute left-3 text-[#5C5C5C] pointer-events-none flex items-center z-10">
              {icon}
            </div>
          )}
          <input
            id={inputId}
            ref={ref}
            className={cn(
              'w-full bg-[#0F0F0F] text-white placeholder-[#4A4A4A] rounded-[10px] px-3.5 py-2 text-sm',
              'border border-[#292929]',
              'transition-all duration-150',
              'focus:outline-none focus:border-[#FFAA2B] focus:ring-1 focus:ring-[#FFAA2B]/20',
              'disabled:opacity-40 disabled:cursor-not-allowed',
              'h-9',
              icon && 'pl-9',
              error && 'border-red-500/60 focus:border-red-500 focus:ring-red-500/20',
              className
            )}
            {...props}
          />
        </div>
        {error ? (
          <p className="text-xs text-red-400 font-medium">{error}</p>
        ) : helperText ? (
          <p className="text-xs text-[#8A8A8A]">{helperText}</p>
        ) : null}
      </div>
    );
  }
);
Input.displayName = 'Input';
