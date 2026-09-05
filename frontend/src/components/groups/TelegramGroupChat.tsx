import React, { useState, useEffect, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Paperclip,
  Pin,
  Reply,
  Copy,
  Check,
  CheckCheck,
  BarChart2,
  Users,
  MoreVertical,
  X,
  Search,
  ArrowLeft,
  Info,
  Crown,
  Pencil,
  Trash2,
  Layers,
  Calendar,
  AlertTriangle
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Dialog } from '@/components/ui/Dialog';
import { CreatePollModal } from './CreatePollModal';
import { EditGroupModal } from './EditGroupModal';
import { getInitials, formatTimeAgo, getCategoryBadgeColor } from '@/lib/utils';
import type { Group, GroupMessage, PollData } from '@/types';

interface TelegramGroupChatProps {
  group: Group;
  onUpdateGroup?: () => void;
}

// Telegram-style deterministic member color mapping
const getAuthorColor = (name: string): string => {
  const colors = [
    '#e17076', // Red
    '#7bc862', // Green
    '#65aadd', // Light Blue
    '#a695e7', // Purple
    '#ee7aae', // Pink
    '#6ec9cb', // Cyan
    '#faa774', // Orange
    '#29b6f6'  // Sky
  ];
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
};

export const TelegramGroupChat: React.FC<TelegramGroupChatProps> = ({ group, onUpdateGroup }) => {
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [messages, setMessages] = useState<GroupMessage[]>(group.messages || []);
  const [pinnedMessage, setPinnedMessage] = useState<GroupMessage | null>(group.pinned_message || null);
  const [inputText, setInputText] = useState('');
  const [replyingTo, setReplyingTo] = useState<GroupMessage | null>(null);
  const [sending, setSending] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showPollModal, setShowPollModal] = useState(false);
  const [showAttachMenu, setShowAttachMenu] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showSearchBar, setShowSearchBar] = useState(false);
  const [showEditGroupModal, setShowEditGroupModal] = useState(false);
  const [showDeleteGroupDialog, setShowDeleteGroupDialog] = useState(false);
  const [deleteLoading, setDeleteLoading] = useState(false);

  const handleDeleteGroup = async () => {
    setDeleteLoading(true);
    const groupName = group.name;
    try {
      await api.delete(`/groups/${group.id}`);
      notify.success('Group Deleted', `"${groupName}" was deleted.`);
      setShowDeleteGroupDialog(false);
      navigate(group.project_id ? `/projects/${group.project_id}` : '/groups');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to delete group');
    } finally {
      setDeleteLoading(false);
    }
  };

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Poll for live messages every 3 seconds
  useEffect(() => {
    const fetchLatest = async () => {
      try {
        const res = await api.get(`/groups/${group.id}`);
        setMessages(res.data.messages || []);
        setPinnedMessage(res.data.pinned_message || null);
      } catch (err) {
        // ignore
      }
    };

    fetchLatest();
    const interval = setInterval(fetchLatest, 3000);
    return () => clearInterval(interval);
  }, [group.id]);

  useEffect(() => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTop = chatContainerRef.current.scrollHeight;
    }
  }, [messages.length]);

  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!inputText.trim()) return;

    const content = inputText.trim();
    setInputText('');
    setSending(true);

    const payload: any = {
      content,
      message_type: 'text',
      reply_to_id: replyingTo?.id || null
    };
    setReplyingTo(null);

    try {
      const res = await api.post(`/groups/${group.id}/messages`, payload);
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to send group message', err);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleCreatePoll = async (pollData: PollData) => {
    try {
      const res = await api.post(`/groups/${group.id}/messages`, {
        message_type: 'poll',
        content: `📊 ${pollData.question}`,
        poll_data: pollData
      });
      setMessages((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to create poll', err);
    }
  };

  const handleVotePoll = async (e: React.MouseEvent, messageId: string, optionId: string) => {
    e.preventDefault();
    e.stopPropagation();
    if (!user) return;

    // Optimistic instant UI update
    setMessages((prev) =>
      prev.map((msg) => {
        if (msg.id !== messageId || !msg.poll_data) return msg;
        const currentOptions = msg.poll_data.options || [];
        const isAlreadyVoted = currentOptions.some(
          (o) => o.id === optionId && o.voters?.includes(user.id)
        );

        const updatedOptions = currentOptions.map((opt) => {
          const voters = (opt.voters || []).filter((id) => id !== user.id);
          if (opt.id === optionId && !isAlreadyVoted) {
            voters.push(user.id);
          }
          return { ...opt, voters };
        });

        return {
          ...msg,
          poll_data: {
            ...msg.poll_data,
            options: updatedOptions
          }
        };
      })
    );

    try {
      const res = await api.post(`/groups/${group.id}/messages/${messageId}/vote`, {
        option_id: optionId
      });
      setMessages((prev) =>
        prev.map((msg) => (msg.id === messageId ? { ...msg, poll_data: res.data.poll_data } : msg))
      );
    } catch (err) {
      console.error('Failed to vote in poll', err);
    }
  };

  const handleToggleReaction = async (messageId: string, emoji: string) => {
    try {
      const res = await api.post(`/groups/${group.id}/messages/${messageId}/react`, { emoji });
      setMessages((prev) =>
        prev.map((m) => (m.id === messageId ? { ...m, reactions: res.data.reactions } : m))
      );
    } catch (err) {
      console.error('Failed to toggle reaction', err);
    }
  };

  const handleTogglePin = async (message: GroupMessage) => {
    try {
      if (message.is_pinned) {
        await api.delete(`/groups/${group.id}/messages/${message.id}/pin`);
        setPinnedMessage(null);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, is_pinned: false } : m))
        );
        notify.info('Message Unpinned', 'Message has been unpinned from top.');
      } else {
        const res = await api.post(`/groups/${group.id}/messages/${message.id}/pin`);
        setPinnedMessage(res.data.pinned_message);
        setMessages((prev) =>
          prev.map((m) => (m.id === message.id ? { ...m, is_pinned: true } : { ...m, is_pinned: false }))
        );
        notify.success('Message Pinned', 'Message pinned to the top of the chat.');
      }
      if (onUpdateGroup) onUpdateGroup();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to pin message');
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.delete(`/groups/${group.id}/messages/${messageId}`);
      setMessages((prev) => prev.filter((m) => m.id !== messageId));
      if (pinnedMessage?.id === messageId) {
        setPinnedMessage(null);
      }
      notify.info('Message Deleted', 'Your message has been removed.');
      if (onUpdateGroup) onUpdateGroup();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to delete message');
    }
  };

  const scrollToMessage = (msgId: string) => {
    const el = document.getElementById(`msg-${msgId}`);
    if (el && chatContainerRef.current) {
      const containerRect = chatContainerRef.current.getBoundingClientRect();
      const elRect = el.getBoundingClientRect();
      chatContainerRef.current.scrollTop += (elRect.top - containerRect.top) - (containerRect.height / 2);
      el.classList.add('ring-2', 'ring-amber-400');
      setTimeout(() => el.classList.remove('ring-2', 'ring-amber-400'), 2000);
    }
  };

  const filteredMessages = messages.filter((m) => {
    if (!searchQuery.trim()) return true;
    return (
      m.content?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      m.author_name?.toLowerCase().includes(searchQuery.toLowerCase())
    );
  });

  return (
    <div className="flex flex-col h-[78vh] sm:h-[84vh] bg-white dark:bg-[#080808] border border-neutral-200 dark:border-[#242424] rounded-3xl overflow-hidden shadow-2xl relative text-neutral-900 dark:text-white transition-colors duration-200">
      {/* 1. Telegram Group Header */}
      <div className="px-4 py-3 bg-white/95 dark:bg-[#0F0F0F]/95 backdrop-blur-md border-b border-neutral-200 dark:border-[#242424] flex items-center justify-between gap-3 z-30">
        <div className="flex items-center gap-3 min-w-0">
          <Link
            to={group.project_id ? `/projects/${group.project_id}` : group.activity_id ? `/activities/${group.activity_id}` : '/groups'}
            className="p-2 -ml-1 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414] transition-colors"
            title={group.project_id ? 'Back to project' : group.activity_id ? 'Back to activity' : 'Back to guilds'}
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>

          <button
            type="button"
            onClick={() => setShowInfoDrawer(true)}
            className="flex items-center gap-3 text-left min-w-0 cursor-pointer group"
          >
            <div className="relative shrink-0">
              {group.avatar_url ? (
                <img
                  src={group.avatar_url}
                  alt={group.name}
                  className="w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-[#292929]"
                />
              ) : (
                <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-xs">
                  {getInitials(group.name)}
                </div>
              )}
            </div>

            <div className="min-w-0">
              <h2 className="font-bold text-sm text-neutral-900 dark:text-white group-hover:underline truncate">
                {group.name}
              </h2>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
                {group.member_count} members · {group.online_count || Math.ceil(group.member_count * 0.6)} online
              </p>
            </div>
          </button>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setShowSearchBar(!showSearchBar)}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414] transition-colors cursor-pointer"
            title="Search messages"
          >
            <Search className="w-4 h-4" />
          </button>

          <button
            type="button"
            onClick={() => setShowInfoDrawer(!showInfoDrawer)}
            className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414] transition-colors cursor-pointer"
            title="Group info"
          >
            <MoreVertical className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Search Bar Subheader if active */}
      {showSearchBar && (
        <div className="px-4 py-2 bg-neutral-100 dark:bg-[#0F0F0F] border-b border-neutral-200 dark:border-[#242424] flex items-center gap-2 animate-in fade-in">
          <Search className="w-4 h-4 text-neutral-500 dark:text-[#8A8A8A]" />
          <input
            type="text"
            placeholder="Search in this chat..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="flex-1 bg-transparent text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#708499] focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-white text-xs"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 2. Pinned Message Bar */}
      {pinnedMessage && (
        <div
          onClick={() => scrollToMessage(pinnedMessage.id)}
          className="px-4 py-2 bg-neutral-100 dark:bg-[#141414] border-b border-neutral-200 dark:border-[#242424] flex items-center justify-between gap-3 text-xs cursor-pointer hover:bg-neutral-200/70 dark:hover:bg-[#1A1A1A] transition-colors z-20"
        >
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-1 self-stretch bg-amber-500 rounded-full shrink-0" />
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 flex items-center gap-1">
                <Pin className="w-3 h-3 rotate-45" />
                Pinned Message
              </p>
              <p className="text-neutral-700 dark:text-[#D4D4D4] text-xs truncate">{pinnedMessage.content}</p>
            </div>
          </div>

          {group.is_admin && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                handleTogglePin(pinnedMessage);
              }}
              className="text-neutral-500 hover:text-red-500 dark:text-[#8A8A8A] dark:hover:text-red-400 p-1"
              title="Unpin"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>
      )}

      {/* 3. Telegram Chat Timeline Messages Area */}
      <div
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-4 py-4 space-y-3 relative bg-neutral-50/70 dark:bg-[#080808]"
      >
        {filteredMessages.map((msg) => {
          const isMe = msg.author_id === user?.id;

          if (msg.message_type === 'system') {
            return (
              <div key={msg.id} className="flex justify-center my-2">
                <span className="px-3 py-1 rounded-full bg-neutral-200/80 dark:bg-[#141414] border border-neutral-300 dark:border-[#242424] text-[11px] text-neutral-600 dark:text-[#8A8A8A]">
                  {msg.content}
                </span>
              </div>
            );
          }

          return (
            <div
              key={msg.id}
              id={`msg-${msg.id}`}
              className={`flex items-end gap-2 group/msg transition-all ${isMe ? 'justify-end' : 'justify-start'}`}
            >
              {/* Other member avatar on left */}
              {!isMe && (
                <Link to={`/users/${msg.author_id}`} className="shrink-0 mb-1">
                  {msg.author_avatar ? (
                    <img
                      src={msg.author_avatar}
                      alt={msg.author_name}
                      className="w-7 h-7 rounded-full object-cover border border-neutral-300 dark:border-[#242424]"
                    />
                  ) : (
                    <div
                      className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-bold text-neutral-900 dark:text-white shadow-xs bg-neutral-200 dark:bg-[#1A1A1A] border border-neutral-300 dark:border-[#292929]"
                    >
                      {getInitials(msg.author_name)}
                    </div>
                  )}
                </Link>
              )}

              {/* Message Bubble + Reactions Stack */}
              <div className="flex flex-col max-w-[85%] sm:max-w-[70%] relative">
                {/* Bubble */}
                <div
                  className={`relative px-3.5 py-2.5 rounded-2xl text-xs sm:text-sm leading-relaxed transition-all shadow-xs ${
                    isMe
                      ? 'bg-neutral-900 text-white rounded-br-xs dark:bg-[#1F1F1F] dark:text-white border border-neutral-900 dark:border-[#2E2E2E]'
                      : 'bg-white text-neutral-900 rounded-bl-xs dark:bg-[#141414] dark:text-white border border-neutral-200 dark:border-[#242424]'
                  }`}
                >
                  {/* Author Name for incoming messages */}
                  {!isMe && (
                    <Link
                      to={`/users/${msg.author_id}`}
                      className="font-bold text-xs hover:underline block mb-1 text-neutral-900 dark:text-white"
                    >
                      {msg.author_name}
                    </Link>
                  )}

                  {/* Reply Quote Block */}
                  {msg.reply_to && (
                    <div
                      onClick={() => scrollToMessage(msg.reply_to!.id)}
                      className="mb-1.5 pl-2.5 py-1 border-l-2 border-neutral-900 dark:border-white bg-neutral-100 dark:bg-[#0F0F0F] rounded-r-lg text-xs cursor-pointer hover:bg-neutral-200 dark:hover:bg-[#1C1C1C] transition-colors"
                    >
                      <p className="font-bold text-[11px] text-neutral-900 dark:text-white">{msg.reply_to.author_name}</p>
                      <p className="text-neutral-600 dark:text-[#8A8A8A] text-[11px] truncate">{msg.reply_to.content}</p>
                    </div>
                  )}

                  {/* Poll View or Text Content */}
                  {msg.message_type === 'poll' && msg.poll_data ? (
                    <div className="space-y-2.5 py-1 min-w-[240px] sm:min-w-[280px]">
                      <div>
                        <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{msg.poll_data.question}</h4>
                        <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">
                          {msg.poll_data.is_anonymous ? 'Anonymous Poll' : 'Public Poll'}
                        </p>
                      </div>

                      {/* Options */}
                      <div className="space-y-1.5">
                        {(() => {
                          const totalVotes = msg.poll_data.options.reduce(
                            (acc, o) => acc + (o.voters?.length || 0),
                            0
                          );
                          const hasUserVoted = msg.poll_data.options.some((o) =>
                            o.voters?.includes(user?.id || '')
                          );

                          return msg.poll_data.options.map((opt) => {
                            const optVotes = opt.voters?.length || 0;
                            const percentage = totalVotes > 0 ? Math.round((optVotes / totalVotes) * 100) : 0;
                            const isMyChoice = opt.voters?.includes(user?.id || '');

                            return (
                              <button
                                key={opt.id}
                                type="button"
                                onClick={(e) => handleVotePoll(e, msg.id, opt.id)}
                                className={`w-full text-left p-2 rounded-xl border text-xs relative overflow-hidden transition-all cursor-pointer ${
                                  isMyChoice
                                    ? 'border-neutral-900 dark:border-white bg-neutral-100 dark:bg-[#1A1A1A] font-bold'
                                    : 'border-neutral-200 dark:border-[#242424] bg-white dark:bg-[#0F0F0F] hover:bg-neutral-50 dark:hover:bg-[#171717]'
                                }`}
                              >
                                {hasUserVoted && (
                                  <div
                                    className="absolute inset-y-0 left-0 bg-neutral-900/10 dark:bg-white/10 transition-all duration-500 rounded-lg"
                                    style={{ width: `${percentage}%` }}
                                  />
                                )}
                                <div className="relative z-10 flex items-center justify-between gap-2">
                                  <div className="flex items-center gap-2">
                                    <div
                                      className={`w-3.5 h-3.5 rounded-full border flex items-center justify-center ${
                                        isMyChoice ? 'border-neutral-900 dark:border-white bg-neutral-900 dark:bg-white text-white dark:text-black' : 'border-neutral-400 dark:border-[#383838]'
                                      }`}
                                    >
                                      {isMyChoice && <Check className="w-2.5 h-2.5" />}
                                    </div>
                                    <span className="font-medium">{opt.text}</span>
                                  </div>
                                  {hasUserVoted && (
                                    <span className="font-bold text-neutral-500 dark:text-[#8A8A8A] text-[11px]">{percentage}%</span>
                                  )}
                                </div>
                              </button>
                            );
                          });
                        })()}
                      </div>
                    </div>
                  ) : (
                    <p className="whitespace-pre-wrap">{msg.content}</p>
                  )}

                  {/* Message Timestamp */}
                  <div className={`flex items-center justify-end gap-1 mt-1 text-[10px] ${isMe ? 'text-neutral-300 dark:text-neutral-400' : 'text-neutral-500 dark:text-[#8A8A8A]'}`}>
                    <span>{formatTimeAgo(msg.created_at)}</span>
                    {isMe && <CheckCheck className="w-3 h-3 text-amber-400" />}
                  </div>
                </div>

                {/* Reactions list */}
                {msg.reactions && msg.reactions.length > 0 && (
                  <div className="flex flex-wrap gap-1 mt-1">
                    {msg.reactions.map((r, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => handleToggleReaction(msg.id, r.emoji)}
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs border transition-transform hover:scale-105 cursor-pointer ${
                          r.has_reacted || r.users?.includes(user?.id || '')
                            ? 'bg-neutral-200 border-neutral-400 dark:bg-[#1A1A1A] dark:border-white/50 text-neutral-900 dark:text-white font-bold'
                            : 'bg-white border-neutral-200 dark:bg-[#141414] dark:border-[#242424] text-neutral-600 dark:text-[#8A8A8A]'
                        }`}
                      >
                        <span>{r.emoji}</span>
                        <span className="text-[10px] font-bold">{r.count}</span>
                      </button>
                    ))}
                  </div>
                )}

                {/* Hover Quick Actions Bar */}
                <div
                  className={`absolute top-0 opacity-0 group-hover/msg:opacity-100 transition-opacity flex items-center gap-0.5 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-xl p-1 shadow-lg z-20 ${
                    isMe ? 'right-full mr-2' : 'left-full ml-2'
                  }`}
                >
                  {/* Quick Reactions */}
                  {['👍', '❤️', '🔥'].map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => handleToggleReaction(msg.id, emoji)}
                      className="p-1 text-xs hover:scale-125 transition-transform"
                    >
                      {emoji}
                    </button>
                  ))}

                  <div className="w-[1px] h-3 bg-neutral-200 dark:bg-[#242424] mx-0.5" />

                  <button
                    type="button"
                    onClick={() => setReplyingTo(msg)}
                    className="p-1 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#1A1A1A]"
                    title="Reply"
                  >
                    <Reply className="w-3.5 h-3.5" />
                  </button>

                  {group.is_admin && (
                    <button
                      type="button"
                      onClick={() => handleTogglePin(msg)}
                      className={`p-1 rounded hover:bg-neutral-100 dark:hover:bg-[#1A1A1A] ${
                        msg.is_pinned ? 'text-amber-500 dark:text-amber-400' : 'text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white'
                      }`}
                      title={msg.is_pinned ? 'Unpin' : 'Pin message'}
                    >
                      <Pin className="w-3.5 h-3.5" />
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => navigator.clipboard.writeText(msg.content)}
                    className="p-1 text-neutral-500 hover:text-neutral-900 rounded hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#1A1A1A]"
                    title="Copy text"
                  >
                    <Copy className="w-3.5 h-3.5" />
                  </button>

                  {isMe && (
                    <button
                      type="button"
                      onClick={() => handleDeleteMessage(msg.id)}
                      className="p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 rounded hover:bg-red-50 dark:hover:bg-red-950/40 transition-colors"
                      title="Delete your message"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* 4. Replying Preview Bar */}
      {replyingTo && (
        <div className="px-4 py-2 bg-neutral-100 dark:bg-[#0F0F0F] border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between gap-3 text-xs z-20">
          <div className="flex items-center gap-3 overflow-hidden">
            <div className="w-1 self-stretch bg-neutral-900 dark:bg-white rounded-full shrink-0" />
            <div className="overflow-hidden">
              <p className="text-[11px] font-bold text-neutral-900 dark:text-white">Replying to {replyingTo.author_name}</p>
              <p className="text-neutral-500 dark:text-[#8A8A8A] text-xs truncate">{replyingTo.content}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setReplyingTo(null)}
            className="text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white p-1 cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* 5. Telegram Input Bar */}
      <div className="p-3 bg-white dark:bg-[#0F0F0F] border-t border-neutral-200 dark:border-[#242424] relative z-30">
        {/* Attachment menu popover */}
        {showAttachMenu && (
          <div className="absolute bottom-full left-4 mb-2 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-2 shadow-2xl space-y-1 z-50 animate-in fade-in zoom-in-95">
            <button
              type="button"
              onClick={() => {
                setShowAttachMenu(false);
                setShowPollModal(true);
              }}
              className="w-full flex items-center gap-3 px-3.5 py-2 rounded-xl text-xs text-neutral-700 dark:text-[#D4D4D4] hover:text-neutral-900 hover:bg-neutral-100 dark:hover:text-white dark:hover:bg-[#1A1A1A] transition-colors cursor-pointer font-medium"
            >
              <BarChart2 className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Create a Poll
            </button>
          </div>
        )}

        <form onSubmit={handleSendMessage} className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setShowAttachMenu(!showAttachMenu)}
            className="p-2.5 rounded-xl text-neutral-500 hover:text-neutral-900 hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414] transition-colors cursor-pointer"
            title="Attach poll or file"
          >
            <Paperclip className="w-4 h-4" />
          </button>

          <input
            ref={inputRef}
            type="text"
            placeholder="Write a message..."
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                handleSendMessage(e);
              }
            }}
            className="flex-1 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl px-4 py-2.5 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
          />

          <button
            type="submit"
            disabled={sending || !inputText.trim()}
            className="p-2.5 rounded-2xl bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold disabled:opacity-30 disabled:cursor-not-allowed transition-all cursor-pointer shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>

      {/* 6. Telegram Group Info Drawer (Right Sidebar Modal) */}
      <AnimatePresence>
        {showInfoDrawer && (
          <motion.div
            initial={{ opacity: 0, x: 300 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 300 }}
            transition={{ type: 'spring', damping: 25, stiffness: 300 }}
            className="absolute top-0 right-0 bottom-0 w-full sm:w-80 bg-white dark:bg-[#0F0F0F] border-l border-neutral-200 dark:border-[#242424] z-50 flex flex-col shadow-2xl"
          >
            <div className="p-4 border-b border-neutral-200 dark:border-[#242424] flex items-center justify-between">
              <h3 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
                <Info className="w-4 h-4 text-neutral-700 dark:text-white" />
                Group Info
              </h3>
              <button
                type="button"
                onClick={() => setShowInfoDrawer(false)}
                className="p-1 text-neutral-500 hover:text-neutral-900 dark:text-slate-400 dark:hover:text-white rounded-lg hover:bg-neutral-100 dark:hover:bg-[#141414] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              {/* Group Profile Header */}
              <div className="text-center space-y-2">
                {group.avatar_url ? (
                  <img
                    src={group.avatar_url}
                    alt={group.name}
                    className="w-20 h-20 rounded-full object-cover mx-auto border-2 border-neutral-200 dark:border-[#242424] shadow-lg"
                  />
                ) : (
                  <div className="w-20 h-20 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-2xl mx-auto shadow-lg">
                    {getInitials(group.name)}
                  </div>
                )}
                <h4 className="font-bold text-base text-neutral-900 dark:text-white">{group.name}</h4>
                <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">{group.member_count} members</p>
                <Badge className={getCategoryBadgeColor(group.category)}>
                  {group.category}
                </Badge>
              </div>

              {/* Description */}
              <div className="p-3.5 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl text-xs text-neutral-700 dark:text-[#D4D4D4] leading-relaxed">
                <p className="font-bold text-neutral-900 dark:text-white text-[11px] mb-1 uppercase tracking-wider">About</p>
                {group.description}
              </div>

              {/* Linked Project if applicable */}
              {group.project_id && (
                <Link
                  to={`/projects/${group.project_id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs font-bold text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-[#383838] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Layers className="w-4 h-4 text-primary" />
                    Back to Project
                  </span>
                  <span className="text-[11px] text-neutral-500">→</span>
                </Link>
              )}

              {/* Linked Activity if applicable */}
              {group.activity_id && (
                <Link
                  to={`/activities/${group.activity_id}`}
                  className="flex items-center justify-between p-3 rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs font-bold text-neutral-900 dark:text-white hover:border-neutral-300 dark:hover:border-[#383838] transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    Back to Activity
                  </span>
                  <span className="text-[11px] text-neutral-500">→</span>
                </Link>
              )}

              {/* Creator Management Actions */}
              {(group.is_creator || (user && user.id === group.creator_id) || group.is_admin) && (
                <div className="flex items-center gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => setShowEditGroupModal(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-neutral-100 dark:bg-[#1C1C1C] hover:bg-neutral-200 dark:hover:bg-[#252525] text-xs font-bold text-neutral-900 dark:text-white transition-colors cursor-pointer"
                  >
                    <Pencil className="w-3.5 h-3.5" />
                    Edit Group
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowDeleteGroupDialog(true)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-red-50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/30 text-xs font-bold text-red-600 dark:text-red-400 transition-colors cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    Delete
                  </button>
                </div>
              )}

              {/* Members Roster */}
              <div className="space-y-3">
                <p className="font-bold text-xs text-neutral-900 dark:text-white flex items-center justify-between">
                  <span>Members</span>
                  <span className="text-xs text-neutral-500 dark:text-[#8A8A8A]">{group.members?.length || 0}</span>
                </p>

                <div className="space-y-2">
                  {group.members?.map((m: any) => (
                    <Link
                      key={m.user_id}
                      to={`/users/${m.user_id}`}
                      className="flex items-center justify-between p-2 rounded-xl hover:bg-neutral-100 dark:hover:bg-[#141414] transition-colors"
                    >
                      <div className="flex items-center gap-2.5">
                        {m.user?.avatar_url ? (
                          <img
                            src={m.user.avatar_url}
                            alt={m.user.display_name}
                            className="w-8 h-8 rounded-full object-cover border border-neutral-300 dark:border-[#292929]"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white flex items-center justify-center font-bold text-xs border border-neutral-300 dark:border-[#292929]">
                            {getInitials(m.user?.display_name || 'U')}
                          </div>
                        )}
                        <div>
                          <p className="font-bold text-xs text-neutral-900 dark:text-white flex items-center gap-1">
                            {m.user?.display_name || 'Member'}
                            {m.role === 'admin' && (
                              <Crown className="w-3 h-3 text-amber-500 dark:text-amber-400 shrink-0" />
                            )}
                          </p>
                          <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">@{m.user?.username}</p>
                        </div>
                      </div>

                      {m.role === 'admin' && (
                        <span className="text-[10px] bg-neutral-200 dark:bg-[#1F1F1F] text-neutral-800 dark:text-white px-2 py-0.5 rounded font-bold uppercase">
                          Admin
                        </span>
                      )}
                    </Link>
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Create Poll Modal */}
      <CreatePollModal
        isOpen={showPollModal}
        onClose={() => setShowPollModal(false)}
        onSubmit={handleCreatePoll}
      />

      {/* Edit Group Modal */}
      {showEditGroupModal && (
        <EditGroupModal
          isOpen={showEditGroupModal}
          onClose={() => setShowEditGroupModal(false)}
          group={group}
          onSuccess={(updated) => {
            notify.success('Group Updated', `"${updated.name}" settings were updated.`);
            if (onUpdateGroup) onUpdateGroup();
          }}
        />
      )}

      {/* Delete Group Confirmation */}
      <Dialog
        isOpen={showDeleteGroupDialog}
        onClose={() => setShowDeleteGroupDialog(false)}
        title="Delete Group"
        description={`Are you sure you want to delete "${group.name}"? This will permanently delete the group, messages, and all shared content.`}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This action cannot be undone.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteGroupDialog(false)}
              disabled={deleteLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={deleteLoading}
              onClick={handleDeleteGroup}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Delete Group
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
