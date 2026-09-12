import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../ui/Button';
import logoImg from '@/assets/logo.png';

interface NavbarProps {
  onSearchOpen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ onSearchOpen }) => {
  const { user } = useAuth();

  return (
    <header className="sticky top-0 z-40 w-full bg-[#000000]/95 backdrop-blur-md border-b border-[#1A1A1A]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-4">
        {/* Logo */}
        <Link to="/" className="flex items-center gap-2.5 group shrink-0">
          <img
            src={logoImg}
            alt="WithMe Logo"
            className="w-8 h-8 rounded-[8px] object-contain shrink-0 group-hover:scale-105 transition-transform"
          />
          <span className="text-white font-bold text-base tracking-tight">WithMe</span>
        </Link>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {user ? (
            <>
              {onSearchOpen && (
                <button
                  type="button"
                  onClick={onSearchOpen}
                  className="p-2 rounded-[8px] text-[#555] hover:text-white hover:bg-[#141414] transition-all cursor-pointer"
                  aria-label="Search"
                >
                  <Search className="w-4 h-4" />
                </button>
              )}
              <Link to="/dashboard">
                <Button variant="outline" size="sm">Dashboard</Button>
              </Link>
            </>
          ) : (
            <>
              <Link to="/login">
                <Button variant="ghost" size="sm">Sign In</Button>
              </Link>
              <Link to="/register">
                <Button variant="primary" size="sm">Get Started</Button>
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
};
