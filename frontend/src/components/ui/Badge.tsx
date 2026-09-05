import React from 'react';
import { cn } from '@/lib/utils';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'accent' | 'amber' | 'emerald' | 'rose' | 'slate' | 'outline' | 'white';
  size?: 'sm' | 'md';
}

export const Badge: React.FC<BadgeProps> = ({
  className,
  variant = 'default',
  size = 'md',
  children,
  ...props
}) => {
  const base = 'inline-flex items-center font-medium rounded-lg border select-none transition-colors';
  
  const variants = {
    default: 'bg-neutral-100 dark:bg-[#141414] text-neutral-800 dark:text-[#D4D4D4] border-neutral-200 dark:border-[#242424]',
    accent: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    amber: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/25',
    emerald: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/25',
    rose: 'bg-rose-500/10 text-rose-600 dark:text-rose-400 border-rose-500/25',
    slate: 'bg-neutral-100 dark:bg-[#0F0F0F] text-neutral-600 dark:text-[#8A8A8A] border-neutral-200 dark:border-[#242424]',
    outline: 'bg-transparent text-neutral-700 dark:text-[#D4D4D4] border-neutral-300 dark:border-[#292929]',
    white: 'bg-neutral-900 text-white dark:bg-white dark:text-black font-semibold border-neutral-900 dark:border-white'
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5'
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
