import React from 'react';
import { cn } from '@/lib/utils';

export interface SpinnerProps extends React.HTMLAttributes<HTMLDivElement> {
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  variant?: 'orange' | 'white' | 'muted';
}

export const Spinner: React.FC<SpinnerProps> = ({
  size = 'md',
  variant = 'orange',
  className,
  ...props
}) => {
  const sizeClasses = {
    xs: 'w-3.5 h-3.5 border-[2px]',
    sm: 'w-4 h-4 border-[2px]',
    md: 'w-6 h-6 border-[2.5px]',
    lg: 'w-8 h-8 border-[3px]',
    xl: 'w-12 h-12 border-[3.5px]'
  };

  const variantClasses = {
    orange: 'border-[#262626] border-t-[#FFAA2B] border-r-[#FFAA2B]',
    white:  'border-[#262626] border-t-white border-r-white',
    muted:  'border-[#222222] border-t-[#8A8A8A] border-r-[#8A8A8A]'
  };

  return (
    <div
      role="status"
      aria-label="Loading"
      className={cn(
        'inline-block rounded-full animate-spin shrink-0',
        sizeClasses[size],
        variantClasses[variant],
        className
      )}
      {...props}
    >
      <span className="sr-only">Loading...</span>
    </div>
  );
};

export interface PageSpinnerProps {
  text?: string;
  size?: 'md' | 'lg' | 'xl';
  className?: string;
}

export const PageSpinner: React.FC<PageSpinnerProps> = ({
  text,
  size = 'lg',
  className
}) => {
  return (
    <div
      className={cn(
        'min-h-[50vh] flex flex-col items-center justify-center gap-3.5 text-center p-6 bg-transparent',
        className
      )}
    >
      <div className="relative flex items-center justify-center">
        {/* Subtle orange pulse glow behind the spinner */}
        <div className="absolute w-14 h-14 bg-[#FFAA2B]/10 rounded-full blur-xl animate-pulse pointer-events-none" />
        <Spinner size={size} variant="orange" />
      </div>
      {text && (
        <p className="text-xs font-medium text-[#8A8A8A] tracking-wide animate-pulse">
          {text}
        </p>
      )}
    </div>
  );
};

export const CardSpinner: React.FC<{ text?: string; className?: string }> = ({
  text,
  className
}) => {
  return (
    <div
      className={cn(
        'py-12 flex flex-col items-center justify-center gap-2.5 text-center',
        className
      )}
    >
      <Spinner size="md" variant="orange" />
      {text && <p className="text-xs text-[#666]">{text}</p>}
    </div>
  );
};
