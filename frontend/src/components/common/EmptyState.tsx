import React from 'react';
import { Button } from '../ui/Button';

interface EmptyStateProps {
  icon?: React.ReactNode;
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
  className?: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  icon,
  title,
  description,
  actionLabel,
  onAction,
  className
}) => {
  return (
    <div className={`text-center py-16 px-4 max-w-md mx-auto text-neutral-900 dark:text-white ${className || ''}`}>
      {icon && (
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-neutral-100 dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] flex items-center justify-center text-neutral-800 dark:text-white shadow-sm">
          {icon}
        </div>
      )}
      <h3 className="text-lg font-bold text-neutral-900 dark:text-white mb-1.5">{title}</h3>
      <p className="text-sm text-neutral-500 dark:text-[#8A8A8A] mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="primary" className="font-bold">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
