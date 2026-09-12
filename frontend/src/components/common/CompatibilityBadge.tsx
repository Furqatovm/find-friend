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

  const scoreColor =
    score >= 80
      ? 'text-[#FFAA2B] border-[#FFAA2B]/30 bg-[#FFAA2B]/10'
      : score >= 60
      ? 'text-[#D4D4D4] border-[#292929] bg-[#1A1A1A]'
      : 'text-[#8A8A8A] border-[#242424] bg-[#141414]';

  const sizes = {
    sm: 'text-[11px] px-2 py-0.5 gap-1',
    md: 'text-xs px-2.5 py-1 gap-1.5',
    lg: 'text-sm px-3.5 py-1.5 gap-2 font-semibold',
  };

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => showBreakdownOnHover && setShowTooltip(true)}
        onMouseLeave={() => showBreakdownOnHover && setShowTooltip(false)}
        className={cn(
          'inline-flex items-center rounded-full border font-medium cursor-help select-none transition-all',
          scoreColor,
          sizes[size]
        )}
      >
        <Sparkles className={cn('w-3.5 h-3.5', score >= 80 ? 'text-[#FFAA2B]' : 'text-[#8A8A8A]')} />
        <span>
          <strong className="text-white font-bold">{score}%</strong> Match
        </span>
      </div>

      {showTooltip && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-64 bg-[#141414] border border-[#292929] rounded-[12px] p-3.5 shadow-[0_8px_32px_rgba(0,0,0,0.9)] z-50 text-xs text-[#D4D4D4] pointer-events-none animate-in">
          <div className="flex items-center justify-between font-bold pb-2 border-b border-[#242424] mb-2.5">
            <span className="text-white flex items-center gap-1.5">
              <Sparkles className="w-3.5 h-3.5 text-[#FFAA2B]" />
              Match Breakdown
            </span>
            <span className="text-[#FFAA2B] font-bold">{score}%</span>
          </div>

          <div className="space-y-2">
            {compatibility.breakdown ? (
              <>
                {[
                  { label: 'Shared Interests (25%)', value: compatibility.breakdown.interests },
                  { label: 'Shared Goals (20%)', value: compatibility.breakdown.goals },
                  { label: 'Activity & Style (20%)', value: compatibility.breakdown.activity_style },
                  { label: 'Skills Synergy (10%)', value: compatibility.breakdown.skills },
                ].map((item) => (
                  <div key={item.label}>
                    <div className="flex justify-between text-[11px] text-[#8A8A8A] mb-1">
                      <span>{item.label}</span>
                      <span className="text-white font-semibold">{item.value}%</span>
                    </div>
                    <div className="w-full bg-[#222222] h-1 rounded-full overflow-hidden">
                      <div
                        className="h-full rounded-full bg-[#FFAA2B]"
                        style={{ width: `${item.value}%` }}
                      />
                    </div>
                  </div>
                ))}
              </>
            ) : null}

            {compatibility.shared_interests && compatibility.shared_interests.length > 0 && (
              <div className="pt-1.5 text-[11px] text-[#D4D4D4]">
                <span className="text-[#8A8A8A]">Common: </span>
                {compatibility.shared_interests.slice(0, 3).join(', ')}
              </div>
            )}
          </div>

          <div className="mt-2 text-[10px] text-[#555] flex items-center gap-1">
            <Info className="w-3 h-3 shrink-0" />
            Calculated from shared preferences.
          </div>
        </div>
      )}
    </div>
  );
};
