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
    <div className={`text-center py-16 px-4 max-w-sm mx-auto text-white ${className || ''}`}>
      {icon && (
        <div className="w-14 h-14 mx-auto mb-5 rounded-[12px] bg-[#141414] border border-[#292929] flex items-center justify-center text-[#555]">
          {icon}
        </div>
      )}
      <h3 className="text-base font-bold text-white mb-1.5">{title}</h3>
      <p className="text-sm text-[#8A8A8A] mb-6 leading-relaxed">{description}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} variant="outline" size="sm">
          {actionLabel}
        </Button>
      )}
    </div>
  );
};
