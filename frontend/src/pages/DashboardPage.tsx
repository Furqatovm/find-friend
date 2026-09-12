import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import {
  BookOpen, Code2, Gamepad2, Globe, Palette, ArrowRight, MapPin, Plus
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import { useQuery } from '@tanstack/react-query';
import { UserCard } from '@/components/cards/UserCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { UserCardData, Activity, Project } from '@/types';

const getGreeting = () => {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
};

const actionCards = [
  {
    label: 'Study',
    desc: 'Learn together',
    icon: BookOpen,
    query: 'Study',
    color: 'text-blue-400',
  },
  {
    label: 'Build',
    desc: 'Work on projects',
    icon: Code2,
    query: 'Coding',
    color: 'text-purple-400',
  },
  {
    label: 'Play',
    desc: 'Game together',
    icon: Gamepad2,
    query: 'Gaming',
    color: 'text-green-400',
  },
  {
    label: 'Practice',
    desc: 'Improve skills',
    icon: Globe,
    query: 'Languages',
    color: 'text-orange-400',
  },
  {
    label: 'Create',
    desc: 'Make something',
    icon: Palette,
    query: 'Creative',
    color: 'text-pink-400',
  },
];

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const { data: dashboardData, isLoading, refetch } = useQuery({
    queryKey: ['dashboardData'],
    queryFn: async () => {
      const [peopleRes, actRes, projRes] = await Promise.all([
        api.get('/discover'),
        api.get('/activities'),
        api.get('/projects'),
      ]);
      return {
        people:     (peopleRes.data || []).slice(0, 6) as UserCardData[],
        activities: (actRes.data   || []).slice(0, 3) as Activity[],
        projects:   (projRes.data  || []).slice(0, 3) as Project[],
      };
    },
  });

  const people     = dashboardData?.people     || [];
  const activities = dashboardData?.activities || [];
  const projects   = dashboardData?.projects   || [];

  const name = user?.profile?.display_name || user?.username || 'there';

  return (
    <div className="min-h-screen bg-[#000]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-10">

        {/* ── Greeting header ── */}
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4">
          <div>
            <p className="text-[#8A8A8A] text-sm mb-1">{getGreeting()},</p>
            <h1 className="text-3xl font-black text-white tracking-tight">
              {name}.
            </h1>
            <p className="text-[#555] text-sm mt-1">What do you want to do?</p>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <Link
              to="/nearby"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] border border-[#292929] hover:border-[#3D3D3D] text-[#D4D4D4] hover:text-white bg-transparent hover:bg-[#141414] text-xs font-medium transition-all"
            >
              <MapPin className="w-3.5 h-3.5 text-[#555]" />
              Nearby Map
            </Link>
            <Link
              to="/activities/create"
              className="flex items-center gap-1.5 px-3.5 py-2 rounded-[8px] bg-[#FFAA2B] hover:bg-[#FFB83D] text-black text-xs font-bold transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              Host Activity
            </Link>
          </div>
        </div>

        {/* ── Action cards ── */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {actionCards.map((card) => {
            const Icon = card.icon;
            return (
              <button
                key={card.label}
                type="button"
                onClick={() => navigate(`/discover?category=${encodeURIComponent(card.query)}`)}
                className="group flex flex-col items-start gap-3 p-4 bg-[#0F0F0F] border border-[#1E1E1E] rounded-[12px] hover:border-[#292929] hover:bg-[#141414] transition-all duration-200 cursor-pointer text-left"
              >
                <div className="w-9 h-9 rounded-[8px] bg-[#141414] border border-[#242424] group-hover:border-[#333] flex items-center justify-center transition-colors">
                  <Icon className={`w-4.5 h-4.5 ${card.color}`} />
                </div>
                <div>
                  <p className="text-sm font-semibold text-white">{card.label}</p>
                  <p className="text-[11px] text-[#555] mt-0.5">{card.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {/* ── People you may want to meet ── */}
        <section className="space-y-5">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-white">People you may want to meet</h2>
              <p className="text-xs text-[#555] mt-0.5">Ranked by compatibility with your interests</p>
            </div>
            <Link
              to="/discover"
              className="flex items-center gap-1 text-xs font-medium text-[#8A8A8A] hover:text-white transition-colors"
            >
              View all <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {isLoading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map((i) => <UserCardSkeleton key={i} />)}
            </div>
          ) : people.length === 0 ? (
            <div className="py-10 text-center text-[#555] text-sm bg-[#0F0F0F] border border-[#1A1A1A] rounded-[12px]">
              No recommended profiles yet. Complete your onboarding!
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {people.map((p) => (
                <UserCard key={p.id} user={p} onConnectSuccess={refetch} onFollowSuccess={refetch} />
              ))}
            </div>
          )}
        </section>

        {/* ── Nearby Activities ── */}
        {activities.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Nearby activities</h2>
                <p className="text-xs text-[#555] mt-0.5">Open sessions happening this week</p>
              </div>
              <Link
                to="/activities"
                className="flex items-center gap-1 text-xs font-medium text-[#8A8A8A] hover:text-white transition-colors"
              >
                Browse all <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {activities.map((a) => (
                <ActivityCard key={a.id} activity={a} onUpdate={refetch} />
              ))}
            </div>
          </section>
        )}

        {/* ── Projects ── */}
        {projects.length > 0 && (
          <section className="space-y-5">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-base font-bold text-white">Open projects recruiting</h2>
                <p className="text-xs text-[#555] mt-0.5">Collaborative projects looking for teammates</p>
              </div>
              <Link
                to="/projects"
                className="flex items-center gap-1 text-xs font-medium text-[#8A8A8A] hover:text-white transition-colors"
              >
                Explore <ArrowRight className="w-3.5 h-3.5" />
              </Link>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {projects.map((p) => (
                <ProjectCard key={p.id} project={p} onUpdate={refetch} />
              ))}
            </div>
          </section>
        )}
      </div>
    </div>
  );
};
