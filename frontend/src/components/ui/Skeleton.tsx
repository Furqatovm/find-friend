import React from 'react';
import { cn } from '@/lib/utils';

export const Skeleton: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, ...props }) => {
  return (
    <div
      className={cn(
        'skeleton rounded-[10px]',
        className
      )}
      {...props}
    />
  );
};

export const UserCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#141414] border border-[#292929] rounded-[12px] p-5 space-y-4">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Skeleton className="w-12 h-12 rounded-full shrink-0" />
        <div className="space-y-2 flex-1">
          <Skeleton className="h-3.5 w-3/5" />
          <Skeleton className="h-3 w-4/5" />
        </div>
        <Skeleton className="w-10 h-10 rounded-full shrink-0" />
      </div>
      {/* Tags */}
      <div className="flex gap-2">
        <Skeleton className="h-6 w-16 rounded-[6px]" />
        <Skeleton className="h-6 w-20 rounded-[6px]" />
        <Skeleton className="h-6 w-14 rounded-[6px]" />
      </div>
      {/* Buttons */}
      <div className="pt-1 flex gap-2">
        <Skeleton className="h-8 flex-1 rounded-[10px]" />
        <Skeleton className="h-8 flex-1 rounded-[10px]" />
      </div>
    </div>
  );
};

export const ActivityCardSkeleton: React.FC = () => {
  return (
    <div className="bg-[#141414] border border-[#292929] rounded-[12px] p-5 space-y-3">
      <Skeleton className="h-4 w-3/5" />
      <Skeleton className="h-3 w-4/5" />
      <div className="flex gap-2">
        <Skeleton className="h-5 w-16 rounded-[6px]" />
        <Skeleton className="h-5 w-20 rounded-[6px]" />
      </div>
      <Skeleton className="h-8 w-full rounded-[10px]" />
    </div>
  );
};
