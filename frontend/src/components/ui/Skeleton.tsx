import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn('animate-pulse bg-neutral-200 dark:bg-[#1A1A1A] rounded-xl', className)}
      {...props}
    />
  );
};

export const UserCardSkeleton: React.FC = () => {
  return (
    <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-5 space-y-4 shadow-sm">
      <div className="flex items-center gap-3.5">
        <Skeleton className="w-14 h-14 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-4 w-3/5" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </div>
      <Skeleton className="h-10 w-full rounded-xl" />
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-lg" />
        <Skeleton className="h-6 w-20 rounded-lg" />
        <Skeleton className="h-6 w-14 rounded-lg" />
      </div>
      <div className="pt-2 flex gap-2">
        <Skeleton className="h-9 flex-1 rounded-xl" />
        <Skeleton className="h-9 flex-1 rounded-xl" />
      </div>
    </div>
  );
};
