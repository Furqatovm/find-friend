import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer className="border-t border-neutral-200 dark:border-[#242424] bg-neutral-100/50 dark:bg-[#000000] py-12 mt-20 text-neutral-600 dark:text-white transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2.5">
            <img
              src="/logo.svg"
              alt="WithMe Logo"
              className="w-8 h-8 rounded-xl shadow-sm shrink-0"
            />
            <div>
              <p className="text-sm font-bold text-neutral-900 dark:text-white">WithMe</p>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">Find people who want to do the same things you do.</p>
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-6 text-xs text-neutral-600 dark:text-[#8A8A8A]">
            <Link to="/discover" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Discover</Link>
            <Link to="/nearby" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Nearby</Link>
            <Link to="/activities" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Activities</Link>
            <Link to="/projects" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Projects</Link>
            <Link to="/groups" className="hover:text-neutral-900 dark:hover:text-white transition-colors">Communities</Link>
            <Link to="/settings" className="hover:text-neutral-900 dark:hover:text-white transition-colors flex items-center gap-1">
              <Shield className="w-3.5 h-3.5 text-neutral-800 dark:text-white" />
              Privacy First
            </Link>
          </div>

          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] flex items-center gap-1">
            Built with <Heart className="w-3.5 h-3.5 text-red-500 fill-red-500" /> for collaborative minds
          </p>
        </div>
      </div>
    </footer>
  );
};
