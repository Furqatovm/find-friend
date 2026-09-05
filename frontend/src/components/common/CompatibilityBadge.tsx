import React, { useState } from 'react';
import { Sparkles, Info } from 'lucide-react';
import type { CompatibilityInfo } from '@/types';
import { cn } from '@/lib/utils';

interface CompatibilityBadgeProps {
  compatibility?: CompatibilityInfo;
  size?: 'sm' | 'md' | 'lg';
  showBreakdownOnHover?: boolean;
}

export const CompatibilityBadge: React.FC<CompatibilityBadgeProps> = ({
  compatibility,
  size = 'md',
  showBreakdownOnHover = true
}) => {
  const [showTooltip, setShowTooltip] = useState(false);
  if (!compatibility) return null;

  const score = compatibility.compatibility_score;

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold'
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => showBreakdownOnHover && setShowTooltip(true)}
        onMouseLeave={() => showBreakdownOnHover && setShowTooltip(false)}
        className={cn(
          'inline-flex items-center rounded-full border border-neutral-200 dark:border-[#292929] bg-neutral-100 dark:bg-[#141414] font-medium cursor-help select-none transition-all shadow-xs',
          score >= 80 ? 'text-amber-600 dark:text-amber-400 border-amber-500/30' : 'text-neutral-800 dark:text-[#E5E5E5]',
          sizes[size]
        )}
      >
        <Sparkles className={cn("w-3.5 h-3.5", score >= 80 ? "text-amber-500 dark:text-amber-400" : "text-neutral-500 dark:text-[#8A8A8A]")} />
        <span><strong className="text-neutral-900 dark:text-white font-bold">{score}%</strong> Match</span>
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#292929] rounded-xl p-3.5 shadow-2xl z-50 text-xs text-neutral-800 dark:text-[#D4D4D4] pointer-events-none">
          <div className="flex items-center justify-between font-bold pb-2 border-b border-neutral-200 dark:border-[#242424] mb-2.5">
            <span className="text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Match Breakdown
            </span>
            <span className="text-amber-600 dark:text-amber-400 font-bold">{score}%</span>
          </div>

          <div className="space-y-2">
            {compatibility.breakdown ? (
              <>
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-500 dark:text-[#8A8A8A] mb-0.5">
                    <span>Shared Interests (25%)</span>
                    <span className="text-neutral-900 dark:text-white font-semibold">{compatibility.breakdown.interests}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${compatibility.breakdown.interests}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-500 dark:text-[#8A8A8A] mb-0.5">
                    <span>Shared Goals (20%)</span>
                    <span className="text-neutral-900 dark:text-white font-semibold">{compatibility.breakdown.goals}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${compatibility.breakdown.goals}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-500 dark:text-[#8A8A8A] mb-0.5">
                    <span>Activity & Style (20%)</span>
                    <span className="text-neutral-900 dark:text-white font-semibold">{compatibility.breakdown.activity_style}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${compatibility.breakdown.activity_style}%` }} />
                  </div>
                </div>
                <div>
                  <div className="flex justify-between text-[11px] text-neutral-500 dark:text-[#8A8A8A] mb-0.5">
                    <span>Skills Synergy (10%)</span>
                    <span className="text-neutral-900 dark:text-white font-semibold">{compatibility.breakdown.skills}%</span>
                  </div>
                  <div className="w-full bg-neutral-200 dark:bg-[#1A1A1A] h-1.5 rounded-full overflow-hidden">
                    <div className="h-full rounded-full bg-amber-400" style={{ width: `${compatibility.breakdown.skills}%` }} />
                  </div>
                </div>
              </>
            ) : null}

            {compatibility.shared_interests && compatibility.shared_interests.length > 0 && (
              <div className="pt-1.5 text-[11px] text-neutral-700 dark:text-[#D4D4D4]">
                <span className="text-neutral-500 dark:text-[#8A8A8A]">Common: </span>
                {compatibility.shared_interests.slice(0, 3).join(', ')}
              </div>
            )}
          </div>
          
          <div className="mt-2 text-[10px] text-neutral-400 dark:text-[#5C5C5C] flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Calculated from shared preferences.
          </div>
        </div>
      )}
    </div>
  );
};
