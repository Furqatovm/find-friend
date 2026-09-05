import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { api } from '@/lib/api';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { Activity } from '@/types';

export const ActivitiesPage: React.FC = () => {
  const [category, setCategory] = useState('All');
  const [locationType, setLocationType] = useState('All');
  const [search] = useState('');

  const { data: activities = [], isLoading: loading, refetch: fetchActivities } = useQuery<Activity[]>({
    queryKey: ['activities', category, locationType, search],
    queryFn: async () => {
      const params: any = {};
      if (category !== 'All') params.category = category;
      if (locationType !== 'All') params.location_type = locationType;
      if (search) params.search = search;

      const res = await api.get('/activities', { params });
      return res.data || [];
    }
  });

  const categories = ['All', 'Study', 'Coding', 'Gaming', 'Languages', 'Sports', 'Music', 'Creative', 'Startups'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">ACTIVITIES & SESSIONS</h1>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
            Join physical meetups, online sprints, SAT study sessions, and gaming matches.
          </p>
        </div>

        <Link to="/activities/create">
          <Button variant="primary" size="md" className="font-bold">
            <Plus className="w-4 h-4 mr-1.5" />
            Host an Activity
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                category === c
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200 dark:bg-[#141414] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 min-w-[150px]">
          <Select value={locationType} onValueChange={setLocationType}>
            <SelectTrigger className="h-9 text-xs">
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

      {/* Activities Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : activities.length === 0 ? (
        <EmptyState
          icon={<Calendar className="w-8 h-8 text-neutral-400 dark:text-[#5C5C5C]" />}
          title="No activities found"
          description="Be the first to create an activity for this category!"
          actionLabel="Create an Activity"
          onAction={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {activities.map((act) => (
            <ActivityCard key={act.id} activity={act} onUpdate={fetchActivities} />
          ))}
        </div>
      )}
    </div>
  );
};
