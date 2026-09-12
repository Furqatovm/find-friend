import React, { useEffect, useState, useRef } from 'react';
import { useLocation } from 'react-router-dom';

export const TopLineLoader: React.FC = () => {
  const location = useLocation();
  const [progress, setProgress] = useState(0);
  const [visible, setVisible] = useState(false);
  const isFirstRender = useRef(true);

  const timersRef = useRef<ReturnType<typeof setTimeout>[]>([]);

  const clearAllTimers = () => {
    timersRef.current.forEach(clearTimeout);
    timersRef.current = [];
  };

  useEffect(() => {
    // Skip initial page load so loader doesn't flash on first mount
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }

    // Clean up any existing running transition
    clearAllTimers();

    // Start route transition animation
    setVisible(true);
    setProgress(35);

    // Smooth progression: 35% -> 80% -> 100% -> fade out
    const t1 = setTimeout(() => {
      setProgress(80);
    }, 100);

    const t2 = setTimeout(() => {
      setProgress(100);
    }, 250);

    const t3 = setTimeout(() => {
      setVisible(false);
    }, 450);

    const t4 = setTimeout(() => {
      setProgress(0);
    }, 600);

    timersRef.current = [t1, t2, t3, t4];

    return clearAllTimers;
  }, [location.pathname]);

  // Clean up on unmount
  useEffect(() => {
    return clearAllTimers;
  }, []);

  if (!visible && progress === 0) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[99999] h-[3px] pointer-events-none transition-opacity duration-200 ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
    >
      <div
        className="h-full bg-gradient-to-r from-[#FFAA2B] via-[#FFB83D] to-[#FFD580] relative"
        style={{
          width: `${progress}%`,
          transition: progress === 100 ? 'width 150ms ease-out' : 'width 250ms cubic-bezier(0.4, 0, 0.2, 1)',
          boxShadow: '0 0 10px rgba(255, 170, 43, 0.8), 0 0 4px rgba(255, 170, 43, 0.6)'
        }}
      >
        {/* Glow tip */}
        <div className="absolute right-0 top-0 bottom-0 w-16 bg-gradient-to-r from-transparent to-white/70 blur-[1px]" />
      </div>
    </div>
  );
};
