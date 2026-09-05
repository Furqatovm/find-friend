import React, { useState, useEffect } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Compass,
  MapPin,
  Calendar,
  Rocket,
  Users,
  MessageSquare,
  Bell,
  User as UserIcon,
  LogOut,
  Settings,
  Sparkles,
  Search,
  Check,
  Shield,
  Headset,
  Sun,
  Moon
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { Button } from '../ui/Button';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { ContactAdminModal } from '@/components/support/ContactAdminModal';
import { getInitials } from '@/lib/utils';
import type { Notification } from '@/types';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const { notify } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();

  const [showSearchModal, setShowSearchModal] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showContactAdmin, setShowContactAdmin] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  // Global Ctrl+K / Cmd+K listener
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

  useEffect(() => {
    if (!user) return;
    const fetchNotifications = async () => {
      try {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications || []);
        setUnreadCount(res.data.unread_count || 0);
      } catch (err) {
        // ignore
      }
    };
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 20000);
    return () => clearInterval(interval);
  }, [user]);

  const navLinks = [
    { label: 'Discover', path: '/discover', icon: <Compass className="w-3.5 h-3.5" /> },
    { label: 'Nearby', path: '/nearby', icon: <MapPin className="w-3.5 h-3.5" /> },
    { label: 'Activities', path: '/activities', icon: <Calendar className="w-3.5 h-3.5" /> },
    { label: 'Projects', path: '/projects', icon: <Rocket className="w-3.5 h-3.5" /> },
    { label: 'Groups', path: '/groups', icon: <Users className="w-3.5 h-3.5" /> },
    { label: 'Messages', path: '/messages', icon: <MessageSquare className="w-3.5 h-3.5" /> }
  ];

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (e) {
      // ignore
    }
  };

  return (
    <>
      <header className="sticky top-0 z-40 w-full bg-white/95 dark:bg-[#000000]/95 backdrop-blur-md border-b border-neutral-200 dark:border-[#242424] transition-colors duration-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Main Nav */}
          <div className="flex items-center gap-6">
            <Link to={user ? '/dashboard' : '/'} className="flex items-center gap-2.5 group">
              <img
                src="/logo.svg"
                alt="WithMe Logo"
                className="w-8 h-8 rounded-xl shadow-md group-hover:scale-105 transition-transform shrink-0"
              />
              <span className="text-base font-extrabold tracking-tight text-neutral-900 dark:text-white">
                WithMe
              </span>
            </Link>

            {/* Desktop Nav Links */}
            {user && (
              <nav className="hidden lg:flex items-center gap-1">
                {navLinks.map((link) => {
                  const isActive = location.pathname.startsWith(link.path);
                  return (
                    <Link
                      key={link.path}
                      to={link.path}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all ${
                        isActive
                          ? 'bg-neutral-100 text-neutral-900 border border-neutral-300 dark:bg-[#1A1A1A] dark:text-white dark:border-[#2E2E2E] shadow-xs'
                          : 'text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100/60 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414]'
                      }`}
                    >
                      {link.icon}
                      {link.label}
                    </Link>
                  );
                })}

                {user.is_admin && (
                  <Link
                    to="/admin"
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold transition-all ${
                      location.pathname.startsWith('/admin')
                        ? 'bg-red-500/15 text-red-600 dark:text-red-300 border border-red-500/30'
                        : 'bg-neutral-100 border border-neutral-200 text-neutral-700 hover:text-neutral-900 dark:bg-[#141414] dark:border-[#292929] dark:text-[#D4D4D4] dark:hover:text-white'
                    }`}
                  >
                    <Shield className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                    Admin
                  </Link>
                )}
              </nav>
            )}
          </div>

          {/* Search Bar (Quick Command Palette Trigger) - Hidden on Landing Page */}
          {user && location.pathname !== '/' && (
            <div className="flex-1 max-w-xs hidden sm:block">
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="w-full flex items-center justify-between px-3.5 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200/70 border border-neutral-200 text-xs text-neutral-500 hover:text-neutral-900 dark:bg-[#0F0F0F] dark:hover:bg-[#141414] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white transition-all cursor-pointer"
              >
                <span className="flex items-center gap-2">
                  <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-[#5C5C5C]" />
                  <span>Search WithMe...</span>
                </span>
                <kbd className="px-1.5 py-0.5 rounded bg-neutral-200 dark:bg-[#1A1A1A] border border-neutral-300 dark:border-[#292929] text-[10px] text-neutral-600 dark:text-[#8A8A8A] font-mono">
                  Ctrl K
                </kbd>
              </button>
            </div>
          )}

          {/* Right side items */}
          <div className="flex items-center gap-1.5 sm:gap-2.5">
            {/* Theme Toggle Button (Light/Dark) */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414] border border-transparent hover:border-neutral-200 dark:hover:border-[#242424] transition-all cursor-pointer"
              title={theme === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
              aria-label="Toggle Theme"
            >
              {theme === 'dark' ? (
                <Sun className="w-4 h-4 text-amber-400" />
              ) : (
                <Moon className="w-4 h-4 text-neutral-700" />
              )}
            </button>

            {/* Mobile Search Icon Button */}
            {user && location.pathname !== '/' && (
              <button
                type="button"
                onClick={() => setShowSearchModal(true)}
                className="sm:hidden p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414] transition-colors cursor-pointer"
                title="Search"
              >
                <Search className="w-4 h-4" />
              </button>
            )}

            {user ? (
              <>
                {/* Contact Admin Button */}
                <button
                  type="button"
                  onClick={() => setShowContactAdmin(true)}
                  className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 border border-neutral-200 text-xs font-bold text-neutral-800 dark:bg-[#141414] dark:hover:bg-[#1A1A1A] dark:border-[#242424] dark:text-[#D4D4D4] dark:hover:text-white transition-all cursor-pointer"
                  title="Contact Super Admin Support"
                >
                  <Headset className="w-3.5 h-3.5 text-neutral-500 dark:text-[#8A8A8A]" />
                  <span>Contact Admin</span>
                </button>

                {/* Notification Bell */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="relative p-2 rounded-xl text-neutral-600 hover:text-neutral-900 hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414] transition-colors cursor-pointer"
                    aria-label="Notifications"
                  >
                    <Bell className="w-4 h-4" />
                    {unreadCount > 0 && (
                      <span className="absolute top-1.5 right-1.5 w-3.5 h-3.5 bg-amber-500 text-[9px] font-bold text-black rounded-full flex items-center justify-center">
                        {unreadCount > 9 ? '9+' : unreadCount}
                      </span>
                    )}
                  </button>

                  {/* Notifications Dropdown */}
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 sm:w-96 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 shadow-2xl z-50 animate-in fade-in zoom-in-95">
                      <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#242424] mb-3">
                        <h4 className="font-bold text-xs text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
                          <Bell className="w-3.5 h-3.5 text-amber-500" />
                          Notifications
                        </h4>
                        {unreadCount > 0 && (
                          <button
                            type="button"
                            onClick={handleMarkAllRead}
                            className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white flex items-center gap-1 cursor-pointer font-medium"
                          >
                            <Check className="w-3 h-3" />
                            Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-72 overflow-y-auto space-y-1.5">
                        {notifications.length === 0 ? (
                          <p className="text-xs text-neutral-400 dark:text-[#5C5C5C] text-center py-6">No notifications yet</p>
                        ) : (
                          notifications.map((n) => (
                            <div
                              key={n.id}
                              onClick={() => {
                                if (n.link) navigate(n.link);
                                setShowNotifications(false);
                              }}
                              className={`p-2.5 rounded-xl border text-xs cursor-pointer transition-all ${
                                n.is_read
                                  ? 'bg-neutral-50 border-neutral-200 text-neutral-600 dark:bg-[#0F0F0F] dark:border-[#1F1F1F] dark:text-[#8A8A8A]'
                                  : 'bg-neutral-100 border-neutral-300 text-neutral-900 dark:bg-[#141414] dark:border-[#292929] dark:text-white font-medium'
                              }`}
                            >
                              <p className="font-bold text-neutral-900 dark:text-white mb-0.5">{n.title}</p>
                              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] leading-snug">{n.message}</p>
                            </div>
                          ))
                        )}
                      </div>

                      <div className="pt-3 border-t border-neutral-200 dark:border-[#242424] mt-3 text-center">
                        <Link
                          to="/notifications"
                          onClick={() => setShowNotifications(false)}
                          className="text-xs font-bold text-neutral-600 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white transition-colors"
                        >
                          View all notifications
                        </Link>
                      </div>
                    </div>
                  )}
                </div>

                {/* Profile Avatar Dropdown Menu */}
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex items-center gap-2 p-1 rounded-2xl hover:bg-neutral-100 dark:hover:bg-[#141414] transition-colors cursor-pointer"
                  >
                    {user.profile?.avatar_url ? (
                      <img
                        src={user.profile.avatar_url}
                        alt={user.profile.display_name}
                        className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-[#2E2E2E]"
                      />
                    ) : (
                      <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#2E2E2E] flex items-center justify-center font-bold text-xs">
                        {getInitials(user.profile?.display_name || user.username)}
                      </div>
                    )}
                  </button>

                  {showProfileMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-2 shadow-2xl z-50 animate-in fade-in zoom-in-95 space-y-1">
                      <div className="px-3 py-2 border-b border-neutral-200 dark:border-[#242424]">
                        <p className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {user.profile?.display_name || user.username}
                        </p>
                        <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] truncate font-mono">@{user.username}</p>
                      </div>

                      <Link
                        to="/profile"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-700 dark:text-[#D4D4D4] hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-[#1A1A1A] transition-colors font-medium"
                      >
                        <UserIcon className="w-3.5 h-3.5 text-neutral-500 dark:text-[#8A8A8A]" />
                        My Profile
                      </Link>

                      <Link
                        to="/settings"
                        onClick={() => setShowProfileMenu(false)}
                        className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-700 dark:text-[#D4D4D4] hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-[#1A1A1A] transition-colors font-medium"
                      >
                        <Settings className="w-3.5 h-3.5 text-neutral-500 dark:text-[#8A8A8A]" />
                        Settings & Privacy
                      </Link>

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          setShowContactAdmin(true);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-700 dark:text-[#D4D4D4] hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer text-left font-medium"
                      >
                        <Headset className="w-3.5 h-3.5 text-neutral-500 dark:text-[#8A8A8A]" />
                        Contact Admin
                      </button>

                      {user.is_admin && (
                        <Link
                          to="/admin"
                          onClick={() => setShowProfileMenu(false)}
                          className="flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-red-600 dark:text-red-400 hover:bg-red-500/10 font-bold transition-colors"
                        >
                          <Shield className="w-3.5 h-3.5 text-red-500 dark:text-red-400" />
                          Admin Dashboard
                        </Link>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setShowProfileMenu(false);
                          logout();
                          notify.info('Signed Out', 'You have been successfully signed out.');
                          navigate('/login');
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 rounded-xl text-xs text-neutral-500 dark:text-[#8A8A8A] hover:text-red-600 dark:hover:text-red-400 hover:bg-red-500/10 transition-colors cursor-pointer font-medium"
                      >
                        <LogOut className="w-3.5 h-3.5" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link to="/login">
                  <Button variant="ghost" size="sm">
                    Log In
                  </Button>
                </Link>
                <Link to="/register">
                  <Button variant="primary" size="sm">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      </header>

      {/* Global Search Spotlight Modal */}
      <GlobalSearchModal
        isOpen={showSearchModal}
        onClose={() => setShowSearchModal(false)}
      />

      {/* Contact Admin Modal */}
      <ContactAdminModal
        isOpen={showContactAdmin}
        onClose={() => setShowContactAdmin(false)}
      />
    </>
  );
};
