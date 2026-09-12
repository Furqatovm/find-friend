import React from 'react';
import { Link } from 'react-router-dom';
import logoImg from '@/assets/logo.png';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-[#1A1A1A] bg-[#000000] py-10">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          {/* Brand */}
          <div className="flex items-center gap-2.5">
            <img
              src={logoImg}
              alt="WithMe Logo"
              className="w-7 h-7 rounded-[6px] object-contain"
            />
            <span className="text-white font-bold text-sm">WithMe</span>
          </div>

          {/* Links */}
          <div className="flex items-center gap-6 text-xs text-[#555] flex-wrap justify-center">
            <Link to="/discover" className="hover:text-white transition-colors">Discover</Link>
            <Link to="/activities" className="hover:text-white transition-colors">Activities</Link>
            <Link to="/projects" className="hover:text-white transition-colors">Projects</Link>
            <Link to="/groups" className="hover:text-white transition-colors">Groups</Link>
          </div>

          {/* Copyright */}
          <p className="text-[11px] text-[#444]">
            © {new Date().getFullYear()} WithMe. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};
