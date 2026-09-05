import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Calendar,
  MapPin,
  Users,
  Check,
  ArrowLeft,
  MessageSquare,
  ArrowRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { getCategoryBadgeColor, getInitials } from '@/lib/utils';
import type { Activity } from '@/types';

export const ActivityDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user } = useAuth();
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [activity, setActivity] = useState<Activity | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [chatLoading, setChatLoading] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/activities/${id}`);
      setActivity(res.data);
    } catch (err) {
      console.error('Failed to load activity detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleToggleJoin = async () => {
    if (!activity) return;
    if (!user) {
      navigate('/login');
      return;
    }
    setActionLoading(true);
    try {
      if (activity.is_joined) {
        await api.delete(`/activities/${activity.id}/leave`);
        notify.info('Left Activity', `You left "${activity.title}".`);
      } else {
        await api.post(`/activities/${activity.id}/join`);
        notify.success('Joined Activity!', `You joined "${activity.title}". You can now chat with other participants!`);
      }
      await fetchDetail();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to update activity status');
    } finally {
      setActionLoading(false);
    }
  };

  const handleOpenActivityChat = async () => {
    if (!user) {
      navigate('/login');
      return;
    }
    // If activity has linked groups, navigate directly to it
    if (activity?.groups && activity.groups.length > 0) {
      navigate(`/groups/${activity.groups[0].id}`);
      return;
    }
    setChatLoading(true);
    try {
      const res = await api.get(`/activities/${id}/group`);
      if (res.data?.id) {
        navigate(`/groups/${res.data.id}`);
      }
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to open activity chat');
    } finally {
      setChatLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-neutral-500 dark:text-[#8A8A8A]">
        <p className="text-xs">Loading activity details...</p>
      </div>
    );
  }

  if (!activity) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-neutral-900 dark:text-white">
        <p className="text-sm text-neutral-500 dark:text-[#8A8A8A]">Activity not found.</p>
        <Link to="/activities" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Back to Activities</Button>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Back button */}
      <Link to="/activities" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to all activities
      </Link>

      {/* Main Header Card */}
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className={getCategoryBadgeColor(activity.category)}>
              {activity.category}
            </Badge>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-neutral-700 dark:text-[#D4D4D4] capitalize font-medium">
              {activity.location_type === 'in_person' ? '📍 In Person' : activity.location_type === 'online' ? '🌐 Online' : '⚡ Hybrid'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="md"
              loading={chatLoading}
              onClick={handleOpenActivityChat}
              className="font-bold text-xs flex items-center gap-1.5 shadow-xs"
            >
              <MessageSquare className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <span>Activity Chat</span>
            </Button>

            <Button
              variant={activity.is_joined ? 'outline' : 'primary'}
              size="md"
              loading={actionLoading}
              onClick={handleToggleJoin}
              className="font-bold"
            >
              {activity.is_joined ? (
                <>
                  <Check className="w-4 h-4 mr-1 text-emerald-500" />
                  Joined
                </>
              ) : (
                'Join Activity'
              )}
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">
            {activity.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-700 dark:text-[#D4D4D4] leading-relaxed whitespace-pre-line">
            {activity.description}
          </p>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4 border-t border-neutral-200 dark:border-[#242424] text-xs">
          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
            <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
            <div>
              <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] font-bold">DATE & TIME</p>
              <p className="font-bold text-neutral-900 dark:text-white">{activity.event_date} · {activity.event_time}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
            <MapPin className="w-4 h-4 text-neutral-900 dark:text-white" />
            <div className="overflow-hidden">
              <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] font-bold">LOCATION</p>
              <p className="font-bold text-neutral-900 dark:text-white truncate">{activity.general_location || activity.city || 'Online session'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
            <Users className="w-4 h-4 text-neutral-900 dark:text-white" />
            <div>
              <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] font-bold">CAPACITY</p>
              <p className="font-bold text-neutral-900 dark:text-white">{activity.participant_count} / {activity.max_participants} Attending</p>
            </div>
          </div>
        </div>
      </div>

      {/* Activity Group Chat Banner / Card */}
      <div className="p-6 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="w-12 h-12 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
            <MessageSquare className="w-6 h-6" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-black text-sm text-neutral-900 dark:text-white">
                Activity Discussion & Coordination Group
              </h3>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 font-bold">
                Live Chat
              </span>
            </div>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-0.5">
              Discuss event details, ask questions to host, and connect with other attendees in real-time.
            </p>
          </div>
        </div>

        <Button
          variant="primary"
          size="md"
          loading={chatLoading}
          onClick={handleOpenActivityChat}
          className="font-bold text-xs shrink-0 flex items-center gap-1.5 shadow-md self-start sm:self-center"
        >
          <MessageSquare className="w-4 h-4" />
          <span>Open Activity Chat</span>
          <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
        </Button>
      </div>

      {/* Participants List */}
      <Card>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center justify-between">
          <span>Participants ({activity.participants?.length || 0})</span>
          <span className="text-xs text-neutral-500 dark:text-[#8A8A8A] font-normal">
            Max {activity.max_participants} spots
          </span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {activity.participants?.map((p) => (
            <Link
              key={p.user_id}
              to={`/users/${p.user_id}`}
              className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] hover:border-neutral-300 dark:hover:border-[#383838] transition-colors"
            >
              <div className="flex items-center gap-3">
                {p.user?.avatar_url ? (
                  <img src={p.user.avatar_url} className="w-9 h-9 rounded-full object-cover border border-neutral-300 dark:border-[#292929]" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center text-xs font-bold">
                    {getInitials(p.user?.display_name || 'U')}
                  </div>
                )}
                <div>
                  <p className="font-bold text-xs text-neutral-900 dark:text-white">{p.user?.display_name || 'Participant'}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">@{p.user?.username}</p>
                </div>
              </div>

              <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                p.role === 'host' ? 'bg-neutral-900 text-white dark:bg-white dark:text-black' : 'bg-neutral-200 text-neutral-700 dark:bg-[#1F1F1F] dark:text-[#8A8A8A]'
              }`}>
                {p.role}
              </span>
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
};
