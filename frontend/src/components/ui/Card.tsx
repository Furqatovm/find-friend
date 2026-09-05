import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          'bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] text-neutral-900 dark:text-white rounded-2xl p-5 transition-all duration-200 shadow-sm',
          hover && 'hover:border-neutral-300 dark:hover:border-[#383838] hover:bg-neutral-50/70 dark:hover:bg-[#141414] hover:-translate-y-0.5 shadow-md dark:shadow-none',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
Card.displayName = 'Card';
