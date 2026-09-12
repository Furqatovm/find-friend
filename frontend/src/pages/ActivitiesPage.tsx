import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getActivities } from '@/api';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { Activity } from '@/types';

const CATEGORIES = ['All', 'Study', 'Coding', 'Gaming', 'Languages', 'Sports', 'Music', 'Creative', 'Startups'];

export const ActivitiesPage: React.FC = () => {
  const [category, setCategory] = useState('All');
  const [locationType, setLocationType] = useState('All');

  const { data: activities = [], isLoading, refetch } = useQuery<Activity[]>({
    queryKey: ['activities', category, locationType],
    queryFn: ({ signal }) =>
      getActivities({ category, location_type: locationType }, signal),
  });

  return (
    <div className="min-h-screen bg-[#000]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Activities & Sessions</h1>
            <p className="text-xs text-[#555] mt-1">
              Join meetups, online sprints, study sessions, and gaming matches
            </p>
          </div>
          <Link
            to="/activities/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#FFAA2B] hover:bg-[#FFB83D] text-black text-sm font-bold transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Host Activity
          </Link>
        </div>

        {/* Filter bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-[20px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  category === cat
                    ? 'bg-[#FFAA2B] text-black border-[#FFAA2B]'
                    : 'bg-transparent text-[#8A8A8A] border-[#292929] hover:text-white hover:border-[#3D3D3D]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Format select */}
          <div className="shrink-0 w-36">
            <Select value={locationType} onValueChange={setLocationType}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All">All Formats</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="in_person">In Person</SelectItem>
                <SelectItem value="hybrid">Hybrid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <UserCardSkeleton key={i} />)}
          </div>
        ) : activities.length === 0 ? (
          <EmptyState
            icon={<Calendar className="w-8 h-8 text-[#555]" />}
            title="No activities found"
            description="Be the first to create an activity for this category!"
            actionLabel="Host an Activity"
            onAction={() => {}}
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {activities.map((act) => (
              <ActivityCard key={act.id} activity={act} onUpdate={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
