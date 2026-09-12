import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Share2,
  ShieldCheck,
  Trash2,
  ArrowLeft,
  Search,
  Loader2,
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { ContactShareModal } from '@/components/common/ContactShareModal';
import { getInitials, formatTimeAgo } from '@/lib/utils';
import type { Conversation, Message } from '@/types';

export const MessagesPage: React.FC = () => {
  const { id: routeConvId } = useParams<{ id: string }>();
  const [searchParams] = useSearchParams();
  const queryConvId = searchParams.get('conv');
  const { user } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [selectedConvId, setSelectedConvId] = useState<string | null>(
    queryConvId || routeConvId || null
  );
  const [activeConvData, setActiveConvData] = useState<any>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [showContactModal, setShowContactModal] = useState(false);
  const [convSearch, setConvSearch] = useState('');

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const messagesContainerRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const fetchConversations = async () => {
    try {
      const res = await api.get('/conversations');
      setConversations(res.data);
      if (!selectedConvId && res.data.length > 0) {
        setSelectedConvId(res.data[0].id);
      }
    } catch (err) {
      console.error('Failed to load conversations', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchActiveConversation = async (convId: string, silent = false) => {
    try {
      const res = await api.get(`/conversations/${convId}`, {
        headers: silent ? { 'X-Silent': 'true' } : {}
      });
      setActiveConvData(res.data);
    } catch (err) {
      console.error('Failed to load conversation', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(() => {
      api.get('/conversations', { headers: { 'X-Silent': 'true' } })
        .then((res) => setConversations(res.data))
        .catch(() => {});
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (queryConvId) setSelectedConvId(queryConvId);
    else if (routeConvId) setSelectedConvId(routeConvId);
  }, [queryConvId, routeConvId]);

  useEffect(() => {
    if (selectedConvId) {
      fetchActiveConversation(selectedConvId, false);
      const interval = setInterval(() => fetchActiveConversation(selectedConvId, true), 5000);
      return () => clearInterval(interval);
    }
  }, [selectedConvId]);

  useEffect(() => {
    if (messagesContainerRef.current) {
      messagesContainerRef.current.scrollTop = messagesContainerRef.current.scrollHeight;
    }
  }, [activeConvData?.messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputMessage.trim() || !selectedConvId) return;
    const content = inputMessage.trim();
    setInputMessage('');
    setSending(true);

    const tempId = `temp-${Date.now()}`;
    const optimisticMessage: any = {
      id: tempId,
      conversation_id: selectedConvId,
      sender_id: user?.id,
      content,
      message_type: 'text',
      created_at: new Date().toISOString(),
      isPending: true
    };

    // Immediately show in chat UI
    setActiveConvData((prev: any) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...(prev.messages || []), optimisticMessage]
      };
    });

    try {
      const res = await api.post(`/conversations/${selectedConvId}/messages`, { content });
      const savedMsg = res.data;
      // Replace optimistic message with confirmed message
      setActiveConvData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).map((m: any) => (m.id === tempId ? savedMsg : m))
        };
      });
      fetchConversations();
    } catch (err) {
      console.error('Failed to send message', err);
      // Mark optimistic message as failed
      setActiveConvData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: (prev.messages || []).map((m: any) =>
            m.id === tempId ? { ...m, isFailed: true, isPending: false } : m
          )
        };
      });
      notify.error('Xatolik', "Xabarni jo'natishda xatolik yuz berdi");
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    setDeletingId(messageId);
    try {
      await api.delete(`/messages/${messageId}`);
      setActiveConvData((prev: any) => {
        if (!prev) return prev;
        return { ...prev, messages: prev.messages.filter((m: Message) => m.id !== messageId) };
      });
      notify.info('Message deleted', 'Your message has been removed.');
      await fetchConversations();
    } catch (err: any) {
      notify.error('Delete failed', err.response?.data?.error || 'Failed to delete message');
    } finally {
      setDeletingId(null);
    }
  };

  const currentOtherUser = activeConvData?.conversation?.other_user;

  const filteredConversations = conversations.filter((c) =>
    c.other_user?.display_name?.toLowerCase().includes(convSearch.toLowerCase())
  );

  return (
    <div className="h-screen bg-[#000] flex overflow-hidden md:ml-0">
      {/* Two-column messages layout */}
      <div className="flex-1 flex min-h-0">
        {/* ── Left: Conversations list ── */}
        <div
          className={`w-full md:w-[280px] xl:w-[300px] flex flex-col border-r border-[#1A1A1A] bg-[#080808] shrink-0 ${
            selectedConvId ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* List header */}
          <div className="px-4 py-4 border-b border-[#1A1A1A]">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-bold text-white">Messages</h2>
              <Link to="/discover" className="text-xs text-[#555] hover:text-[#8A8A8A] transition-colors">
                Find friends
              </Link>
            </div>
            {/* Search */}
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-[#444]" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={convSearch}
                onChange={(e) => setConvSearch(e.target.value)}
                className="w-full pl-9 pr-3 py-2 bg-[#111] border border-[#242424] rounded-[8px] text-xs text-white placeholder-[#444] focus:outline-none focus:border-[#333] transition-colors"
              />
            </div>
          </div>

          {/* Conversation items */}
          <div className="flex-1 overflow-y-auto">
            {loading ? (
              <div className="p-4 space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className="skeleton w-10 h-10 rounded-full shrink-0" />
                    <div className="flex-1 space-y-1.5">
                      <div className="skeleton h-3 w-3/5 rounded" />
                      <div className="skeleton h-2.5 w-4/5 rounded" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredConversations.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-40 text-center px-4">
                <MessageSquare className="w-8 h-8 text-[#2A2A2A] mb-2" />
                <p className="text-xs text-[#555]">No conversations yet.</p>
                <p className="text-[11px] text-[#444] mt-1">Connect with peers to start chatting!</p>
              </div>
            ) : (
              <div className="py-1">
                {filteredConversations.map((c) => {
                  const isSelected = selectedConvId === c.id;
                  return (
                    <button
                      key={c.id}
                      type="button"
                      onClick={() => {
                        setSelectedConvId(c.id);
                        navigate(`/messages/${c.id}`);
                      }}
                      className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-colors cursor-pointer ${
                        isSelected
                          ? 'bg-[#141414] border-r-2 border-r-[#FFAA2B]'
                          : 'hover:bg-[#0F0F0F]'
                      }`}
                    >
                      {c.other_user?.avatar_url ? (
                        <img
                          src={c.other_user.avatar_url}
                          alt={c.other_user.display_name}
                          className="w-10 h-10 rounded-full object-cover border border-[#222] shrink-0"
                        />
                      ) : (
                        <div className="w-10 h-10 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-xs font-bold text-white shrink-0">
                          {getInitials(c.other_user?.display_name || 'U')}
                        </div>
                      )}

                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                          <span className={`text-xs font-semibold truncate ${isSelected ? 'text-white' : 'text-[#D4D4D4]'}`}>
                            {c.other_user?.display_name}
                          </span>
                          {c.last_message_at && (
                            <span className="text-[10px] text-[#444] shrink-0">
                              {formatTimeAgo(c.last_message_at)}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-[#555] truncate">
                          {c.last_message?.content || 'Start a conversation...'}
                        </p>
                      </div>

                      {c.unread_count > 0 && (
                        <span className="w-4 h-4 rounded-full bg-[#FFAA2B] text-[9px] font-bold text-black flex items-center justify-center shrink-0">
                          {c.unread_count}
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ── Right: Chat window ── */}
        <div
          className={`flex-1 flex flex-col min-h-0 bg-[#000] ${
            !selectedConvId ? 'hidden md:flex items-center justify-center' : 'flex'
          }`}
        >
          {selectedConvId && currentOtherUser ? (
            <>
              {/* Chat header */}
              <div className="px-4 py-3.5 border-b border-[#1A1A1A] bg-[#080808] flex items-center justify-between shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    type="button"
                    onClick={() => setSelectedConvId(null)}
                    className="md:hidden text-[#555] hover:text-white p-1 transition-colors cursor-pointer"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <Link to={`/users/${currentOtherUser.id}`} className="flex items-center gap-2.5 group">
                    {currentOtherUser.avatar_url ? (
                      <img
                        src={currentOtherUser.avatar_url}
                        alt={currentOtherUser.display_name}
                        className="w-9 h-9 rounded-full object-cover border border-[#2A2A2A]"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-[#1A1A1A] border border-[#2A2A2A] flex items-center justify-center text-xs font-bold text-white">
                        {getInitials(currentOtherUser.display_name)}
                      </div>
                    )}
                    <div>
                      <h3 className="text-sm font-semibold text-white group-hover:text-[#FFAA2B] transition-colors leading-tight">
                        {currentOtherUser.display_name}
                      </h3>
                      <p className="text-[10px] text-[#555]">
                        {currentOtherUser.city || 'Connected'}
                      </p>
                    </div>
                  </Link>
                </div>

                <button
                  type="button"
                  onClick={() => setShowContactModal(true)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-[8px] border border-[#292929] hover:border-[#3D3D3D] text-[#8A8A8A] hover:text-white text-xs font-medium transition-all cursor-pointer"
                >
                  <Share2 className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Share Contacts</span>
                </button>
              </div>

              {/* Shared contacts banner */}
              {activeConvData?.shared_contacts && Object.values(activeConvData.shared_contacts).some(Boolean) && (
                <div className="px-4 py-2 bg-[#0F0F0F] border-b border-[#1A1A1A] flex items-center gap-2 text-xs text-[#D4D4D4] flex-wrap">
                  <ShieldCheck className="w-3.5 h-3.5 text-[#FFAA2B] shrink-0" />
                  <span className="text-[#555]">Shared contacts:</span>
                  {activeConvData.shared_contacts.telegram && (
                    <span className="px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-white font-medium text-[11px]">
                      TG: {activeConvData.shared_contacts.telegram}
                    </span>
                  )}
                  {activeConvData.shared_contacts.discord && (
                    <span className="px-2 py-0.5 rounded bg-[#1A1A1A] border border-[#2A2A2A] text-white font-medium text-[11px]">
                      Discord: {activeConvData.shared_contacts.discord}
                    </span>
                  )}
                </div>
              )}

              {/* Messages */}
              <div
                ref={messagesContainerRef}
                className="flex-1 overflow-y-auto px-4 py-5 space-y-4 min-h-0"
              >
                {activeConvData?.messages?.length === 0 ? (
                  <div className="text-center py-12">
                    <p className="text-sm text-[#555]">Say hello to {currentOtherUser.display_name}!</p>
                    <p className="text-xs text-[#3A3A3A] mt-1">Ask what they're working on this week.</p>
                  </div>
                ) : (
                  activeConvData?.messages?.map((msg: any) => {
                    const isMe = msg.sender_id === user?.id;
                    const isPending = Boolean(msg.isPending);
                    const isFailed = Boolean(msg.isFailed);
                    const isDeleting = deletingId === msg.id;

                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group/msg ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-end gap-1.5 max-w-[75%]">
                          {isMe && !isPending && !isFailed && (
                            <button
                              type="button"
                              disabled={isDeleting}
                              onClick={() => handleDeleteMessage(msg.id)}
                              className={`p-1 text-[#444] hover:text-red-400 cursor-pointer transition-opacity ${
                                isDeleting ? 'opacity-100 cursor-not-allowed' : 'opacity-0 group-hover/msg:opacity-100'
                              }`}
                              title={isDeleting ? "O'chirilmoqda..." : "Delete"}
                            >
                              {isDeleting ? (
                                <Loader2 className="w-3.5 h-3.5 text-red-400 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          )}
                          <div
                            className={`rounded-[16px] px-3.5 py-2.5 text-sm leading-relaxed transition-all ${
                              isDeleting
                                ? 'opacity-40 scale-[0.98] pointer-events-none'
                                : ''
                            } ${
                              isMe
                                ? isFailed
                                  ? 'bg-red-950/60 border border-red-500/50 text-red-200 rounded-br-[4px]'
                                  : isPending
                                  ? 'bg-[#FFAA2B]/90 text-black rounded-br-[4px] font-medium shadow-sm'
                                  : 'bg-[#FFAA2B] text-black rounded-br-[4px] font-medium'
                                : 'bg-[#141414] border border-[#222] text-white rounded-bl-[4px]'
                            }`}
                          >
                            {msg.message_type === 'contact_share' ? (
                              <div className="space-y-1">
                                <p className="font-bold text-xs flex items-center gap-1.5 text-[#FFAA2B]">
                                  <ShieldCheck className="w-4 h-4" />
                                  {msg.content}
                                </p>
                                <p className="text-[11px] opacity-70">Contacts shared securely.</p>
                              </div>
                            ) : (
                              <p className="whitespace-pre-line">{msg.content}</p>
                            )}
                          </div>
                        </div>

                        <div className="flex items-center gap-1.5 text-[10px] mt-1 px-1">
                          {isDeleting ? (
                            <span className="text-red-400 font-medium inline-flex items-center gap-1 animate-pulse">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              O'chirilmoqda...
                            </span>
                          ) : isPending ? (
                            <span className="text-[#FFAA2B] font-medium inline-flex items-center gap-1">
                              <Loader2 className="w-2.5 h-2.5 animate-spin" />
                              Jo'natilmoqda...
                            </span>
                          ) : isFailed ? (
                            <span className="text-red-400 font-medium inline-flex items-center gap-1">
                              ⚠️ Jo'natilmadi
                            </span>
                          ) : (
                            <span className="text-[#444]">
                              {formatTimeAgo(msg.created_at)}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Sending status bar */}
              {sending && (
                <div className="px-4 py-1.5 bg-[#0D0D0D] border-t border-[#1C1C1C] flex items-center gap-2 text-xs text-[#FFAA2B] animate-pulse">
                  <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                  <span className="font-medium text-[11px]">Xabar jo'natilmoqda...</span>
                </div>
              )}

              {/* Input */}
              <form
                onSubmit={handleSendMessage}
                className="px-4 py-3 border-t border-[#1A1A1A] bg-[#080808] flex items-center gap-2 shrink-0"
              >
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Message ${currentOtherUser.display_name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e as any);
                    }
                  }}
                  className="flex-1 bg-[#111] border border-[#242424] rounded-[10px] px-4 py-2.5 text-sm text-white placeholder-[#444] focus:outline-none focus:border-[#FFAA2B]/40 transition-colors"
                />
                <button
                  type="submit"
                  disabled={sending || !inputMessage.trim()}
                  className="w-10 h-10 rounded-full bg-[#FFAA2B] hover:bg-[#FFB83D] disabled:opacity-40 flex items-center justify-center transition-all cursor-pointer shrink-0 shadow-md"
                  title={sending ? "Jo'natilmoqda..." : "Yuborish"}
                >
                  {sending ? (
                    <Loader2 className="w-4 h-4 text-black animate-spin" />
                  ) : (
                    <Send className="w-4 h-4 text-black" />
                  )}
                </button>
              </form>

              <ContactShareModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                recipientId={currentOtherUser.id}
                recipientName={currentOtherUser.display_name}
                onSuccess={() => fetchActiveConversation(selectedConvId!)}
              />
            </>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center px-8">
              <MessageSquare className="w-12 h-12 text-[#1A1A1A] mb-4" />
              <p className="text-sm font-semibold text-[#555]">Select a conversation</p>
              <p className="text-xs text-[#333] mt-1">Choose from the left or find new friends to connect with</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
