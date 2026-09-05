import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Check, MessageSquare, Pin } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getCategoryBadgeColor, getInitials, formatTimeAgo } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Group } from '@/types';

interface GroupCardProps {
  group: Group;
  onUpdate?: () => void;
}

export const GroupCard: React.FC<GroupCardProps> = ({ group, onUpdate }) => {
  const [isMember, setIsMember] = useState(group.is_member || false);
  const [memberCount, setMemberCount] = useState(group.member_count || 1);
  const [loading, setLoading] = useState(false);

  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (isMember) {
        await api.delete(`/groups/${group.id}/leave`);
        setIsMember(false);
        setMemberCount((c) => Math.max(1, c - 1));
      } else {
        await api.post(`/groups/${group.id}/join`);
        setIsMember(true);
        setMemberCount((c) => c + 1);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to update group membership', err);
    } finally {
      setLoading(false);
    }
  };

  const onlineCount = group.online_count || Math.ceil(memberCount * 0.6);

  return (
    <Card hover className="flex flex-col justify-between h-full group">
      <div>
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge className={getCategoryBadgeColor(group.category)}>
            {group.category}
          </Badge>
          <span className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] font-medium flex items-center gap-1.5">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 dark:bg-emerald-400" />
            <strong className="text-neutral-900 dark:text-white font-bold">{onlineCount}</strong> online
          </span>
        </div>

        <div className="flex items-center gap-3 mb-3">
          <div className="relative shrink-0">
            {group.avatar_url ? (
              <img
                src={group.avatar_url}
                alt={group.name}
                className="w-12 h-12 rounded-full object-cover border border-neutral-300 dark:border-[#292929]"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-sm">
                {getInitials(group.name)}
              </div>
            )}
          </div>
          <Link to={`/groups/${group.id}`}>
            <h4 className="font-bold text-neutral-900 dark:text-white text-sm transition-colors line-clamp-1">
              {group.name}
            </h4>
            <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] flex items-center gap-1 mt-0.5">
              <Users className="w-3 h-3 text-neutral-400 dark:text-[#5C5C5C]" />
              {memberCount} members
            </p>
          </Link>
        </div>

        <p className="text-xs text-neutral-600 dark:text-[#D4D4D4] line-clamp-2 mb-3 leading-relaxed">
          {group.description}
        </p>

        {/* Last active message or pinned info snippet */}
        {group.pinned_message ? (
          <div className="p-2 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-[11px] text-neutral-800 dark:text-[#D4D4D4] flex items-center gap-2 mb-2">
            <Pin className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0 rotate-45" />
            <span className="truncate">{group.pinned_message.content}</span>
          </div>
        ) : group.last_message ? (
          <div className="p-2 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-[11px] text-neutral-500 dark:text-[#8A8A8A] flex items-center justify-between gap-2 mb-2">
            <span className="truncate text-neutral-800 dark:text-[#D4D4D4]">
              <span className="text-neutral-900 dark:text-white font-medium">{group.last_message.author_name}: </span>
              {group.last_message.content}
            </span>
            <span className="text-[10px] text-neutral-400 dark:text-[#5C5C5C] shrink-0">{formatTimeAgo(group.last_message.created_at)}</span>
          </div>
        ) : null}
      </div>

      <div className="pt-3 border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between gap-2 mt-auto">
        <Link
          to={`/groups/${group.id}`}
          className="text-xs font-bold text-neutral-700 dark:text-[#D4D4D4] hover:text-neutral-900 dark:hover:text-white flex items-center gap-1.5 transition-colors"
        >
          <MessageSquare className="w-3.5 h-3.5" />
          Chat
        </Link>

        <Button
          variant={isMember ? 'outline' : 'primary'}
          size="sm"
          loading={loading}
          onClick={handleToggleJoin}
          className="text-xs font-bold"
        >
          {isMember ? (
            <>
              <Check className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
              Joined
            </>
          ) : (
            'Join Guild'
          )}
        </Button>
      </div>
    </Card>
  );
};
