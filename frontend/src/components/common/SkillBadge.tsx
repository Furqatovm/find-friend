import React from 'react';
import type { UserSkill } from '@/types';
import { cn } from '@/lib/utils';

interface SkillBadgeProps {
  skill: UserSkill;
  size?: 'sm' | 'md';
}

export const SkillBadge: React.FC<SkillBadgeProps> = ({ skill, size = 'md' }) => {
  const dotColors = {
    Beginner:     'bg-[#555]',
    Intermediate: 'bg-[#FFAA2B]',
    Advanced:     'bg-white',
  };

  return (
    <span
      className={cn(
        'inline-flex items-center rounded-[6px] border border-[#292929] bg-[#1A1A1A] font-medium select-none text-[#D4D4D4]',
        size === 'sm' ? 'px-2 py-0.5 text-[11px] gap-1.5' : 'px-2.5 py-1 text-xs gap-2'
      )}
    >
      <span className="text-white font-medium">{skill.name}</span>
      <span className="flex items-center gap-1 text-[10px] text-[#8A8A8A]">
        <span className={cn('w-1.5 h-1.5 rounded-full', dotColors[skill.level] || 'bg-[#555]')} />
        {skill.level}
      </span>
    </span>
  );
};
