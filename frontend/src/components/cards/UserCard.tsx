import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { MapPin, UserPlus, MessageSquare, Clock, Check, Sparkles } from 'lucide-react';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { CompatibilityBadge } from '../common/CompatibilityBadge';
import { SkillBadge } from '../common/SkillBadge';
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
  const [followLoading, setFollowLoading] = useState(false);

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
      } catch (err) {
        navigate('/messages');
      }
      return;
    }

    if (connStatus === 'pending') return;

    // 1. Instant optimistic state update on frontend
    const previousStatus = connStatus;
    setConnStatus('pending');

    // 2. Background backend persistence
    try {
      await api.post('/connections', { addressee_id: user.id });
      if (onConnectSuccess) onConnectSuccess();
    } catch (err: any) {
      const errMsg = err.response?.data?.error || '';
      console.error('Failed to send connect request', errMsg);
      if (errMsg.toLowerCase().includes('already')) {
        if (errMsg.toLowerCase().includes('connected')) {
          setConnStatus('accepted');
        } else {
          setConnStatus('pending');
        }
      } else {
        // Rollback on unexpected error
        setConnStatus(previousStatus);
      }
      if (onConnectSuccess) onConnectSuccess();
    }
  };

  const handleToggleFollow = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isSelf) return;

    // 1. Instant optimistic state update on frontend
    const newFollowingState = !isFollowing;
    setIsFollowing(newFollowingState);

    // 2. Background backend persistence
    try {
      const res = await api.post(`/users/${user.id}/follow`);
      setIsFollowing(res.data.is_following);
      if (onFollowSuccess) onFollowSuccess();
    } catch (err) {
      console.error('Failed to toggle follow', err);
      // Rollback on error
      setIsFollowing(!newFollowingState);
    }
  };

  return (
    <Card hover className="flex flex-col justify-between h-full group">
      <div>
        {/* Header with Avatar & Compatibility Badge */}
        <div className="flex items-start justify-between gap-3 mb-3.5">
          <Link to={`/users/${user.id}`} className="flex items-center gap-3">
            {user.avatar_url ? (
              <img
                src={user.avatar_url}
                alt={user.display_name}
                className="w-12 h-12 rounded-full object-cover border border-neutral-300 dark:border-[#292929] group-hover:border-neutral-500 dark:group-hover:border-white/40 transition-colors"
              />
            ) : (
              <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-sm">
                {getInitials(user.display_name)}
              </div>
            )}
            <div>
              <h4 className="font-bold text-neutral-900 dark:text-white text-sm transition-colors flex items-center gap-1.5">
                {user.display_name}
              </h4>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] line-clamp-1 font-mono">{user.headline || `@${user.username}`}</p>
            </div>
          </Link>

          {user.compatibility && (
            <CompatibilityBadge compatibility={user.compatibility} size="sm" />
          )}
        </div>

        {/* Bio */}
        {user.bio && (
          <p className="text-xs text-neutral-600 dark:text-[#D4D4D4] line-clamp-2 mb-3 leading-relaxed">
            {user.bio}
          </p>
        )}

        {/* Shared Interests & Goals */}
        <div className="space-y-1.5 mb-4">
          {user.compatibility && user.compatibility.shared_interests.length > 0 && (
            <div className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
              <span className="text-neutral-900 dark:text-white font-medium">Common: </span>
              <span className="text-neutral-700 dark:text-[#D4D4D4]">{user.compatibility.shared_interests.slice(0, 3).join(' · ')}</span>
            </div>
          )}

          {user.looking_for_summary && (
            <div className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
              <span className="text-amber-600 dark:text-amber-400 font-medium">Goal: </span>
              <span className="text-neutral-700 dark:text-[#D4D4D4]">{user.looking_for_summary}</span>
            </div>
          )}

          {/* Skill tags */}
          {user.skills && user.skills.length > 0 && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {user.skills.slice(0, 3).map((s, idx) => (
                <SkillBadge key={idx} skill={s} size="sm" />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Footer with Distance and Action Buttons */}
      <div className="pt-3 border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-1 text-[11px] text-neutral-500 dark:text-[#8A8A8A] truncate">
          <MapPin className="w-3 h-3 shrink-0 text-neutral-400 dark:text-[#5C5C5C]" />
          <span className="truncate">{user.city ? `${user.city} · ` : ''}{user.distance_bucket || '~Nearby'}</span>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {!isSelf && (
            <button
              type="button"
              onClick={handleToggleFollow}
              disabled={followLoading}
              title={isFollowing ? "Unfollow" : "Follow"}
              className={`px-2.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1 shadow-xs ${
                isFollowing
                  ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300 dark:bg-[#141414] dark:text-[#D4D4D4] dark:border-[#242424]'
                  : 'bg-neutral-100 text-neutral-900 hover:bg-neutral-200 border border-neutral-300 dark:bg-[#1F1F1F] dark:text-white dark:border-[#2E2E2E]'
              }`}
            >
              {isFollowing ? (
                <>
                  <Check className="w-3 h-3 text-amber-500 dark:text-amber-400" />
                  <span>Following</span>
                </>
              ) : (
                <span>+ Follow</span>
              )}
            </button>
          )}

          {isSelf ? (
            <Link to={`/users/${user.id}`}>
              <Button variant="outline" size="sm" className="text-xs font-bold">
                My Profile
              </Button>
            </Link>
          ) : connStatus === 'accepted' ? (
            <Button variant="outline" size="sm" onClick={handleConnect} className="text-xs font-bold">
              <MessageSquare className="w-3.5 h-3.5 mr-1" />
              Chat
            </Button>
          ) : connStatus === 'pending' ? (
            <Button variant="secondary" size="sm" disabled className="text-xs text-neutral-500 dark:text-[#8A8A8A]">
              <Clock className="w-3.5 h-3.5 mr-1 text-amber-500 dark:text-amber-400" />
              Pending
            </Button>
          ) : (
            <Button variant="primary" size="sm" loading={loading} onClick={handleConnect} className="text-xs font-bold">
              <UserPlus className="w-3.5 h-3.5 mr-1" />
              Connect
            </Button>
          )}
        </div>
      </div>
    </Card>
  );
};
