import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  MessageSquare,
  Users,
  Rocket,
  X,
  ExternalLink
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { api } from '@/lib/api';

export interface ToastItem {
  id: string;
  title: string;
  message: string;
  type?: 'success' | 'info' | 'error' | 'message' | 'group' | 'project';
  link?: string;
  sender_name?: string;
  sender_avatar?: string;
  duration?: number;
}

export interface NotificationItem {
  id: string;
  type: string;
  title: string;
  message: string;
  link?: string;
  is_read: boolean;
  created_at: string;
  sender_name?: string;
  sender_avatar?: string;
}

interface NotificationContextType {
  unreadCount: number;
  notifications: NotificationItem[];
  refreshNotifications: (silent?: boolean) => Promise<void>;
  markAllRead: () => Promise<void>;
  showNotification: (item: Omit<ToastItem, 'id'>) => void;
  removeNotification: (id: string) => void;
  notify: {
    success: (titleOrMsg: string, maybeMsg?: string, link?: string) => void;
    info: (titleOrMsg: string, maybeMsg?: string, link?: string) => void;
    error: (titleOrMsg: string, maybeMsg?: string) => void;
    group: (titleOrMsg: string, maybeMsg?: string, link?: string) => void;
    project: (titleOrMsg: string, maybeMsg?: string, link?: string) => void;
  };
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

// Subtle Web Audio synthesizer chime for incoming popups
const playChime = () => {
  try {
    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioCtx) return;
    const ctx = new AudioCtx();
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.08); // A5

    gain.gain.setValueAtTime(0.06, ctx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);

    osc.connect(gain);
    gain.connect(ctx.destination);
    osc.start();
    osc.stop(ctx.currentTime + 0.35);
  } catch {
    // AudioContext autoplay restrictions or disabled sound
  }
};

export const NotificationProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [toasts, setToasts] = useState<ToastItem[]>([]);
  const [notifications, setNotifications] = useState<NotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);

  const { user } = useAuth();
  const navigate = useNavigate();
  const hasFetchedRef = useRef(false);

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem: ToastItem = { ...item, id };

    playChime();

    setToasts((prev) => [newItem, ...prev.slice(0, 4)]); // Keep max 5 visible toasts

    const duration = item.duration ?? 5000;
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  // Fetch notifications once on demand or on user login (cached, no interval polling)
  const refreshNotifications = useCallback(async (silent = true) => {
    if (!user) return;
    try {
      const res = await api.get('/notifications', {
        headers: silent ? { 'X-Silent': 'true' } : {}
      });
      const notifs: NotificationItem[] = res.data.notifications || [];
      const unread: number = res.data.unread_count ?? notifs.filter((n) => !n.is_read).length;

      setNotifications(notifs);
      setUnreadCount(unread);
    } catch {
      // Silent error handling for network glitch
    }
  }, [user]);

  // Mark all notifications as read
  const markAllRead = useCallback(async () => {
    try {
      await api.post('/notifications/read-all', {}, {
        headers: { 'X-Silent': 'true' }
      });
      setUnreadCount(0);
      setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
    } catch {
      // ignore
    }
  }, []);

  // Fetch cached notifications ONCE when user signs in — NO setInterval polling
  useEffect(() => {
    if (!user) {
      hasFetchedRef.current = false;
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    if (!hasFetchedRef.current) {
      hasFetchedRef.current = true;
      refreshNotifications(true);
    }
  }, [user, refreshNotifications]);

  const notify = {
    success: (titleOrMsg: string, maybeMsg?: string, link?: string) => {
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Success',
        message: maybeMsg || titleOrMsg,
        type: 'success',
        link
      });
      refreshNotifications(true);
    },
    info: (titleOrMsg: string, maybeMsg?: string, link?: string) => {
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Notice',
        message: maybeMsg || titleOrMsg,
        type: 'info',
        link
      });
      refreshNotifications(true);
    },
    error: (titleOrMsg: string, maybeMsg?: string) =>
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Error',
        message: maybeMsg || titleOrMsg,
        type: 'error'
      }),
    group: (titleOrMsg: string, maybeMsg?: string, link?: string) => {
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Group Notification',
        message: maybeMsg || titleOrMsg,
        type: 'group',
        link
      });
      refreshNotifications(true);
    },
    project: (titleOrMsg: string, maybeMsg?: string, link?: string) => {
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Project Notification',
        message: maybeMsg || titleOrMsg,
        type: 'project',
        link
      });
      refreshNotifications(true);
    }
  };

  const handleToastClick = (toast: ToastItem) => {
    if (toast.link) {
      navigate(toast.link);
      removeNotification(toast.id);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />;
      case 'group':
        return <Users className="w-4 h-4 text-blue-400 shrink-0" />;
      case 'project':
        return <Rocket className="w-4 h-4 text-[#FFAA2B] shrink-0" />;
      case 'message':
        return <MessageSquare className="w-4 h-4 text-purple-400 shrink-0" />;
      default:
        return <Bell className="w-4 h-4 text-[#FFAA2B] shrink-0" />;
    }
  };

  return (
    <NotificationContext.Provider
      value={{
        unreadCount,
        notifications,
        refreshNotifications,
        markAllRead,
        showNotification,
        removeNotification,
        notify
      }}
    >
      {children}

      {/* Floating On-Screen Popups Container */}
      <div
        aria-live="polite"
        className="fixed top-16 right-4 sm:right-6 z-[9999] flex flex-col gap-2.5 max-w-sm sm:max-w-md w-full pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.2 }}
              className="pointer-events-auto group relative overflow-hidden rounded-[14px] bg-[#141414] border border-[#292929] p-3.5 shadow-2xl hover:border-[#383838] transition-all cursor-pointer"
              onClick={() => handleToastClick(t)}
            >
              {/* Subtle top indicator bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-0.5 ${
                  t.type === 'success'
                    ? 'bg-emerald-400'
                    : t.type === 'error'
                    ? 'bg-red-400'
                    : t.type === 'group'
                    ? 'bg-blue-400'
                    : t.type === 'project'
                    ? 'bg-[#FFAA2B]'
                    : t.type === 'message'
                    ? 'bg-purple-400'
                    : 'bg-[#FFAA2B]'
                }`}
              />

              <div className="flex items-start gap-3">
                {t.sender_avatar ? (
                  <img
                    src={t.sender_avatar}
                    alt={t.sender_name || 'Sender'}
                    className="w-8 h-8 rounded-full object-cover border border-[#2A2A2A] shrink-0"
                  />
                ) : (
                  <div className="p-1.5 rounded-[8px] bg-[#1A1A1A] border border-[#262626] shrink-0">
                    {getIcon(t.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0 pr-5">
                  <div className="flex items-center gap-1.5">
                    <h4 className="text-xs font-semibold text-white tracking-tight truncate">
                      {t.title}
                    </h4>
                    {t.link && (
                      <ExternalLink className="w-2.5 h-2.5 text-[#666]" />
                    )}
                  </div>
                  <p className="text-xs text-[#8A8A8A] mt-0.5 leading-relaxed line-clamp-2">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(t.id);
                  }}
                  className="absolute top-2.5 right-2.5 p-1 rounded-md text-[#555] hover:text-white hover:bg-[#1E1E1E] transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

const defaultNotificationContext: NotificationContextType = {
  unreadCount: 0,
  notifications: [],
  refreshNotifications: async () => {},
  markAllRead: async () => {},
  showNotification: () => {},
  removeNotification: () => {},
  notify: {
    success: () => {},
    info: () => {},
    error: () => {},
    group: () => {},
    project: () => {}
  }
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  return context || defaultNotificationContext;
};
