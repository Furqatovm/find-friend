import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bell, Check, ArrowRight, UserPlus, X } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatTimeAgo } from '@/lib/utils';
import { useNotification } from '@/context/NotificationContext';
import type { Notification } from '@/types';

interface PendingRequest {
  id: string;
  requester: {
    id: string;
    username: string;
    display_name: string;
    avatar_url: string | null;
    headline?: string;
  };
  message?: string;
  created_at: string;
}

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();

  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [pendingRequests, setPendingRequests] = useState<PendingRequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [respondingId, setRespondingId] = useState<string | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const [notifsRes, connRes] = await Promise.allSettled([
        api.get('/notifications'),
        api.get('/connections')
      ]);

      if (notifsRes.status === 'fulfilled') {
        setNotifications(notifsRes.value.data.notifications || []);
      }
      if (connRes.status === 'fulfilled') {
        setPendingRequests(connRes.value.data.pending_incoming || []);
      }
    } catch (err) {
      console.error('Failed to load notifications or connections', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
    }
  };

  const handleAcceptRequest = async (id: string, name: string) => {
    setRespondingId(id);
    try {
      await api.put(`/connections/${id}`, { action: 'accept' });
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      notify.success('Connected!', `You are now connected with ${name}!`);
    } catch (err) {
      console.error('Failed to accept connection', err);
      notify.error('Error', 'Could not accept invitation.');
    } finally {
      setRespondingId(null);
    }
  };

  const handleDeclineRequest = async (id: string) => {
    setRespondingId(id);
    try {
      await api.put(`/connections/${id}`, { action: 'decline' });
      setPendingRequests((prev) => prev.filter((r) => r.id !== id));
      notify.info('Declined', 'Connection request declined.');
    } catch (err) {
      console.error('Failed to decline connection', err);
    } finally {
      setRespondingId(null);
    }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">NOTIFICATIONS</h1>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
            Connection updates, incoming messages, and activity invites.
          </p>
        </div>

        {notifications.some((n) => !n.is_read) && (
          <Button variant="outline" size="sm" onClick={handleMarkAllRead} className="font-bold">
            <Check className="w-3.5 h-3.5 mr-1" />
            Mark all read
          </Button>
        )}
      </div>

      {/* PENDING CONNECTION INVITATIONS */}
      {pendingRequests.length > 0 && (
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h2 className="text-xs font-black uppercase tracking-wider text-amber-600 dark:text-amber-400 flex items-center gap-1.5">
              <UserPlus className="w-4 h-4" />
              Pending Connection Requests ({pendingRequests.length})
            </h2>
          </div>

          <div className="space-y-2.5">
            {pendingRequests.map((req) => (
              <div
                key={req.id}
                className="p-4 rounded-2xl bg-white dark:bg-[#121212] border border-amber-500/30 dark:border-amber-500/20 shadow-sm flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <Link to={`/users/${req.requester.id}`} className="flex items-center gap-3.5 group">
                  <img
                    src={req.requester.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'}
                    alt={req.requester.display_name}
                    className="w-12 h-12 rounded-full object-cover border border-neutral-200 dark:border-[#242424] group-hover:border-amber-500 transition-colors"
                  />
                  <div>
                    <p className="font-bold text-sm text-neutral-900 dark:text-white group-hover:text-amber-500 transition-colors">
                      {req.requester.display_name}
                    </p>
                    <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">
                      {req.requester.headline || `@${req.requester.username}`}
                    </p>
                    {req.message && (
                      <p className="text-xs text-neutral-600 dark:text-[#CCCCCC] italic mt-1 bg-neutral-100 dark:bg-[#1A1A1A] px-2.5 py-1 rounded-lg border border-neutral-200 dark:border-[#292929]">
                        "{req.message}"
                      </p>
                    )}
                  </div>
                </Link>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-center">
                  <Button
                    size="sm"
                    variant="primary"
                    loading={respondingId === req.id}
                    onClick={() => handleAcceptRequest(req.id, req.requester.display_name)}
                    className="bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-bold px-3.5"
                  >
                    <Check className="w-3.5 h-3.5 mr-1" />
                    Accept
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    disabled={respondingId === req.id}
                    onClick={() => handleDeclineRequest(req.id)}
                    className="text-xs font-bold text-neutral-500 hover:text-red-500 hover:bg-red-500/10"
                  >
                    <X className="w-3.5 h-3.5 mr-1" />
                    Decline
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-neutral-200 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-[#242424] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 && pendingRequests.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-neutral-400 dark:text-[#5C5C5C]" />}
          title="All caught up!"
          description="You don't have any notifications or pending requests right now."
        />
      ) : (
        <div className="space-y-2.5">
          {notifications.map((n) => (
            <div
              key={n.id}
              onClick={() => {
                if (n.link) navigate(n.link);
              }}
              className={`p-4 rounded-2xl border transition-all cursor-pointer flex items-center justify-between gap-4 shadow-xs ${
                n.is_read
                  ? 'bg-white border-neutral-200 text-neutral-600 hover:border-neutral-400 dark:bg-[#0F0F0F] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:border-[#383838]'
                  : 'bg-neutral-50 border-neutral-900 text-neutral-900 dark:bg-[#141414] dark:border-white/40 dark:text-white shadow-md'
              }`}
            >
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <p className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white">{n.title}</p>
                  {!n.is_read && (
                    <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
                  )}
                </div>
                <p className="text-xs text-neutral-600 dark:text-[#D4D4D4] leading-snug">{n.message}</p>
              </div>

              <div className="flex items-center gap-2 shrink-0">
                <span className="text-[11px] text-neutral-400 dark:text-[#5C5C5C]">{formatTimeAgo(n.created_at)}</span>
                <ArrowRight className="w-4 h-4 text-neutral-400 dark:text-[#8A8A8A]" />
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
