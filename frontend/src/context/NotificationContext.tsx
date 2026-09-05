import React, { createContext, useContext, useState, useEffect, useRef, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Bell,
  CheckCircle2,
  AlertCircle,
  Info,
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

interface NotificationContextType {
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
  const { user } = useAuth();
  const navigate = useNavigate();
  const seenIdsRef = useRef<Set<string>>(new Set());
  const initialFetchDone = useRef(false);

  const removeNotification = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  const showNotification = useCallback((item: Omit<ToastItem, 'id'>) => {
    const id = `toast_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const newItem: ToastItem = { ...item, id };

    playChime();

    setToasts((prev) => [newItem, ...prev.slice(0, 4)]); // Keep max 5 visible toasts

    const duration = item.duration ?? 5500;
    if (duration > 0) {
      setTimeout(() => {
        removeNotification(id);
      }, duration);
    }
  }, [removeNotification]);

  const notify = {
    success: (titleOrMsg: string, maybeMsg?: string, link?: string) =>
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Success',
        message: maybeMsg || titleOrMsg,
        type: 'success',
        link
      }),
    info: (titleOrMsg: string, maybeMsg?: string, link?: string) =>
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Notice',
        message: maybeMsg || titleOrMsg,
        type: 'info',
        link
      }),
    error: (titleOrMsg: string, maybeMsg?: string) =>
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Error',
        message: maybeMsg || titleOrMsg,
        type: 'error'
      }),
    group: (titleOrMsg: string, maybeMsg?: string, link?: string) =>
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Group Notification',
        message: maybeMsg || titleOrMsg,
        type: 'group',
        link
      }),
    project: (titleOrMsg: string, maybeMsg?: string, link?: string) =>
      showNotification({
        title: maybeMsg ? titleOrMsg : 'Project Notification',
        message: maybeMsg || titleOrMsg,
        type: 'project',
        link
      })
  };

  // Poll for live incoming backend notifications and pop them up on screen
  useEffect(() => {
    if (!user) {
      seenIdsRef.current.clear();
      initialFetchDone.current = false;
      return;
    }

    const poll = async () => {
      try {
        const res = await api.get('/notifications');
        const notifs = res.data.notifications || [];

        if (!initialFetchDone.current) {
          // On first load, seed the seen IDs without popping existing notifications up
          notifs.forEach((n: any) => seenIdsRef.current.add(n.id));
          initialFetchDone.current = true;
          return;
        }

        // For any new unread notification not seen yet, trigger screen popup!
        for (const n of notifs) {
          if (!seenIdsRef.current.has(n.id)) {
            seenIdsRef.current.add(n.id);
            if (!n.is_read) {
              let type: ToastItem['type'] = 'info';
              if (n.type === 'group_invite') type = 'group';
              else if (n.type === 'project_invite') type = 'project';
              else if (n.type === 'message') type = 'message';
              else if (n.type === 'connection_accepted') type = 'success';

              showNotification({
                title: n.title || 'New Notification',
                message: n.message || '',
                type,
                link: n.link,
                sender_name: n.sender_name,
                sender_avatar: n.sender_avatar
              });
            }
          }
        }
      } catch {
        // silent fail on network glitch
      }
    };

    poll();
    const interval = setInterval(poll, 7000); // Check every 7s
    return () => clearInterval(interval);
  }, [user, showNotification]);

  const handleToastClick = (toast: ToastItem) => {
    if (toast.link) {
      navigate(toast.link);
      removeNotification(toast.id);
    }
  };

  const getIcon = (type?: string) => {
    switch (type) {
      case 'success':
        return <CheckCircle2 className="w-5 h-5 text-emerald-500 shrink-0" />;
      case 'error':
        return <AlertCircle className="w-5 h-5 text-red-500 shrink-0" />;
      case 'group':
        return <Users className="w-5 h-5 text-blue-500 shrink-0" />;
      case 'project':
        return <Rocket className="w-5 h-5 text-amber-500 shrink-0" />;
      case 'message':
        return <MessageSquare className="w-5 h-5 text-purple-500 shrink-0" />;
      default:
        return <Bell className="w-5 h-5 text-primary shrink-0" />;
    }
  };

  return (
    <NotificationContext.Provider value={{ showNotification, removeNotification, notify }}>
      {children}

      {/* Floating On-Screen Popups Container */}
      <div
        aria-live="polite"
        className="fixed top-20 right-4 sm:right-6 z-[9999] flex flex-col gap-3 max-w-sm sm:max-w-md w-full pointer-events-none"
      >
        <AnimatePresence mode="popLayout">
          {toasts.map((t) => (
            <motion.div
              key={t.id}
              layout
              initial={{ opacity: 0, y: -25, scale: 0.92 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -15, scale: 0.95 }}
              transition={{ type: 'spring', damping: 24, stiffness: 350 }}
              className="pointer-events-auto group relative overflow-hidden rounded-2xl bg-white/95 dark:bg-[#121212]/95 backdrop-blur-xl border border-neutral-200 dark:border-[#282828] p-4 shadow-2xl hover:shadow-3xl transition-all cursor-pointer"
              onClick={() => handleToastClick(t)}
            >
              {/* Subtle top indicator bar */}
              <div
                className={`absolute top-0 left-0 right-0 h-1 ${
                  t.type === 'success'
                    ? 'bg-emerald-500'
                    : t.type === 'error'
                    ? 'bg-red-500'
                    : t.type === 'group'
                    ? 'bg-blue-500'
                    : t.type === 'project'
                    ? 'bg-amber-500'
                    : t.type === 'message'
                    ? 'bg-purple-500'
                    : 'bg-primary'
                }`}
              />

              <div className="flex items-start gap-3">
                {t.sender_avatar ? (
                  <img
                    src={t.sender_avatar}
                    alt={t.sender_name || 'Sender'}
                    className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-[#333] shrink-0"
                  />
                ) : (
                  <div className="p-2 rounded-xl bg-neutral-100 dark:bg-[#1E1E1E] shrink-0">
                    {getIcon(t.type)}
                  </div>
                )}

                <div className="flex-1 min-w-0 pr-6">
                  <div className="flex items-center gap-2">
                    <h4 className="text-xs font-bold text-neutral-900 dark:text-white tracking-tight truncate">
                      {t.title}
                    </h4>
                    {t.link && (
                      <span className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] flex items-center gap-0.5">
                        <ExternalLink className="w-2.5 h-2.5" />
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-[#D4D4D4] mt-0.5 leading-relaxed line-clamp-2">
                    {t.message}
                  </p>
                </div>

                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    removeNotification(t.id);
                  }}
                  className="absolute top-3 right-3 p-1 rounded-lg text-neutral-400 hover:text-neutral-900 dark:text-[#707070] dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#202020] transition-colors cursor-pointer"
                  title="Dismiss"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
};

export const useNotification = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};
