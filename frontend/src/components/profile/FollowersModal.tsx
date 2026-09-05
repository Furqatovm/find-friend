import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Dialog } from '@/components/ui/Dialog';
import { Search, Users, X } from 'lucide-react';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import { useAuth } from '@/context/AuthContext';

interface FollowersModalProps {
  isOpen: boolean;
  onClose: () => void;
  userId: string;
  username: string;
  initialTab?: 'followers' | 'following';
  onFollowChange?: () => void;
}

export const FollowersModal: React.FC<FollowersModalProps> = ({
  isOpen,
  onClose,
  userId,
  username,
  initialTab = 'followers',
  onFollowChange
}) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [tab, setTab] = useState<'followers' | 'following'>(initialTab);
  const [list, setList] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [search, setSearch] = useState('');
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      setTab(initialTab);
      fetchList(initialTab);
    }
  }, [isOpen, initialTab, userId]);

  const fetchList = async (targetTab: 'followers' | 'following') => {
    setLoading(true);
    try {
      const res = await api.get(`/users/${userId}/${targetTab}`);
      setList(res.data);
    } catch (err) {
      console.error(`Failed to load ${targetTab}`, err);
    } finally {
      setLoading(false);
    }
  };

  const handleTabChange = (newTab: 'followers' | 'following') => {
    setTab(newTab);
    setSearch('');
    fetchList(newTab);
  };

  const handleToggleFollow = async (e: React.MouseEvent, targetUserId: string) => {
    e.stopPropagation();
    setActionLoading(targetUserId);
    try {
      const res = await api.post(`/users/${targetUserId}/follow`);
      setList((prev) =>
        prev.map((item) =>
          item.id === targetUserId ? { ...item, is_following: res.data.is_following } : item
        )
      );
      if (onFollowChange) onFollowChange();
    } catch (err) {
      console.error('Failed to toggle follow', err);
    } finally {
      setActionLoading(null);
    }
  };

  const filteredList = list.filter((u) => {
    if (!search.trim()) return true;
    const term = search.toLowerCase();
    return (
      u.username?.toLowerCase().includes(term) ||
      u.display_name?.toLowerCase().includes(term) ||
      u.headline?.toLowerCase().includes(term)
    );
  });

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`@${username}`}
      description=""
    >
      <div className="space-y-3 -mt-2">
        {/* Top Tabs */}
        <div className="flex border-b border-neutral-200 dark:border-[#242424] text-center font-bold text-xs sm:text-sm">
          <button
            type="button"
            onClick={() => handleTabChange('followers')}
            className={`flex-1 py-3 border-b-2 transition-all cursor-pointer ${
              tab === 'followers'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white'
            }`}
          >
            Followers
          </button>
          <button
            type="button"
            onClick={() => handleTabChange('following')}
            className={`flex-1 py-3 border-b-2 transition-all cursor-pointer ${
              tab === 'following'
                ? 'border-neutral-900 text-neutral-900 dark:border-white dark:text-white font-bold'
                : 'border-transparent text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white'
            }`}
          >
            Following
          </button>
        </div>

        {/* Search inside list */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
          />
          <Search className="w-3.5 h-3.5 text-neutral-400 dark:text-[#5C5C5C] absolute left-3 top-1/2 -translate-y-1/2" />
          {search && (
            <button
              type="button"
              onClick={() => setSearch('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* User list */}
        <div className="max-h-80 overflow-y-auto space-y-1 divide-y divide-neutral-200/50 dark:divide-[#242424]/40 pr-1">
          {loading ? (
            <div className="text-center py-8 text-xs text-neutral-500 dark:text-[#8A8A8A]">Loading {tab}...</div>
          ) : filteredList.length === 0 ? (
            <div className="text-center py-10 text-neutral-400 dark:text-[#5C5C5C] space-y-2">
              <Users className="w-8 h-8 mx-auto text-neutral-300 dark:text-[#3D3D3D]" />
              <p className="text-xs">No {tab} found</p>
            </div>
          ) : (
            filteredList.map((item) => (
              <div
                key={item.id}
                onClick={() => {
                  onClose();
                  navigate(`/users/${item.id}`);
                }}
                className="flex items-center justify-between p-2.5 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#141414] transition-colors cursor-pointer group"
              >
                <div className="flex items-center gap-3 min-w-0">
                  {item.avatar_url ? (
                    <img
                      src={item.avatar_url}
                      alt={item.display_name}
                      className="w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-[#292929] shrink-0"
                    />
                  ) : (
                    <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-xs shrink-0">
                      {getInitials(item.display_name || item.username)}
                    </div>
                  )}

                  <div className="min-w-0">
                    <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">
                      {item.username}
                    </p>
                    <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] truncate">
                      {item.display_name}
                    </p>
                  </div>
                </div>

                {/* Follow/Unfollow Button */}
                {currentUser && !item.is_self && (
                  <button
                    type="button"
                    onClick={(e) => handleToggleFollow(e, item.id)}
                    disabled={actionLoading === item.id}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer shrink-0 ${
                      item.is_following
                        ? 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 border border-neutral-200 dark:bg-[#141414] dark:text-[#D4D4D4] dark:hover:bg-[#1A1A1A] dark:border-[#242424]'
                        : 'bg-neutral-900 text-white hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 shadow-sm'
                    }`}
                  >
                    {item.is_following ? 'Following' : 'Follow'}
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </Dialog>
  );
};
