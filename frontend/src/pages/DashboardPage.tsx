import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  MapPin,
  ArrowRight,
  BookOpen,
  Code,
  Gamepad2,
  Globe,
  Palette
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { UserCard } from '@/components/cards/UserCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { Button } from '@/components/ui/Button';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { UserCardData, Activity, Project } from '@/types';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading: loading, refetch: fetchDashboardData } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const [peopleRes, actRes, projRes] = await Promise.all([
        api.get('/discover'),
        api.get('/activities'),
        api.get('/projects')
      ]);
      return {
        people: (peopleRes.data || []).slice(0, 6) as UserCardData[],
        activities: (actRes.data || []).slice(0, 3) as Activity[],
        projects: (projRes.data || []).slice(0, 3) as Project[]
      };
    }
  });

  const recommendedPeople = dashboardData?.people || [];
  const upcomingActivities = dashboardData?.activities || [];
  const featuredProjects = dashboardData?.projects || [];

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const actionPills = [
    { label: 'STUDY', icon: <BookOpen className="w-3.5 h-3.5" />, query: 'Study' },
    { label: 'BUILD', icon: <Code className="w-3.5 h-3.5" />, query: 'Coding' },
    { label: 'PLAY', icon: <Gamepad2 className="w-3.5 h-3.5" />, query: 'Gaming' },
    { label: 'PRACTICE', icon: <Globe className="w-3.5 h-3.5" />, query: 'Languages' },
    { label: 'CREATE', icon: <Palette className="w-3.5 h-3.5" />, query: 'Creative' }
  ];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-16 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* 1. Command Center Hero */}
      <section className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-8 sm:p-10 relative overflow-hidden shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 pb-8 border-b border-neutral-200 dark:border-[#242424]">
          <div className="space-y-1.5">
            <h1 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">
              {getGreeting()}, {user?.profile?.display_name || user?.username || 'Alex'}.
            </h1>
            <p className="text-sm text-neutral-500 dark:text-[#8A8A8A]">
              What do you want to do today?
            </p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/nearby">
              <Button variant="secondary" size="md" className="text-xs">
                <MapPin className="w-3.5 h-3.5 text-neutral-500 dark:text-[#8A8A8A]" />
                Nearby Map
              </Button>
            </Link>
            <Link to="/activities/create">
              <Button variant="primary" size="md" className="text-xs font-bold">
                + Host Activity
              </Button>
            </Link>
          </div>
        </div>

        {/* Action Pills */}
        <div className="pt-6">
          <p className="text-xs font-bold text-neutral-500 dark:text-[#8A8A8A] uppercase tracking-wider mb-3">Quick Intent Filter</p>
          <div className="flex flex-wrap gap-2.5">
            {actionPills.map((p, i) => (
              <button
                key={i}
                type="button"
                onClick={() => navigate(`/discover?category=${encodeURIComponent(p.query)}`)}
                className="flex items-center gap-2 px-4 py-2 bg-neutral-100 dark:bg-[#141414] hover:bg-neutral-200 dark:hover:bg-[#1C1C1C] border border-neutral-200 dark:border-[#292929] hover:border-neutral-400 dark:hover:border-white/40 rounded-xl text-xs font-bold text-neutral-900 dark:text-white transition-all cursor-pointer shadow-xs"
              >
                {p.icon}
                <span>{p.label}</span>
              </button>
            ))}
          </div>
        </div>
      </section>

      {/* 2. People you may want to meet */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">People you may want to meet</h2>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">Ranked by your learning preferences and schedule compatibility</p>
          </div>
          <Link to="/discover" className="text-xs font-bold text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1">
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {[1, 2, 3].map((i) => (
              <UserCardSkeleton key={i} />
            ))}
          </div>
        ) : recommendedPeople.length === 0 ? (
          <div className="p-8 rounded-2xl bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] text-center text-xs text-neutral-500 dark:text-[#8A8A8A]">
            No recommended profiles found yet. Complete your preferences in settings!
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {recommendedPeople.map((person) => (
              <UserCard
                key={person.id}
                user={person}
                onConnectSuccess={fetchDashboardData}
                onFollowSuccess={fetchDashboardData}
              />
            ))}
          </div>
        )}
      </section>

      {/* 3. Nearby activities */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Nearby activities & study sessions</h2>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">Open sessions happening this week</p>
          </div>
          <Link to="/activities" className="text-xs font-bold text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1">
            Browse all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {upcomingActivities.map((act) => (
            <ActivityCard key={act.id} activity={act} onUpdate={fetchDashboardData} />
          ))}
        </div>
      </section>

      {/* 4. Active Collaborations & Projects */}
      <section className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Open projects recruiting teammates</h2>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">Collaborative startup MVPs and research repositories</p>
          </div>
          <Link to="/projects" className="text-xs font-bold text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1">
            Explore projects <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {featuredProjects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} onUpdate={fetchDashboardData} />
          ))}
        </div>
      </section>
    </div>
  );
};
