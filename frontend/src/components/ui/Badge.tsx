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
  const base = 'inline-flex items-center font-medium rounded-[6px] border select-none transition-colors';

  const variants = {
    default:  'bg-[#1A1A1A] text-[#D4D4D4] border-[#292929]',
    accent:   'bg-[#FFAA2B]/10 text-[#FFAA2B] border-[#FFAA2B]/20',
    amber:    'bg-[#FFAA2B]/10 text-[#FFAA2B] border-[#FFAA2B]/20',
    emerald:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
    rose:     'bg-rose-500/10 text-rose-400 border-rose-500/20',
    slate:    'bg-[#141414] text-[#8A8A8A] border-[#242424]',
    outline:  'bg-transparent text-[#D4D4D4] border-[#292929]',
    white:    'bg-white text-black font-semibold border-white',
  };

  const sizes = {
    sm: 'px-2 py-0.5 text-[11px] gap-1',
    md: 'px-2.5 py-1 text-xs gap-1.5',
  };

  return (
    <span className={cn(base, variants[variant], sizes[size], className)} {...props}>
      {children}
    </span>
  );
};
