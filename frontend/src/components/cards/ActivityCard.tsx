import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getCategoryBadgeColor, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Activity } from '@/types';

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: () => void;
}

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onUpdate }) => {
  const [isJoined, setIsJoined] = useState(activity.is_joined || false);
  const [count, setCount] = useState(activity.participant_count || 1);
  const [loading, setLoading] = useState(false);

  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (isJoined) {
        await api.delete(`/activities/${activity.id}/leave`);
        setIsJoined(false);
        setCount((c) => Math.max(1, c - 1));
      } else {
        await api.post(`/activities/${activity.id}/join`);
        setIsJoined(true);
        setCount((c) => c + 1);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to toggle activity participation', err);
    } finally {
      setLoading(false);
    }
  };

  const isFull = count >= activity.max_participants;

  return (
    <Card hover className="flex flex-col justify-between h-full group">
      <div>
        {/* Category & Status Header */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge className={getCategoryBadgeColor(activity.category)}>
            {activity.category}
          </Badge>
          <span className="text-[11px] font-medium text-neutral-600 dark:text-[#8A8A8A] px-2 py-0.5 rounded-md bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
            {activity.location_type === 'in_person' ? '📍 In Person' : activity.location_type === 'online' ? '🌐 Online' : '⚡ Hybrid'}
          </span>
        </div>

        {/* Title & Description */}
        <Link to={`/activities/${activity.id}`}>
          <h4 className="font-bold text-neutral-900 dark:text-white text-sm transition-colors line-clamp-1 mb-1.5">
            {activity.title}
          </h4>
        </Link>
        <p className="text-xs text-neutral-600 dark:text-[#D4D4D4] line-clamp-2 mb-4 leading-relaxed">
          {activity.description}
        </p>

        {/* Date, Time & Location info */}
        <div className="space-y-1.5 mb-4 text-xs text-neutral-500 dark:text-[#8A8A8A]">
          <div className="flex items-center gap-2">
            <Calendar className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 shrink-0" />
            <span className="text-neutral-900 dark:text-white font-medium">{activity.event_date} · {activity.event_time}</span>
          </div>
          {activity.general_location && (
            <div className="flex items-center gap-2">
              <MapPin className="w-3.5 h-3.5 text-neutral-400 dark:text-[#5C5C5C] shrink-0" />
              <span className="truncate">{activity.general_location}</span>
            </div>
          )}
        </div>
      </div>

      {/* Participants & Action Footer */}
      <div className="pt-3 border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between gap-3 mt-auto">
        <div className="flex items-center gap-2">
          {/* Avatar stack */}
          <div className="flex -space-x-1.5 overflow-hidden">
            {activity.participants?.slice(0, 3).map((p, i) => (
              p.user?.avatar_url ? (
                <img
                  key={i}
                  src={p.user.avatar_url}
                  alt={p.user.display_name}
                  className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#0F0F0F] object-cover"
                />
              ) : (
                <div key={i} className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0F0F0F]">
                  {getInitials(p.user?.display_name || 'U')}
                </div>
              )
            ))}
          </div>
          <span className="text-xs text-neutral-500 dark:text-[#8A8A8A] font-medium">
            <strong className="text-neutral-900 dark:text-white font-bold">{count}</strong> / {activity.max_participants}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/activities/${activity.id}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              Details
            </Button>
          </Link>
          <Button
            variant={isJoined ? 'outline' : 'primary'}
            size="sm"
            disabled={!isJoined && isFull}
            loading={loading}
            onClick={handleToggleJoin}
            className="text-xs font-bold"
          >
            {isJoined ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Joined
              </>
            ) : isFull ? (
              'Full'
            ) : (
              'Join'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
