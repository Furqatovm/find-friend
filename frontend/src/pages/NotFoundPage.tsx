import React from 'react';
import { Link } from 'react-router-dom';
import { Home } from 'lucide-react';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center px-4 text-center">
      <div className="mb-8">
        <span className="text-8xl font-black text-[#1A1A1A]">404</span>
      </div>
      <h1 className="text-2xl font-bold text-white mb-2">Page not found</h1>
      <p className="text-sm text-[#8A8A8A] mb-8 max-w-xs">
        The page you're looking for doesn't exist or has been moved.
      </p>
      <Link
        to="/dashboard"
        className="inline-flex items-center gap-2 px-5 py-2.5 rounded-[10px] bg-[#FFAA2B] hover:bg-[#FFB83D] text-black font-semibold text-sm transition-all"
      >
        <Home className="w-4 h-4" />
        Back to Home
      </Link>
    </div>
  );
};
