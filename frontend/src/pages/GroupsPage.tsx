import React, { useState } from 'react';
import { Users, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getGroups } from '@/api';
import { GroupCard } from '@/components/cards/GroupCard';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { Group } from '@/types';
import { CreateGroupModal } from '@/components/groups/CreateGroupModal';

const CATEGORIES = ['All', 'Study', 'Startups', 'Languages', 'Gaming', 'Learning'];

export const GroupsPage: React.FC = () => {
  const [category, setCategory] = useState('All');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const { data: groups = [], isLoading, refetch } = useQuery<Group[]>({
    queryKey: ['groups', category],
    queryFn: ({ signal }) => getGroups({ category }, signal),
  });

  return (
    <div className="min-h-screen bg-[#000]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Groups</h1>
            <p className="text-xs text-[#555] mt-1">
              Join interest-based groups, share knowledge, and collaborate
            </p>
          </div>
          <button
            type="button"
            onClick={() => setShowCreateModal(true)}
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#FFAA2B] hover:bg-[#FFB83D] text-black text-sm font-bold transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Create Group
          </button>
        </div>

        {/* Category pills */}
        <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar">
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

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <UserCardSkeleton key={i} />)}
          </div>
        ) : groups.length === 0 ? (
          <EmptyState
            icon={<Users className="w-8 h-8 text-[#555]" />}
            title="No groups found"
            description="Check back soon or explore other categories!"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {groups.map((group) => (
              <GroupCard key={group.id} group={group} onUpdate={refetch} />
            ))}
          </div>
        )}

        <CreateGroupModal
          isOpen={showCreateModal}
          onClose={() => setShowCreateModal(false)}
          onSuccess={refetch}
        />
      </div>
    </div>
  );
};
