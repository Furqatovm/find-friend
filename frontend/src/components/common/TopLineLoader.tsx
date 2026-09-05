import React, { useEffect, useState } from 'react';import { useIsFetching, useIsMutating } from '@tanstack/react-query';
import { useLocation } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { onActiveRequestsChange } from '@/lib/api';

export const TopLineLoader: React.FC = () => {
  const isFetching = useIsFetching();
  const isMutating = useIsMutating();
  const location = useLocation();

  const [activeAxiosRequests, setActiveAxiosRequests] = useState(0);
  const [navigating, setNavigating] = useState(false);
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);

  // Subscribe to Axios request interceptor
  useEffect(() => {
    return onActiveRequestsChange((count) => {
      setActiveAxiosRequests(count);
    });
  }, []);

  // Trigger brief loader on navigation
  useEffect(() => {
    setNavigating(true);
    const timer = setTimeout(() => setNavigating(false), 350);
    return () => clearTimeout(timer);
  }, [location.pathname, location.search]);

  const isLoading = isFetching > 0 || isMutating > 0 || activeAxiosRequests > 0 || navigating;

  useEffect(() => {
    let interval: ReturnType<typeof setInterval> | undefined;

    if (isLoading) {
      setVisible(true);
      setProgress((prev) => (prev < 15 ? 20 : prev));

      interval = setInterval(() => {
        setProgress((prev) => {
          if (prev < 50) return prev + Math.random() * 12 + 4;
          if (prev < 80) return prev + Math.random() * 5 + 1;
          if (prev < 92) return prev + Math.random() * 1.5;
          return prev;
        });
      }, 180);
    } else {
      if (visible) {
        setProgress(100);
        const hideTimer = setTimeout(() => {
          setVisible(false);
          setProgress(0);
        }, 320);
        return () => clearTimeout(hideTimer);
      }
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [isLoading, visible]);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none overflow-hidden bg-transparent"
        >
          { /* Main animated progress bar */ }
          <motion.div
            className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-cyan-400 relative"
            style={{
              boxShadow: '0 0 10px rgba(99, 102, 241, 0.7), 0 0 5px rgba(56, 189, 248, 0.8)'
            }}
            initial={{ width: '0%' }}
            animate={{ width: ` ${progress || 0 }%` }}
            transition={{
              ease: progress === 100 ? 'easeInOut' : 'easeOut',
              duration: progress === 100 ? 0.2 : 0.25
            }}
          >
            { /* Glowing shimmer pulse at the leading tip */ }
            <div className="absolute right-0 top-0 bottom-0 w-24 bg-gradient-to-r from-transparent to-white/60 blur-[1px]" />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
