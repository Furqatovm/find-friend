import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { ArrowLeft, Users } from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { TelegramGroupChat } from '@/components/groups/TelegramGroupChat';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { getCategoryBadgeColor, getInitials } from '@/lib/utils';
import type { Group } from '@/types';

export const GroupDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const { notify } = useNotification();

  const [group, setGroup] = useState<Group | null>(null);
  const [loading, setLoading] = useState(true);
  const [joinLoading, setJoinLoading] = useState(false);

  const fetchGroup = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/groups/${id}`);
      setGroup(res.data);
    } catch (err) {
      console.error('Failed to load group detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchGroup();
  }, [id]);

  const handleJoinGroup = async () => {
    if (!group) return;
    setJoinLoading(true);
    try {
      await api.post(`/groups/${group.id}/join`);
      notify.group('Joined Group Chat!', `You are now a member of "${group.name}".`);
      await fetchGroup();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to join group';
      notify.error('Join Failed', msg);
    } finally {
      setJoinLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-neutral-500 dark:text-[#8A8A8A]">
        <p className="text-xs">Opening group chat...</p>
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-neutral-900 dark:text-white">
        <p className="text-sm text-neutral-500 dark:text-[#D4D4D4]">Group not found.</p>
        <Link to="/groups" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Back to Communities</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-2 sm:px-4 lg:px-6 py-6 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* If member, render Telegram Group Chat */}
      {group.is_member ? (
        <TelegramGroupChat group={group} onUpdateGroup={fetchGroup} />
      ) : (
        /* Preview Banner for Non-members with Join CTA */
        <div className="space-y-6">
          <Link to="/groups" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white mb-2 transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to communities
          </Link>

          <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-8 shadow-2xl text-center space-y-6 max-w-xl mx-auto">
            {group.avatar_url ? (
              <img
                src={group.avatar_url}
                alt={group.name}
                className="w-24 h-24 rounded-full object-cover mx-auto border border-neutral-300 dark:border-[#292929] shadow-xl"
              />
            ) : (
              <div className="w-24 h-24 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-3xl mx-auto shadow-xl">
                {getInitials(group.name)}
              </div>
            )}

            <div className="space-y-2">
              <Badge className={getCategoryBadgeColor(group.category)}>
                {group.category}
              </Badge>
              <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">{group.name}</h1>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] flex items-center justify-center gap-1.5">
                <Users className="w-3.5 h-3.5 text-neutral-400 dark:text-[#5C5C5C]" />
                {group.member_count} members · {group.online_count || Math.ceil(group.member_count * 0.6)} online
              </p>
            </div>

            <p className="text-xs text-neutral-700 dark:text-[#D4D4D4] leading-relaxed max-w-md mx-auto">
              {group.description}
            </p>

            <div className="pt-2">
              <Button
                variant="primary"
                size="lg"
                loading={joinLoading}
                onClick={handleJoinGroup}
                className="w-full font-bold"
              >
                Join Group Chat
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
