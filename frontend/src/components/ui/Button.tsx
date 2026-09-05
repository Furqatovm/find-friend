import React from 'react';
import { cn } from '@/lib/utils';
import { Loader2 } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'destructive' | 'subtle' | 'accent';
  size?: 'sm' | 'md' | 'lg' | 'icon';
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', loading = false, disabled, children, ...props }, ref) => {
    const baseStyles = 'inline-flex items-center justify-center font-medium rounded-xl transition-all duration-150 focus:outline-none focus:ring-1 focus:ring-neutral-400 dark:focus:ring-white/30 disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.98]';
    
    const variants = {
      primary: 'bg-neutral-900 hover:bg-neutral-800 text-white font-semibold shadow-sm border border-neutral-900 dark:bg-white dark:hover:bg-neutral-200 dark:active:bg-neutral-300 dark:text-black dark:border-white',
      secondary: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-900 border border-neutral-200 dark:bg-[#141414] dark:hover:bg-[#1C1C1C] dark:text-white dark:border-[#292929]',
      outline: 'border border-neutral-200 hover:border-neutral-300 text-neutral-800 hover:text-neutral-900 bg-transparent hover:bg-neutral-100 dark:border-[#292929] dark:hover:border-[#3D3D3D] dark:text-[#D4D4D4] dark:hover:text-white dark:hover:bg-[#141414]',
      ghost: 'text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 bg-transparent dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414]',
      destructive: 'bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 border border-red-500/25 active:bg-red-500/30 font-medium',
      subtle: 'bg-neutral-100 hover:bg-neutral-200 text-neutral-800 border border-neutral-200 dark:bg-[#1A1A1A] dark:hover:bg-[#222222] dark:text-[#E5E5E5] dark:border-[#292929]',
      accent: 'bg-amber-500 hover:bg-amber-400 text-black font-semibold shadow-sm border border-amber-400'
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs gap-1.5',
      md: 'px-4 py-2 text-sm gap-2',
      lg: 'px-6 py-3 text-base gap-2.5',
      icon: 'p-2 w-9 h-9'
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin text-current" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
