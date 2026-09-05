import React from 'react';
import type { UserSkill } from '@/types';
import { cn } from '@/lib/utils';

interface SkillBadgeProps {
  skill: UserSkill;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, size = 'md' }) => {
  const dotColors = {
    Beginner: 'bg-neutral-400 dark:bg-[#8A8A8A]',
    Intermediate: 'bg-amber-500 dark:bg-amber-400',
    Advanced: 'bg-neutral-900 dark:bg-white'
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-lg border border-neutral-200 dark:border-[#242424] bg-neutral-100 dark:bg-[#141414] font-medium select-none text-neutral-800 dark:text-[#D4D4D4]',
        size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1.5' : 'px-2.5 py-1 text-xs gap-2'
      )}
    >
      <span className="text-neutral-900 dark:text-white font-medium">{skill.name}</span>
      <span className="flex items-center gap-1 text-[10px] text-neutral-500 dark:text-[#8A8A8A]">
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[skill.level] || 'bg-neutral-400')} />
        {skill.level}
      </span>
    </span>
  );
};
