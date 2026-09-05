import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import {
  Search,
  Users,
  Calendar,
  Rocket,
  MessageSquare
} from 'lucide-react';
import { api } from '@/lib/api';
import { UserCard } from '@/components/cards/UserCard';
import { ActivityCard } from '@/components/cards/ActivityCard';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { GroupCard } from '@/components/cards/GroupCard';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { Activity, Project, Group } from '@/types';

export const SearchPage: React.FC = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const queryParam = searchParams.get('q') || '';

  const [searchTerm, setSearchTerm] = useState(queryParam);
  const [activeTab, setActiveTab] = useState<'all' | 'users' | 'activities' | 'projects' | 'groups'>('all');
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<{
    users: any[];
    activities: Activity[];
    projects: Project[];
    groups: Group[];
    tags: { type: string; name: string; category: string }[];
  }>({
    users: [],
    activities: [],
    projects: [],
    groups: [],
    tags: []
  });

  const performSearch = async (term: string) => {
    if (!term.trim()) return;
    setLoading(true);
    try {
      const res = await api.get('/search', { params: { q: term.trim(), limit: 20 } });
      setResults(res.data);
    } catch (err) {
      console.error('Search failed', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (queryParam) {
      setSearchTerm(queryParam);
      performSearch(queryParam);
    }
  }, [queryParam]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      setSearchParams({ q: searchTerm.trim() });
      performSearch(searchTerm.trim());
    }
  };

  const totalCount =
    results.users.length + results.activities.length + results.projects.length + results.groups.length;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Search Header Bar */}
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-6 sm:p-8 shadow-2xl space-y-6">
        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight flex items-center gap-2 mb-2">
            <Search className="w-6 h-6 text-amber-500 dark:text-amber-400" />
            UNIVERSAL SEARCH
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#8A8A8A]">
            Find compatible study partners, live activities, startup projects, and Telegram communities.
          </p>
        </div>

        <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 max-w-2xl">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Search by topic, study goal (SAT, IELTS), skill (Python, React)..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl pl-11 pr-4 py-3 text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
            />
            <Search className="w-5 h-5 text-neutral-400 dark:text-[#5C5C5C] absolute left-3.5 top-1/2 -translate-y-1/2" />
          </div>
          <button
            type="submit"
            className="px-6 py-3 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold text-sm transition-all cursor-pointer shadow-sm"
          >
            Search
          </button>
        </form>

        {/* Quick Filter Tabs */}
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-2 border-t border-neutral-200 dark:border-[#242424]">
          {[
            { id: 'all', label: `All (${totalCount})` },
            { id: 'users', label: `People (${results.users.length})` },
            { id: 'activities', label: `Activities (${results.activities.length})` },
            { id: 'projects', label: `Projects (${results.projects.length})` },
            { id: 'groups', label: `Communities (${results.groups.length})` }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                activeTab === tab.id
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200 dark:bg-[#141414] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Results Content */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : totalCount === 0 && queryParam ? (
        <EmptyState
          icon={<Search className="w-8 h-8 text-neutral-400 dark:text-[#5C5C5C]" />}
          title={`No results found for "${queryParam}"`}
          description="Try searching with broader terms, like 'SAT', 'Python', 'Game', or 'Design'."
        />
      ) : (
        <div className="space-y-10">
          {/* 1. People / Users Section */}
          {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Users className="w-5 h-5 text-neutral-900 dark:text-white" />
                People & Study Partners ({results.users.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.users.map((u) => (
                  <UserCard key={u.id} user={u} />
                ))}
              </div>
            </div>
          )}

          {/* 2. Activities Section */}
          {(activeTab === 'all' || activeTab === 'activities') && results.activities.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Calendar className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                Activities & Sessions ({results.activities.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.activities.map((act) => (
                  <ActivityCard key={act.id} activity={act} />
                ))}
              </div>
            </div>
          )}

          {/* 3. Projects Section */}
          {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <Rocket className="w-5 h-5 text-neutral-900 dark:text-white" />
                Projects & Startups ({results.projects.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.projects.map((proj) => (
                  <ProjectCard key={proj.id} project={proj} />
                ))}
              </div>
            </div>
          )}

          {/* 4. Telegram Communities Section */}
          {(activeTab === 'all' || activeTab === 'groups') && results.groups.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
                <MessageSquare className="w-5 h-5 text-amber-500 dark:text-amber-400" />
                Telegram Communities ({results.groups.length})
              </h2>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {results.groups.map((grp) => (
                  <GroupCard key={grp.id} group={grp} />
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
