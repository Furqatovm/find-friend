import React, { useEffect, useState } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Sidebar } from './Sidebar';
import { Navbar } from './Navbar';
import { MobileNav } from './MobileNav';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { ContactAdminModal } from '@/components/support/ContactAdminModal';

// Pages that use the sidebar layout (authenticated app)
const SIDEBAR_PATHS = [
  '/dashboard',
  '/discover',
  '/nearby',
  '/messages',
  '/activities',
  '/projects',
  '/groups',
  '/profile',
  '/users',
  '/notifications',
  '/settings',
  '/admin',
  '/search',
];

export const AppLayout: React.FC = () => {
  const location = useLocation();
  const { user } = useAuth();
  const { unreadCount } = useNotification();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);

  const isSidebarLayout =
    !!user &&
    SIDEBAR_PATHS.some((p) => location.pathname.startsWith(p));

  const isChatPage =
    location.pathname.startsWith('/groups/') ||
    location.pathname.startsWith('/messages');

  // Prevent Spacebar from triggering page scroll when not in an editable field
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === ' ' || e.code === 'Space') {
        const target = e.target as HTMLElement | null;
        const isEditable =
          target &&
          (target.tagName === 'INPUT' ||
            target.tagName === 'TEXTAREA' ||
            target.isContentEditable ||
            target.getAttribute('role') === 'textbox');
        if (!isEditable) e.preventDefault();
      }
    };
    window.addEventListener('keydown', handleKeyDown, { passive: false });
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Ctrl+K listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setShowSearchModal((prev) => !prev);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  if (isSidebarLayout) {
    return (
      <div className="min-h-screen bg-[#000000] text-white flex">
        {/* Left Sidebar */}
        <Sidebar
          unreadCount={unreadCount}
          onSearchOpen={() => setShowSearchModal(true)}
          onContactAdminOpen={() => setShowContactAdmin(true)}
        />

        {/* Main content area — offset by sidebar width */}
        <main
          className={`flex-1 min-h-screen md:ml-[220px] xl:ml-[240px] ${
            isChatPage ? '' : 'pb-20 md:pb-0'
          }`}
        >
          <Outlet />
        </main>

        {/* Mobile bottom nav */}
        {!isChatPage && <MobileNav unreadCount={unreadCount} />}

        {/* Modals */}
        <GlobalSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
        <ContactAdminModal isOpen={showContactAdmin} onClose={() => setShowContactAdmin(false)} />
      </div>
    );
  }

  // Landing / Auth layout — no sidebar
  return (
    <div className="min-h-screen flex flex-col bg-[#000000] text-white">
      <Navbar onSearchOpen={() => setShowSearchModal(true)} />
      <main className="flex-1">
        <Outlet />
      </main>
      <GlobalSearchModal isOpen={showSearchModal} onClose={() => setShowSearchModal(false)} />
    </div>
  );
};
