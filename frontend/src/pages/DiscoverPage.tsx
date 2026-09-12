import React, { useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Search, SlidersHorizontal } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getDiscoverUsers } from '@/api';
import { UserCard } from '@/components/cards/UserCard';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { UserCardData } from '@/types';

const CATEGORIES = ['All', 'Study', 'Coding', 'Gaming', 'Languages', 'Startups', 'Creative', 'Sports', 'Music', 'Reading'];

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [search, setSearch] = useState('');
  const [submittedSearch, setSubmittedSearch] = useState('');
  const [category, setCategory] = useState(searchParams.get('category') || 'All');
  const [goalFilter, setGoalFilter] = useState(searchParams.get('goal') || 'All');
  const [activityMode, setActivityMode] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const { data: users = [], isLoading, refetch } = useQuery<UserCardData[]>({
    queryKey: ['discoverUsers', category, goalFilter, activityMode, minScore, submittedSearch],
    queryFn: ({ signal }) =>
      getDiscoverUsers(
        {
          search: submittedSearch,
          category,
          goal: goalFilter,
          activity_mode: activityMode,
          min_score: minScore,
        },
        signal
      ),
  });

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmittedSearch(search);
  };

  const clearFilters = () => {
    setSearch('');
    setSubmittedSearch('');
    setCategory('All');
    setGoalFilter('All');
    setActivityMode('All');
    setMinScore(0);
    setSearchParams({});
  };

  return (
    <div className="min-h-screen bg-[#000]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">

        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white tracking-tight">Discover People</h1>
            <p className="text-xs text-[#555] mt-1">Find people who share your exact interests and goals</p>
          </div>

          {/* Search */}
          <form
            onSubmit={handleSearchSubmit}
            className="flex items-center gap-2 w-full sm:max-w-sm"
          >
            <Input
              placeholder="Search people, skills, goals..."
              icon={<Search className="w-3.5 h-3.5" />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <button
              type="button"
              onClick={() => setShowFilters(!showFilters)}
              className={`shrink-0 flex items-center justify-center w-9 h-9 rounded-[10px] border transition-all cursor-pointer ${
                showFilters
                  ? 'bg-[#1A1A1A] border-[#3D3D3D] text-white'
                  : 'bg-transparent border-[#292929] text-[#555] hover:border-[#3D3D3D] hover:text-white'
              }`}
              title="Filters"
            >
              <SlidersHorizontal className="w-4 h-4" />
            </button>
          </form>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
          {CATEGORIES.map((cat) => {
            const isActive = category.toLowerCase() === cat.toLowerCase();
            return (
              <button
                key={cat}
                type="button"
                onClick={() => {
                  setCategory(cat);
                  setSearchParams(cat === 'All' ? {} : { category: cat });
                }}
                className={`px-3.5 py-1.5 rounded-[20px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  isActive
                    ? 'bg-[#FFAA2B] text-black border-[#FFAA2B]'
                    : 'bg-transparent text-[#8A8A8A] border-[#292929] hover:text-white hover:border-[#3D3D3D]'
                }`}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* Advanced filters */}
        {showFilters && (
          <div className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-[12px] p-5 space-y-4 animate-in">
            <div className="flex items-center justify-between mb-1">
              <span className="text-xs font-semibold text-white">Filters</span>
              <button
                type="button"
                onClick={clearFilters}
                className="text-xs text-[#555] hover:text-[#8A8A8A] cursor-pointer transition-colors"
              >
                Reset all
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-[#8A8A8A] mb-1.5">Activity Mode</label>
                <Select value={activityMode} onValueChange={setActivityMode}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select mode" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="All">Any mode</SelectItem>
                    <SelectItem value="online">Online only</SelectItem>
                    <SelectItem value="in_person">In person only</SelectItem>
                    <SelectItem value="both">Open to both</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div>
                <div className="flex justify-between text-xs mb-1.5">
                  <span className="text-[#8A8A8A] font-medium">Min Match Score</span>
                  <span className="text-[#FFAA2B] font-bold">{minScore}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="90"
                  step="5"
                  value={minScore}
                  onChange={(e) => setMinScore(Number(e.target.value))}
                  className="w-full cursor-pointer"
                />
              </div>
            </div>
          </div>
        )}

        {/* Results */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3, 4, 5, 6].map((i) => <UserCardSkeleton key={i} />)}
          </div>
        ) : users.length === 0 ? (
          <EmptyState
            title="No people found"
            description="Try changing your filters or broadening your search."
            actionLabel="Clear filters"
            onAction={clearFilters}
          />
        ) : (
          <>
            <p className="text-xs text-[#555]">{users.length} people found</p>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {users.map((u) => (
                <UserCard key={u.id} user={u} onConnectSuccess={refetch} onFollowSuccess={refetch} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};
