import React, { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';
import { cn } from '@/lib/utils';

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  description?: string;
  children: React.ReactNode;
  maxWidth?: string;
}

export const Dialog: React.FC<DialogProps> = ({
  isOpen,
  onClose,
  title,
  description,
  children,
  maxWidth = 'max-w-lg'
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/40 dark:bg-black/85 backdrop-blur-md"
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 8 }}
            transition={{ type: 'spring', damping: 26, stiffness: 380 }}
            className={cn(
              'relative w-full bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl shadow-2xl z-10 text-neutral-900 dark:text-white transition-colors duration-200 flex flex-col max-h-[90vh]',
              maxWidth
            )}
          >
            <div className="flex items-start justify-between p-6 pb-4 border-b border-neutral-200 dark:border-[#242424] shrink-0">
              <div>
                {title && <h3 className="text-base font-bold text-neutral-900 dark:text-white tracking-tight">{title}</h3>}
                {description && <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">{description}</p>}
              </div>
              <button
                type="button"
                onClick={onClose}
                className="text-neutral-400 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <div className="p-6 pt-5 overflow-y-auto flex-1">
              {children}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
