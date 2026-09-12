import React, { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home,
  Compass,
  MapPin,
  MessageSquare,
  Calendar,
  Rocket,
  Users,
  Settings,
  LogOut,
  Bell,
  Search,
  Shield,
  Headset,
  ChevronRight,
  Check,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { getInitials } from '@/lib/utils';
import { GlobalSearchModal } from '@/components/search/GlobalSearchModal';
import { ContactAdminModal } from '@/components/support/ContactAdminModal';
import logoImg from '@/assets/logo.png';

const navLinks = [
  { label: 'Home',       path: '/dashboard',  icon: Home },
  { label: 'Discover',   path: '/discover',   icon: Compass },
  { label: 'Nearby',     path: '/nearby',     icon: MapPin },
  { label: 'Messages',   path: '/messages',   icon: MessageSquare },
  { label: 'Activities', path: '/activities', icon: Calendar },
  { label: 'Projects',   path: '/projects',   icon: Rocket },
  { label: 'Groups',     path: '/groups',     icon: Users },
];

interface SidebarProps {
  unreadCount?: number;
  onSearchOpen?: () => void;
  onContactAdminOpen?: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  unreadCount = 0,
  onSearchOpen,
  onContactAdminOpen,
}) => {
  const { user, logout } = useAuth();
  const { notify } = useNotification();
  const location = useLocation();
  const navigate = useNavigate();
  const [profileMenuOpen, setProfileMenuOpen] = useState(false);

  if (!user) return null;

  const handleLogout = () => {
    setProfileMenuOpen(false);
    logout();
    notify.info('Signed Out', 'You have been successfully signed out.');
    navigate('/login');
  };

  return (
    <aside className="hidden md:flex flex-col fixed left-0 top-0 h-screen w-[220px] xl:w-[240px] bg-[#0A0A0A] border-r border-[#1E1E1E] z-50 shrink-0">
      {/* Logo */}
      <div className="px-5 pt-6 pb-5">
        <Link
          to="/dashboard"
          className="flex items-center gap-2.5 group"
        >
          <img
            src={logoImg}
            alt="WithMe Logo"
            className="w-8 h-8 rounded-[8px] object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <span className="text-white font-bold text-base tracking-tight">WithMe</span>
        </Link>
      </div>

      {/* Search trigger */}
      <div className="px-3 mb-4">
        <button
          type="button"
          onClick={onSearchOpen}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] bg-[#141414] border border-[#242424] hover:border-[#333] text-[#555] hover:text-[#888] transition-all text-xs cursor-pointer"
        >
          <Search className="w-3.5 h-3.5 shrink-0" />
          <span className="flex-1 text-left">Search...</span>
          <kbd className="text-[10px] text-[#444] font-mono">⌘K</kbd>
        </button>
      </div>

      {/* Nav links */}
      <nav className="flex-1 px-3 space-y-0.5 overflow-y-auto">
        {navLinks.map(({ label, path, icon: Icon }) => {
          const isActive = location.pathname.startsWith(path);
          const hasUnread = label === 'Messages' && unreadCount > 0;

          return (
            <Link
              key={path}
              to={path}
              className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-all duration-150 group relative ${
                isActive
                  ? 'bg-[#1A1A1A] text-white'
                  : 'text-[#8A8A8A] hover:text-white hover:bg-[#141414]'
              }`}
            >
              <Icon
                className={`w-4 h-4 shrink-0 transition-colors ${
                  isActive ? 'text-[#FFAA2B]' : 'text-[#555] group-hover:text-[#8A8A8A]'
                }`}
              />
              <span>{label}</span>
              {isActive && (
                <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-4 bg-[#FFAA2B] rounded-r" />
              )}
              {hasUnread && (
                <span className="ml-auto w-5 h-5 rounded-full bg-[#FFAA2B] text-black text-[10px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          );
        })}

        {/* Admin link */}
        {user.is_admin && (
          <Link
            to="/admin"
            className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-bold transition-all duration-150 mt-1 ${
              location.pathname.startsWith('/admin')
                ? 'bg-red-500/10 text-red-400'
                : 'text-[#8A8A8A] hover:text-red-400 hover:bg-red-500/5'
            }`}
          >
            <Shield className="w-4 h-4 shrink-0 text-red-500" />
            Admin
          </Link>
        )}
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 pt-3 border-t border-[#1E1E1E] space-y-0.5">
        {/* Notifications */}
        <Link
          to="/notifications"
          className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-all duration-150 relative ${
            location.pathname === '/notifications'
              ? 'bg-[#1A1A1A] text-white'
              : 'text-[#8A8A8A] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Bell className="w-4 h-4 shrink-0 text-[#555]" />
          <span>Notifications</span>
          {unreadCount > 0 && (
            <span className="ml-auto w-4 h-4 rounded-full bg-[#FFAA2B] text-black text-[9px] font-bold flex items-center justify-center">
              {unreadCount > 9 ? '9+' : unreadCount}
            </span>
          )}
        </Link>

        {/* Settings */}
        <Link
          to="/settings"
          className={`flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium transition-all duration-150 ${
            location.pathname === '/settings'
              ? 'bg-[#1A1A1A] text-white'
              : 'text-[#8A8A8A] hover:text-white hover:bg-[#141414]'
          }`}
        >
          <Settings className={`w-4 h-4 shrink-0 ${location.pathname === '/settings' ? 'text-[#FFAA2B]' : 'text-[#555]'}`} />
          <span>Settings</span>
        </Link>

        {/* Support */}
        <button
          type="button"
          onClick={onContactAdminOpen}
          className="w-full flex items-center gap-3 px-3 py-2 rounded-[8px] text-sm font-medium text-[#8A8A8A] hover:text-white hover:bg-[#141414] transition-all duration-150 cursor-pointer"
        >
          <Headset className="w-4 h-4 shrink-0 text-[#555]" />
          <span>Support</span>
        </button>

        {/* User profile */}
        <div className="relative mt-2 pt-2 border-t border-[#1E1E1E]">
          <button
            type="button"
            onClick={() => setProfileMenuOpen(!profileMenuOpen)}
            className="w-full flex items-center gap-2.5 px-2 py-2 rounded-[8px] hover:bg-[#141414] transition-colors cursor-pointer"
          >
            {user.profile?.avatar_url ? (
              <img
                src={user.profile.avatar_url}
                alt={user.profile.display_name}
                className="w-8 h-8 rounded-full object-cover border border-[#2E2E2E] shrink-0"
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center font-bold text-xs text-white shrink-0">
                {getInitials(user.profile?.display_name || user.username)}
              </div>
            )}
            <div className="flex-1 text-left min-w-0">
              <p className="text-xs font-semibold text-white truncate">
                {user.profile?.display_name || user.username}
              </p>
              <p className="text-[10px] text-[#555] truncate">@{user.username}</p>
            </div>
            <ChevronRight className="w-3.5 h-3.5 text-[#555] shrink-0" />
          </button>

          {/* Profile dropdown */}
          {profileMenuOpen && (
            <div className="absolute bottom-full left-0 right-0 mb-1 bg-[#141414] border border-[#292929] rounded-[12px] p-1.5 shadow-[0_8px_32px_rgba(0,0,0,0.9)] z-50 animate-in space-y-0.5">
              <Link
                to="/profile"
                onClick={() => setProfileMenuOpen(false)}
                className="flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs text-[#D4D4D4] hover:text-white hover:bg-[#1A1A1A] transition-colors"
              >
                My Profile
              </Link>
              <button
                type="button"
                onClick={handleLogout}
                className="w-full flex items-center gap-2.5 px-3 py-2 rounded-[8px] text-xs text-[#8A8A8A] hover:text-red-400 hover:bg-red-500/5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5" />
                Sign Out
              </button>
            </div>
          )}
        </div>
      </div>
    </aside>
  );
};
