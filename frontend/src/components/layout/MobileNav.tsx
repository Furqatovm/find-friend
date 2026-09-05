import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Compass, MapPin, MessageSquare, Home, User } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';

export const MobileNav: React.FC = () => {
  const { user } = useAuth();
  const location = useLocation();

  if (!user) return null;

  const items = [
    { label: 'Home', path: '/dashboard', icon: <Home className="w-5 h-5" /> },
    { label: 'Discover', path: '/discover', icon: <Compass className="w-5 h-5" /> },
    { label: 'Nearby', path: '/nearby', icon: <MapPin className="w-5 h-5" /> },
    { label: 'Chat', path: '/messages', icon: <MessageSquare className="w-5 h-5" /> },
    { label: 'Profile', path: '/profile', icon: <User className="w-5 h-5" /> }
  ];

  return (
    <div className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-white/95 dark:bg-[#000000]/95 backdrop-blur-lg border-t border-neutral-200 dark:border-[#242424] px-2 py-2 transition-colors duration-200">
      <div className="flex items-center justify-around">
        {items.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center gap-1 px-3 py-1 rounded-xl text-[10px] font-medium transition-colors ${
                isActive
                  ? 'text-neutral-900 font-bold dark:text-white'
                  : 'text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white'
              }`}
            >
              {item.icon}
              <span>{item.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
};
