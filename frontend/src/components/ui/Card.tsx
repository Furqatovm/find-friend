import React from 'react';
import { cn } from '@/lib/utils';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  elevated?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, hover = false, elevated = false, children, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          // Base
          'rounded-[12px] border text-white transition-all duration-200',
          // Default surface
          elevated
            ? 'bg-[#181818] border-[#2A2A2A]'
            : 'bg-[#141414] border-[#292929]',
          // Hover effect
          hover && [
            'hover:bg-[#181818]',
            'hover:border-[#383838]',
            'hover:-translate-y-px',
            'hover:shadow-[0_4px_20px_rgba(0,0,0,0.6)]',
            'cursor-pointer',
          ],
          'p-5',
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
