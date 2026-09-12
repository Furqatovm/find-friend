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
    const baseStyles =
      'inline-flex items-center justify-center font-semibold rounded-[10px] transition-all duration-150 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#FFAA2B] focus-visible:ring-offset-2 focus-visible:ring-offset-black disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer select-none active:scale-[0.97]';

    const variants = {
      // Warm orange — primary CTA
      primary:
        'bg-[#FFAA2B] hover:bg-[#FFB83D] active:bg-[#FF9C1A] text-black border border-[#FFAA2B] hover:border-[#FFB83D] shadow-sm',
      // Dark surface — secondary action
      secondary:
        'bg-[#1A1A1A] hover:bg-[#222222] text-white border border-[#2E2E2E] hover:border-[#3D3D3D]',
      // Transparent with border
      outline:
        'border border-[#292929] hover:border-[#3D3D3D] text-[#D4D4D4] hover:text-white bg-transparent hover:bg-[#141414]',
      // No border, text-only
      ghost:
        'text-[#8A8A8A] hover:text-white hover:bg-[#141414] bg-transparent border border-transparent',
      // Destructive / danger
      destructive:
        'bg-red-500/10 hover:bg-red-500/20 text-red-400 border border-red-500/20 active:bg-red-500/30',
      // Subtle surface
      subtle:
        'bg-[#181818] hover:bg-[#1D1D1D] text-[#D4D4D4] hover:text-white border border-[#292929]',
      // Accent alias (same as primary, explicit)
      accent:
        'bg-[#FFAA2B] hover:bg-[#FFB83D] text-black font-bold border border-[#FFAA2B] shadow-sm',
    };

    const sizes = {
      sm:   'px-3 py-1.5 text-xs gap-1.5 h-8',
      md:   'px-4 py-2 text-sm gap-2 h-9',
      lg:   'px-6 py-3 text-base gap-2.5 h-11',
      icon: 'p-2 w-9 h-9',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(baseStyles, variants[variant], sizes[size], className)}
        {...props}
      >
        {loading && <Loader2 className="w-4 h-4 animate-spin text-current shrink-0" />}
        {children}
      </button>
    );
  }
);
Button.displayName = 'Button';
