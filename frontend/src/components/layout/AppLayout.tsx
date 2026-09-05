import React, { useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { Footer } from './Footer';

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/groups/') || location.pathname.startsWith('/messages');

  // Prevent Spacebar from triggering page scroll down to footer when not in an editable field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        const isEditable = target && (
          target.tagName === 'INPUT' ||
          target.tagName === 'TEXTAREA' ||
          target.isContentEditable ||
          target.getAttribute('role') === 'textbox'
        );
        if (!isEditable) {
          e.preventDefault();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] dark:bg-[#080808] text-neutral-900 dark:text-white selection:bg-neutral-900 selection:text-white dark:selection:bg-white/20 dark:selection:text-white transition-colors duration-200">
      <Navbar />
      <main className={`flex-1 ${isChatPage ? 'pb-2 sm:pb-4' : 'pb-20 md:pb-12'} bg-[#F8F9FA] dark:bg-[#080808]`}>
        <Outlet />
      </main>
      {!isChatPage && <Footer />}
      {!isChatPage && <MobileNav />}
    </div>
  );
};
