import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTimeAgo(dateString?: string): string {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

export function getInitials(name: string): string {
  if (!name) return '?';
  const parts = name.trim().split(' ');
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

export function getCategoryBadgeColor(category: string): string {
  // Black-first subtle category badges
  const cat = category.toLowerCase();
  if (cat.includes('study') || cat.includes('sat')) return 'bg-[#141414] text-[#E5E5E5] border-[#292929]';
  if (cat.includes('coding') || cat.includes('tech') || cat.includes('ai')) return 'bg-[#141414] text-[#FFFFFF] border-[#333333]';
  if (cat.includes('game') || cat.includes('gaming')) return 'bg-[#141414] text-[#D4D4D4] border-[#292929]';
  if (cat.includes('language') || cat.includes('ielts')) return 'bg-[#141414] text-[#E5E5E5] border-[#292929]';
  if (cat.includes('startup') || cat.includes('project')) return 'bg-amber-500/10 text-amber-400 border-amber-500/25';
  return 'bg-[#141414] text-[#D4D4D4] border-[#242424]';
}
