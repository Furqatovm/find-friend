import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Compass, MapPin, MessageSquare, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

interface MobileNavProps {
  unreadCount?: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ unreadCount = 0 }) => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const items = [
    { label: 'Home',     path: '/dashboard',  icon: Home },
    { label: 'Discover', path: '/discover',   icon: Compass },
    { label: 'Nearby',   path: '/nearby',     icon: MapPin },
    { label: 'Chat',     path: '/messages',   icon: MessageSquare, badge: unreadCount },
    { label: 'Profile',  path: '/profile',    icon: User },
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-[#0A0A0A] border-t border-[#1E1E1E] px-2 py-2">
      <div className="flex items-center justify-around">
        {items.map(({ label, path, icon: Icon, badge }) => {
          const isActive =
            path === '/dashboard'
              ? location.pathname === path
              : location.pathname.startsWith(path);

          return (
            <Link
              key={path}
              to={path}
              className={`relative flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-[8px] transition-all duration-150 min-w-[48px] ${
                isActive
                  ? 'text-white'
                  : 'text-[#555] hover:text-[#888]'
              }`}
            >
              <div className="relative">
                <Icon className={`w-5 h-5 transition-colors ${isActive ? 'text-[#FFAA2B]' : ''}`} />
                {badge && badge > 0 && (
                  <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-[#FFAA2B] text-black text-[9px] font-bold flex items-center justify-center">
                    {badge > 9 ? '9+' : badge}
                  </span>
                )}
              </div>
              <span className={`text-[10px] font-medium ${isActive ? 'text-white' : ''}`}>
                {label}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
