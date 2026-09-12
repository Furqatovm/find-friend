import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Calendar, MapPin, Users, ExternalLink } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';
import type { Activity } from '@/types';

interface ActivityCardProps {
  activity: Activity;
  onUpdate?: () => void;
}

const formatDate = (date: string, time: string) => {
  try {
    const d = new Date(`${date}T${time}`);
    return (
      d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) +
      ' · ' +
      d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
    );
  } catch {
    return `${date} · ${time}`;
  }
};

const categoryColors: Record<string, string> = {
  Study:     'bg-blue-500/10 text-blue-400 border-blue-500/20',
  Coding:    'bg-purple-500/10 text-purple-400 border-purple-500/20',
  Gaming:    'bg-green-500/10 text-green-400 border-green-500/20',
  Sports:    'bg-orange-500/10 text-orange-400 border-orange-500/20',
  Music:     'bg-pink-500/10 text-pink-400 border-pink-500/20',
  Languages: 'bg-teal-500/10 text-teal-400 border-teal-500/20',
};

export const ActivityCard: React.FC<ActivityCardProps> = ({ activity, onUpdate }) => {
  const { user } = useAuth();
  const [joining, setJoining] = useState(false);
  const [isJoined, setIsJoined] = useState(activity.is_joined || false);
  const [count, setCount] = useState(activity.participant_count || 1);

  const isFull = count >= activity.max_participants;
  const isCreator = user?.id === activity.creator_id;
  const catClass = categoryColors[activity.category] || 'bg-[#1A1A1A] text-[#8A8A8A] border-[#292929]';

  const handleToggleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setJoining(true);
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
      console.error(err);
    } finally {
      setJoining(false);
    }
  };

  return (
    <div className="group bg-[#141414] border border-[#292929] rounded-[12px] p-4 flex flex-col gap-3 transition-all duration-200 hover:border-[#383838] hover:-translate-y-px">
      {/* Category + date */}
      <div className="flex items-center justify-between gap-2 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] border text-[11px] font-medium ${catClass}`}>
          {activity.category}
        </span>
        <div className="flex items-center gap-1 text-[11px] text-[#666]">
          <Calendar className="w-3 h-3 shrink-0" />
          {formatDate(activity.event_date, activity.event_time)}
        </div>
      </div>

      {/* Title */}
      <Link to={`/activities/${activity.id}`}>
        <h4 className="font-semibold text-white text-sm leading-snug line-clamp-2 hover:text-[#FFAA2B] transition-colors">
          {activity.title}
        </h4>
      </Link>

      {/* Meta */}
      <div className="flex items-center gap-3 text-[11px] text-[#666]">
        {activity.city && (
          <span className="flex items-center gap-1">
            <MapPin className="w-3 h-3" />
            {activity.city}
          </span>
        )}
        <span className="flex items-center gap-1">
          <Users className="w-3 h-3" />
          {count} / {activity.max_participants}
        </span>
      </div>

      {/* Skill tags */}
      {activity.required_skills && activity.required_skills.length > 0 && (
        <div className="flex flex-wrap gap-1">
          {activity.required_skills.slice(0, 3).map((s, i) => (
            <span
              key={i}
              className="px-1.5 py-0.5 rounded-[4px] bg-[#1A1A1A] border border-[#242424] text-[10px] text-[#8A8A8A]"
            >
              {s}
            </span>
          ))}
        </div>
      )}

      {/* Action */}
      <div className="mt-auto pt-1">
        {isCreator ? (
          <Link
            to={`/activities/${activity.id}`}
            className="flex items-center justify-center gap-1.5 w-full h-8 rounded-[8px] border border-[#292929] hover:border-[#3D3D3D] text-[#D4D4D4] hover:text-white hover:bg-[#1A1A1A] text-xs font-medium transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Manage
          </Link>
        ) : isJoined ? (
          <button
            type="button"
            onClick={handleToggleJoin}
            disabled={joining}
            className="w-full h-8 rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] hover:border-red-500/30 hover:text-red-400 text-[#8A8A8A] text-xs font-medium transition-all cursor-pointer"
          >
            Leave
          </button>
        ) : (
          <button
            type="button"
            onClick={handleToggleJoin}
            disabled={joining || isFull}
            className={`w-full h-8 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
              isFull
                ? 'bg-[#141414] border border-[#292929] text-[#555] cursor-not-allowed'
                : 'bg-[#FFAA2B] hover:bg-[#FFB83D] text-black'
            }`}
          >
            {isFull ? 'Full' : 'View Activity'}
          </button>
        )}
      </div>
    </div>
  );
};
