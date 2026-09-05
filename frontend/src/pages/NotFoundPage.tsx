import React from 'react';
import { Link } from 'react-router-dom';
import { Compass, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/Button';

export const NotFoundPage: React.FC = () => {
  return (
    <div className="min-h-[70vh] flex items-center justify-center px-4 py-16 text-center text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="max-w-md space-y-4">
        <div className="w-16 h-16 rounded-2xl bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] text-neutral-900 dark:text-white flex items-center justify-center mx-auto shadow-sm">
          <Compass className="w-8 h-8" />
        </div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">PAGE NOT FOUND</h1>
        <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#8A8A8A]">
          The page you are looking for doesn't exist or has been moved.
        </p>
        <div className="pt-2">
          <Link to="/discover">
            <Button variant="primary" size="md" className="font-bold">
              Explore Discover
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};
