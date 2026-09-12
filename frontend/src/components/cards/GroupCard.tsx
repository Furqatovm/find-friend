import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Lock } from 'lucide-react';
import { api } from '@/lib/api';
import { getInitials } from '@/lib/utils';
import type { Group } from '@/types';

interface GroupCardProps {
  group: Group;
  onUpdate?: () => void;
}

const formatCount = (n: number) => {
  if (n >= 1000) return `${(n / 1000).toFixed(1)}k`;
  return n.toString();
};

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

  return (
    <div className="group bg-[#141414] border border-[#292929] rounded-[12px] p-4 flex flex-col gap-3 transition-all duration-200 hover:border-[#383838] hover:-translate-y-px">
      {/* Header */}
      <div className="flex items-start gap-3">
        <Link to={`/groups/${group.id}`} className="shrink-0">
          {group.avatar_url ? (
            <img
              src={group.avatar_url}
              alt={group.name}
              className="w-11 h-11 rounded-[10px] object-cover border border-[#2E2E2E]"
            />
          ) : (
            <div className="w-11 h-11 rounded-[10px] bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center font-bold text-sm text-white">
              {getInitials(group.name)}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/groups/${group.id}`}>
            <h4 className="font-bold text-white text-sm uppercase tracking-wide truncate hover:text-[#FFAA2B] transition-colors">
              {group.name}
            </h4>
          </Link>
          <div className="flex items-center gap-1 mt-0.5">
            <Users className="w-3 h-3 text-[#555]" />
            <span className="text-[11px] text-[#8A8A8A]">{formatCount(memberCount)} members</span>
            {group.is_private && <Lock className="w-3 h-3 text-[#555] ml-1" />}
          </div>
        </div>
      </div>

      {/* Description */}
      {group.description && (
        <p className="text-xs text-[#8A8A8A] line-clamp-2 leading-relaxed">
          {group.description}
        </p>
      )}

      {/* Category */}
      <span className="self-start inline-flex px-2 py-0.5 rounded-[5px] bg-[#1A1A1A] border border-[#2A2A2A] text-[11px] text-[#666] font-medium">
        {group.category}
      </span>

      {/* Action */}
      <div className="mt-auto pt-1">
        {isMember ? (
          <Link
            to={`/groups/${group.id}`}
            className="flex items-center justify-center w-full h-8 rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] text-[#D4D4D4] hover:text-white text-xs font-medium transition-all"
          >
            Open Group
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleToggleJoin}
            disabled={loading || group.is_private}
            className={`w-full h-8 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
              group.is_private
                ? 'bg-[#141414] border border-[#292929] text-[#555] cursor-not-allowed'
                : 'bg-[#FFAA2B] hover:bg-[#FFB83D] text-black'
            }`}
          >
            {group.is_private ? 'Private' : 'Join Group'}
          </button>
        )}
      </div>
    </div>
  );
};
