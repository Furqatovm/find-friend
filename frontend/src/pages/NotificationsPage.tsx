import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bell, Check, ArrowRight } from 'lucide-react';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/common/EmptyState';
import { formatTimeAgo } from '@/lib/utils';
import type { Notification } from '@/types';

export const NotificationsPage: React.FC = () => {
  const navigate = useNavigate();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchNotifs = async () => {
    setLoading(true);
    try {
      const res = await api.get('/notifications');
      setNotifications(res.data.notifications || []);
    } catch (err) {
      console.error('Failed to load notifications', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifs();
  }, []);

  const handleMarkAllRead = async () => {
    try {
      await api.post('/notifications/read-all');
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch (err) {
      console.error('Failed to mark all read', err);
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

      {loading ? (
        <div className="space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-16 bg-neutral-200 dark:bg-[#0F0F0F] border border-neutral-300 dark:border-[#242424] animate-pulse rounded-2xl" />
          ))}
        </div>
      ) : notifications.length === 0 ? (
        <EmptyState
          icon={<Bell className="w-8 h-8 text-neutral-400 dark:text-[#5C5C5C]" />}
          title="All caught up!"
          description="You don't have any notifications right now."
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
