import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, UserPlus, MessageSquare, Clock, Check } from 'lucide-react';
import { CompatibilityBadge } from '../common/CompatibilityBadge';
import { getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import type { UserCardData } from '@/types';

interface UserCardProps {
  user: UserCardData;
  onConnectSuccess?: () => void;
  onFollowSuccess?: () => void;
}

export const UserCard: React.FC<UserCardProps> = ({ user, onConnectSuccess, onFollowSuccess }) => {
  const { user: currentUser } = useAuth();
  const navigate = useNavigate();
  const [connStatus, setConnStatus] = useState(user.connection?.status || 'none');
  const [isFollowing, setIsFollowing] = useState(user.is_following || false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setConnStatus(user.connection?.status || 'none');
    setIsFollowing(user.is_following || false);
  }, [user.connection?.status, user.is_following, user.id]);

  const isSelf = currentUser?.id === user.id;

  const handleConnect = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelf) return;
    if (connStatus === 'accepted') {
      try {
        const res = await api.post('/conversations', { recipient_id: user.id });
        navigate(`/messages/${res.data.id}`);
      } catch {
        navigate('/messages');
      }
      return;
    }
    if (connStatus === 'pending') return;
    const prev = connStatus;
    setConnStatus('pending');
    setLoading(true);
    try {
      await api.post('/connections', { addressee_id: user.id });
      if (onConnectSuccess) onConnectSuccess();
    } catch (err: any) {
      const msg = err.response?.data?.error || '';
      if (msg.toLowerCase().includes('already')) {
        setConnStatus(msg.toLowerCase().includes('connected') ? 'accepted' : 'pending');
      } else {
        setConnStatus(prev);
      }
      if (onConnectSuccess) onConnectSuccess();
    } finally {
      setLoading(false);
    }
  };

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (isSelf) return;
    const next = !isFollowing;
    setIsFollowing(next);
    try {
      const res = await api.post(`/users/${user.id}/follow`);
      setIsFollowing(res.data.is_following);
      if (onFollowSuccess) onFollowSuccess();
    } catch {
      setIsFollowing(!next);
    }
  };

  // Top interest/skill tags
  const tags =
    user.interests?.slice(0, 3).map((i) => i.name) ||
    user.skills?.slice(0, 3).map((s) => s.name) ||
    [];

  return (
    <div className="group bg-[#141414] border border-[#292929] rounded-[12px] p-4 flex flex-col gap-3 transition-all duration-200 hover:border-[#383838] hover:-translate-y-px hover:bg-[#161616]">
      {/* Header: Avatar + Name + Compatibility */}
      <div className="flex items-start gap-3">
        <Link to={`/users/${user.id}`} className="shrink-0">
          {user.avatar_url ? (
            <img
              src={user.avatar_url}
              alt={user.display_name}
              className="w-11 h-11 rounded-full object-cover border border-[#2E2E2E] group-hover:border-[#444] transition-colors"
            />
          ) : (
            <div className="w-11 h-11 rounded-full bg-[#1A1A1A] border border-[#2E2E2E] flex items-center justify-center font-bold text-sm text-white">
              {getInitials(user.display_name)}
            </div>
          )}
        </Link>

        <div className="flex-1 min-w-0">
          <Link to={`/users/${user.id}`}>
            <h4 className="font-semibold text-white text-sm leading-tight truncate hover:text-[#FFAA2B] transition-colors">
              {user.display_name}
            </h4>
          </Link>
          <p className="text-xs text-[#8A8A8A] truncate mt-0.5">
            {user.headline || `@${user.username}`}
          </p>
          {(user.city || user.distance_bucket) && (
            <div className="flex items-center gap-1 mt-1">
              <MapPin className="w-3 h-3 text-[#555] shrink-0" />
              <span className="text-[11px] text-[#666] truncate">
                {user.city || ''}{user.distance_bucket ? ` · ${user.distance_bucket}` : ''}
              </span>
            </div>
          )}
        </div>

        {/* Compatibility badge */}
        {user.compatibility && (
          <div className="shrink-0">
            <CompatibilityBadge compatibility={user.compatibility} size="sm" />
          </div>
        )}
      </div>

      {/* Interest tags */}
      {tags.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {tags.map((tag, i) => (
            <span
              key={i}
              className="px-2 py-0.5 rounded-[5px] bg-[#1A1A1A] border border-[#2A2A2A] text-[11px] text-[#D4D4D4] font-medium"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {/* Shared interest hint */}
      {user.compatibility?.shared_interests && user.compatibility.shared_interests.length > 0 && (
        <p className="text-[11px] text-[#666]">
          <span className="text-[#8A8A8A]">Common: </span>
          {user.compatibility.shared_interests.slice(0, 3).join(' · ')}
        </p>
      )}

      {/* Action buttons */}
      <div className="flex items-center gap-2 mt-auto pt-1">
        <Link
          to={`/users/${user.id}`}
          className="flex-1 flex items-center justify-center h-8 rounded-[8px] border border-[#292929] hover:border-[#3D3D3D] text-[#D4D4D4] hover:text-white hover:bg-[#1A1A1A] text-xs font-medium transition-all"
        >
          View
        </Link>

        {isSelf ? null : connStatus === 'accepted' ? (
          <button
            type="button"
            onClick={handleConnect}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[8px] border border-[#292929] hover:border-[#3D3D3D] text-[#D4D4D4] hover:text-white hover:bg-[#1A1A1A] text-xs font-medium transition-all cursor-pointer"
          >
            <MessageSquare className="w-3.5 h-3.5" />
            Chat
          </button>
        ) : connStatus === 'pending' ? (
          <button
            type="button"
            disabled
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] text-[#666] text-xs font-medium cursor-not-allowed"
          >
            <Clock className="w-3.5 h-3.5 text-[#FFAA2B]" />
            Pending
          </button>
        ) : (
          <button
            type="button"
            onClick={handleConnect}
            disabled={loading}
            className="flex-1 flex items-center justify-center gap-1.5 h-8 rounded-[8px] bg-[#FFAA2B] hover:bg-[#FFB83D] active:bg-[#FF9C1A] text-black text-xs font-semibold transition-all cursor-pointer disabled:opacity-60"
          >
            <UserPlus className="w-3.5 h-3.5" />
            Connect
          </button>
        )}
      </div>
    </div>
  );
};
