import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Compass,
  Search,
  Filter,
  SlidersHorizontal
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserCard } from '@/components/cards/UserCard';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { UserCardData } from '@/types';

export const DiscoverPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const initialCategory = searchParams.get('category') || 'All';
  const initialGoal = searchParams.get('goal') || 'All';

  const [search, setSearch] = useState('');
  const [category, setCategory] = useState(initialCategory);
  const [goalFilter, setGoalFilter] = useState(initialGoal);
  const [activityMode, setActivityMode] = useState('All');
  const [minScore, setMinScore] = useState(0);
  const [showFilters, setShowFilters] = useState(false);

  const [users, setUsers] = useState<UserCardData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (search) params.search = search;
      if (category && category !== 'All') params.category = category;
      if (goalFilter && goalFilter !== 'All') params.goal = goalFilter;
      if (activityMode && activityMode !== 'All') params.activity_mode = activityMode;
      if (minScore > 0) params.min_score = minScore;

      const res = await api.get('/discover', { params });
      setUsers(res.data);
    } catch (err) {
      console.error('Failed to discover users', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [category, goalFilter, activityMode, minScore]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers();
  };

  const categories = [
    'All',
    'Study',
    'Coding',
    'Gaming',
    'Languages',
    'Startups',
    'Creative',
    'Sports',
    'Music',
    'Reading'
  ];

  const clearFilters = () => {
    setSearch('');
    setCategory('All');
    setGoalFilter('All');
    setActivityMode('All');
    setMinScore(0);
    setSearchParams({});
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">DISCOVER PEOPLE</h1>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
            Find people who share your exact interests and learning goals.
          </p>
        </div>

        {/* Search Bar */}
        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-md w-full">
          <Input
            placeholder="Search by name, skill, SAT, React..."
            icon={<Search className="w-4 h-4" />}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <Button type="submit" variant="primary" size="md" className="font-bold">
            Search
          </Button>
          <Button
            type="button"
            variant={showFilters ? 'secondary' : 'outline'}
            size="md"
            onClick={() => setShowFilters(!showFilters)}
            className="shrink-0"
          >
            <SlidersHorizontal className="w-4 h-4" />
          </Button>
        </form>
      </div>

      {/* Categories Horizontal Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 no-scrollbar">
        {categories.map((cat) => {
          const isActive = category.toLowerCase() === cat.toLowerCase();
          return (
            <button
              key={cat}
              type="button"
              onClick={() => {
                setCategory(cat);
                setSearchParams(cat === 'All' ? {} : { category: cat });
              }}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all cursor-pointer border shadow-xs ${
                isActive
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
                  : 'bg-white text-neutral-600 hover:text-neutral-900 border-neutral-200 dark:bg-[#0F0F0F] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414]'
              }`}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Expandable Advanced Filters Drawer */}
      {showFilters && (
        <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-5 space-y-4 animate-in fade-in shadow-sm">
          <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#242424]">
            <span className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-2">
              <Filter className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Advanced Filters
            </span>
            <button type="button" onClick={clearFilters} className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white cursor-pointer">
              Reset Filters
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Activity Mode */}
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] mb-1.5">Activity Preference</label>
              <Select value={activityMode} onValueChange={setActivityMode}>
                <SelectTrigger>
                  <SelectValue placeholder="Select activity preference" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="All">Any Mode (Online & In Person)</SelectItem>
                  <SelectItem value="online">Online only</SelectItem>
                  <SelectItem value="in_person">In person only</SelectItem>
                  <SelectItem value="both">Open to both</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Minimum Compatibility Score */}
            <div>
              <div className="flex justify-between text-xs text-neutral-600 dark:text-[#8A8A8A] mb-1.5">
                <span className="font-bold">Minimum Match Score</span>
                <span className="text-amber-600 dark:text-amber-400 font-bold">{minScore}%</span>
              </div>
              <input
                type="range"
                min="0"
                max="90"
                step="5"
                value={minScore}
                onChange={(e) => setMinScore(Number(e.target.value))}
                className="w-full accent-neutral-900 dark:accent-white cursor-pointer"
              />
            </div>
          </div>
        </div>
      )}

      {/* People Grid */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : users.length === 0 ? (
        <EmptyState
          icon={<Compass className="w-8 h-8 text-neutral-400 dark:text-[#5C5C5C]" />}
          title="No compatible people found"
          description="Try broadening your search query or lowering the minimum compatibility filter."
          actionLabel="Clear all filters"
          onAction={clearFilters}
        />
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {users.map((user) => (
            <UserCard
              key={user.id}
              user={user}
              onConnectSuccess={fetchUsers}
              onFollowSuccess={fetchUsers}
            />
          ))}
        </div>
      )}
    </div>
  );
};
