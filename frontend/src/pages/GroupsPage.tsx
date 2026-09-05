import React, { useState, useEffect } from 'react';
import { Users, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { GroupCard } from '@/components/cards/GroupCard';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { Group } from '@/types';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';

export const GroupsPage: React.FC = () => {
  const [groups, setGroups] = useState<Group[]>([]);
  const [category, setCategory] = useState('All');
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category !== 'All') params.category = category;

      const res = await api.get('/groups', { params });
      setGroups(res.data);
    } catch (err) {
      console.error('Failed to load groups', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroups();
  }, [category]);

  const categories = ['All', 'Study', 'Startups', 'Languages', 'Gaming', 'Learning'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">COMMUNITY GUILDS</h1>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
            Join interest-based groups, share knowledge, and collaborate in real-time.
          </p>
        </div>

        <Button variant="primary" size="md" onClick={() => setShowCreateModal(true)} className="font-bold">
          <Plus className="w-4 h-4 mr-1.5" />
          Create Community Guild
        </Button>
      </div>

      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 flex items-center gap-2 overflow-x-auto no-scrollbar shadow-sm">
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

      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : groups.length === 0 ? (
        <EmptyState
          icon={<Users className="w-8 h-8 text-neutral-400 dark:text-[#5C5C5C]" />}
          title="No groups found"
          description="Check back soon or explore other categories!"
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {groups.map((group) => (
            <GroupCard key={group.id} group={group} onUpdate={fetchGroups} />
          ))}
        </div>
      )}

      <CreateGroupModal
        isOpen={showCreateModal}
        onClose={() => setShowCreateModal(false)}
        onSuccess={fetchGroups}
      />
    </div>
  );
};
