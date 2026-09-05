import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface TabItem {
  id: string;
  label: string;
  count?: number;
  icon?: React.ReactNode;
}

interface TabsProps {
  tabs: TabItem[];
  activeTab: string;
  onChange: (tabId: string) => void;
  className?: string;
}

export const Tabs: React.FC<TabsProps> = ({ tabs, activeTab, onChange, className }) => {
  return (
    <div className={cn('flex items-center gap-1.5 p-1 bg-slate-900/90 border border-slate-800 rounded-xl overflow-x-auto no-scrollbar', className)}>
      {tabs.map((tab) => {
        const isActive = activeTab === tab.id;
        return (
          <button
            key={tab.id}
            onClick={() => onChange(tab.id)}
            className={cn(
              'relative px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors duration-150 flex items-center gap-2 whitespace-nowrap cursor-pointer',
              isActive ? 'text-white font-semibold' : 'text-slate-400 hover:text-slate-200'
            )}
          >
            {isActive && (
              <motion.div
                layoutId="activeTabBadge"
                className="absolute inset-0 bg-slate-800 border border-slate-700/80 rounded-lg shadow-sm"
                transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              />
            )}
            <span className="relative z-10 flex items-center gap-1.5">
              {tab.icon}
              {tab.label}
              {tab.count !== undefined && (
                <span className={cn(
                  'px-1.5 py-0.2 rounded-full text-[10px]',
                  isActive ? 'bg-indigo-500/20 text-indigo-300 font-bold' : 'bg-slate-800 text-slate-400'
                )}>
                  {tab.count}
                </span>
              )}
            </span>
          </button>
        );
      })}
    </div>
  );
};
