import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  Search,
  Users,
  Calendar,
  Rocket,
  MessageSquare,
  Sparkles,
  ArrowRight,
  X,
  Compass
} from 'lucide-react';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import type { Activity, Project, Group } from '@/types';

interface GlobalSearchModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const GlobalSearchModal: React.FC<GlobalSearchModalProps> = ({ isOpen, onClose }) => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
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

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
    } else {
      setQuery('');
      setResults({ users: [], activities: [], projects: [], groups: [], tags: [] });
    }
  }, [isOpen]);

  // Global keydown listener for Esc
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  // Debounced Search Query
  useEffect(() => {
    if (!query.trim()) {
      setResults({ users: [], activities: [], projects: [], groups: [], tags: [] });
      return;
    }

    const timer = setTimeout(async () => {
      setLoading(true);
      try {
        const res = await api.get('/search', { params: { q: query.trim(), limit: 6 } });
        setResults(res.data);
      } catch (err) {
        console.error('Search error', err);
      } finally {
        setLoading(false);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);

  const handleSelect = (url: string) => {
    onClose();
    navigate(url);
  };

  const handleViewAll = () => {
    if (query.trim()) {
      onClose();
      navigate(`/search?q=${encodeURIComponent(query.trim())}`);
    }
  };

  const totalResultsCount =
    results.users.length + results.activities.length + results.projects.length + results.groups.length;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center pt-16 sm:pt-24 px-4 bg-black/40 dark:bg-black/85 backdrop-blur-md animate-in fade-in duration-200">
      <div
        className="fixed inset-0"
        onClick={onClose}
      />

      <motion.div
        initial={{ opacity: 0, scale: 0.96, y: -10 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.96, y: -10 }}
        transition={{ duration: 0.15 }}
        className="relative w-full max-w-2xl bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl shadow-2xl overflow-hidden z-10 flex flex-col max-h-[75vh] text-neutral-900 dark:text-white"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Input Bar */}
        <div className="p-4 border-b border-neutral-200 dark:border-[#242424] flex items-center gap-3 bg-white dark:bg-[#0F0F0F]">
          <Search className="w-5 h-5 text-neutral-400 dark:text-[#8A8A8A] shrink-0" />
          <input
            ref={inputRef}
            type="text"
            placeholder="Search people, study sessions, projects, skills, or Telegram groups..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') handleViewAll();
            }}
            className="flex-1 bg-transparent text-sm sm:text-base text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none"
          />
          {loading && <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400 animate-spin shrink-0" />}
          {query && (
            <button
              onClick={() => setQuery('')}
              className="p-1 rounded-lg text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="hidden sm:inline-block px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-[10px] text-neutral-600 dark:text-[#8A8A8A] font-mono">
            ESC
          </kbd>
        </div>

        {/* Filter Category Tabs */}
        {query && (
          <div className="px-4 py-2 border-b border-neutral-200 dark:border-[#242424] bg-neutral-50 dark:bg-[#080808] flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {[
              { id: 'all', label: 'All Results' },
              { id: 'users', label: `People (${results.users.length})` },
              { id: 'activities', label: `Activities (${results.activities.length})` },
              { id: 'projects', label: `Projects (${results.projects.length})` },
              { id: 'groups', label: `Groups (${results.groups.length})` }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`px-3 py-1 rounded-xl text-xs font-bold transition-colors cursor-pointer whitespace-nowrap border ${
                  activeTab === tab.id
                    ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white shadow-xs'
                    : 'bg-white text-neutral-600 hover:text-neutral-900 border-neutral-200 dark:bg-[#141414] dark:text-[#8A8A8A] dark:hover:text-white dark:border-[#242424]'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>
        )}

        {/* Results Container */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 bg-neutral-50/50 dark:bg-[#080808]">
          {!query.trim() ? (
            <div className="py-10 text-center space-y-3">
              <Compass className="w-10 h-10 mx-auto text-neutral-300 dark:text-[#3D3D3D]" />
              <div>
                <p className="text-sm font-bold text-neutral-900 dark:text-white">Quick Global Search</p>
                <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
                  Type a name, study goal (SAT, IELTS), skill (Python, React), or startup topic.
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-1.5 pt-2">
                {['SAT Math', 'Python Dev', 'IELTS Speaking', 'Indie Game', 'Startups', 'Figma Design'].map((s) => (
                  <button
                    key={s}
                    onClick={() => setQuery(s)}
                    className="px-2.5 py-1 rounded-lg bg-white dark:bg-[#141414] hover:bg-neutral-100 dark:hover:bg-white hover:text-neutral-900 dark:hover:text-black border border-neutral-200 dark:border-[#242424] text-xs text-neutral-700 dark:text-[#D4D4D4] font-medium cursor-pointer transition-all shadow-xs"
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          ) : totalResultsCount === 0 && !loading ? (
            <div className="py-12 text-center text-xs text-neutral-500 dark:text-[#8A8A8A]">
              <Search className="w-8 h-8 mx-auto text-neutral-300 dark:text-[#3D3D3D] mb-2" />
              <p>No results found for "{query}"</p>
              <p className="text-neutral-400 dark:text-[#5C5C5C] mt-1">Try searching for a different keyword or skill.</p>
            </div>
          ) : (
            <>
              {/* 1. People / Users */}
              {(activeTab === 'all' || activeTab === 'users') && results.users.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-[#8A8A8A] uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Users className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                      People & Partners
                    </span>
                    <span className="text-[11px] text-neutral-400 dark:text-[#5C5C5C]">{results.users.length} found</span>
                  </div>

                  <div className="space-y-1">
                    {results.users.map((u) => (
                      <div
                        key={u.id}
                        onClick={() => handleSelect(`/users/${u.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white dark:hover:bg-[#141414] border border-transparent hover:border-neutral-200 dark:hover:border-[#242424] cursor-pointer transition-all group shadow-xs dark:shadow-none"
                      >
                        <div className="flex items-center gap-3">
                          {u.avatar_url ? (
                            <img src={u.avatar_url} className="w-9 h-9 rounded-full object-cover border border-neutral-300 dark:border-[#292929]" />
                          ) : (
                            <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-xs">
                              {getInitials(u.display_name || u.username)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-xs text-neutral-900 dark:text-white transition-colors">
                              {u.display_name || u.username}
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] line-clamp-1">{u.headline || u.city || 'Member'}</p>
                          </div>
                        </div>

                        {u.compatibility && (
                          <span className="text-[11px] px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-amber-600 dark:text-amber-400 font-bold">
                            {u.compatibility.compatibility_score}% Match
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 2. Activities */}
              {(activeTab === 'all' || activeTab === 'activities') && results.activities.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-[#8A8A8A] uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      Activities & Sessions
                    </span>
                    <span className="text-[11px] text-neutral-400 dark:text-[#5C5C5C]">{results.activities.length} found</span>
                  </div>

                  <div className="space-y-1">
                    {results.activities.map((act) => (
                      <div
                        key={act.id}
                        onClick={() => handleSelect(`/activities/${act.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white dark:hover:bg-[#141414] border border-transparent hover:border-neutral-200 dark:hover:border-[#242424] cursor-pointer transition-all group shadow-xs dark:shadow-none"
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <p className="font-bold text-xs text-neutral-900 dark:text-white transition-colors line-clamp-1">
                            {act.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] flex items-center gap-2">
                            <span>{act.category}</span>
                            <span>·</span>
                            <span>{act.event_date}</span>
                          </p>
                        </div>
                        <span className="text-[10px] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-neutral-700 dark:text-[#D4D4D4] capitalize shrink-0 font-medium">
                          {act.location_type}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 3. Projects */}
              {(activeTab === 'all' || activeTab === 'projects') && results.projects.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-[#8A8A8A] uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <Rocket className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                      Projects & Teams
                    </span>
                    <span className="text-[11px] text-neutral-400 dark:text-[#5C5C5C]">{results.projects.length} found</span>
                  </div>

                  <div className="space-y-1">
                    {results.projects.map((proj) => (
                      <div
                        key={proj.id}
                        onClick={() => handleSelect(`/projects/${proj.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white dark:hover:bg-[#141414] border border-transparent hover:border-neutral-200 dark:hover:border-[#242424] cursor-pointer transition-all group shadow-xs dark:shadow-none"
                      >
                        <div className="space-y-0.5 overflow-hidden">
                          <p className="font-bold text-xs text-neutral-900 dark:text-white transition-colors line-clamp-1">
                            {proj.title}
                          </p>
                          <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] line-clamp-1">{proj.category} · Stage: {proj.stage}</p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-neutral-400 dark:text-[#5C5C5C] group-hover:text-neutral-900 dark:group-hover:text-white shrink-0" />
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 4. Telegram Groups */}
              {(activeTab === 'all' || activeTab === 'groups') && results.groups.length > 0 && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-neutral-500 dark:text-[#8A8A8A] uppercase tracking-wider px-1">
                    <span className="flex items-center gap-1.5">
                      <MessageSquare className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      Telegram Communities
                    </span>
                    <span className="text-[11px] text-neutral-400 dark:text-[#5C5C5C]">{results.groups.length} found</span>
                  </div>

                  <div className="space-y-1">
                    {results.groups.map((grp) => (
                      <div
                        key={grp.id}
                        onClick={() => handleSelect(`/groups/${grp.id}`)}
                        className="flex items-center justify-between p-2.5 rounded-2xl hover:bg-white dark:hover:bg-[#141414] border border-transparent hover:border-neutral-200 dark:hover:border-[#242424] cursor-pointer transition-all group shadow-xs dark:shadow-none"
                      >
                        <div className="flex items-center gap-3">
                          {grp.avatar_url ? (
                            <img src={grp.avatar_url} className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-[#292929]" />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-xs">
                              {getInitials(grp.name)}
                            </div>
                          )}
                          <div>
                            <p className="font-bold text-xs text-neutral-900 dark:text-white transition-colors">
                              {grp.name}
                            </p>
                            <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">{grp.member_count} members · {grp.category}</p>
                          </div>
                        </div>
                        <span className="text-[11px] text-neutral-900 dark:text-white font-bold group-hover:underline">Open Chat →</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer with View All CTA */}
        {query && totalResultsCount > 0 && (
          <div className="p-3 bg-neutral-100 dark:bg-[#0F0F0F] border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between text-xs">
            <span className="text-neutral-500 dark:text-[#8A8A8A]">Showing top results for "{query}"</span>
            <button
              onClick={handleViewAll}
              className="font-bold text-neutral-900 hover:text-neutral-700 dark:text-white dark:hover:text-neutral-300 flex items-center gap-1 cursor-pointer"
            >
              See all results
              <ArrowRight className="w-3.5 h-3.5 ml-1" />
            </button>
          </div>
        )}
      </motion.div>
    </div>
  );
};
