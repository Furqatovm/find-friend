import React, { useState, useEffect, useRef } from 'react';
import { useParams, useSearchParams, useNavigate, Link } from 'react-router-dom';
import {
  MessageSquare,
  Send,
  Share2,
  ShieldCheck,
  Trash2
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
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
  const [selectedConvId, setSelectedConvId] = useState<string | null>(queryConvId || routeConvId || null);
  const [activeConvData, setActiveConvData] = useState<any>(null);
  const [inputMessage, setInputMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showContactModal, setShowContactModal] = useState(false);

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

  const fetchActiveConversation = async (convId: string) => {
    try {
      const res = await api.get(`/conversations/${convId}`);
      setActiveConvData(res.data);
    } catch (err) {
      console.error('Failed to load conversation details', err);
    }
  };

  useEffect(() => {
    fetchConversations();
    const interval = setInterval(fetchConversations, 10000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (queryConvId) {
      setSelectedConvId(queryConvId);
    } else if (routeConvId) {
      setSelectedConvId(routeConvId);
    }
  }, [queryConvId, routeConvId]);

  useEffect(() => {
    if (selectedConvId) {
      fetchActiveConversation(selectedConvId);
      const msgInterval = setInterval(() => fetchActiveConversation(selectedConvId), 4000);
      return () => clearInterval(msgInterval);
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

    try {
      await api.post(`/conversations/${selectedConvId}/messages`, { content });
      await fetchActiveConversation(selectedConvId);
      await fetchConversations();
    } catch (err) {
      console.error('Failed to send message', err);
    } finally {
      setSending(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleDeleteMessage = async (messageId: string) => {
    try {
      await api.delete(`/messages/${messageId}`);
      setActiveConvData((prev: any) => {
        if (!prev) return prev;
        return {
          ...prev,
          messages: prev.messages.filter((m: Message) => m.id !== messageId)
        };
      });
      notify.info('Message Deleted', 'Your message has been removed.');
      await fetchConversations();
    } catch (err: any) {
      notify.error('Delete Failed', err.response?.data?.error || 'Failed to delete message');
    }
  };

  const currentOtherUser = activeConvData?.conversation?.other_user;

  return (
    <div className="max-w-7xl mx-auto px-2 sm:px-4 lg:px-6 py-2 sm:py-3 h-[calc(100vh-4.5rem)] flex flex-col text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl overflow-hidden shadow-2xl flex-1 min-h-0 grid grid-cols-1 md:grid-cols-12">
        {/* Left Pane: Conversations List */}
        <div className={`md:col-span-4 border-r border-neutral-200 dark:border-[#242424] flex flex-col h-full min-h-0 bg-white dark:bg-[#0F0F0F] ${selectedConvId ? 'hidden md:flex' : 'flex'}`}>
          <div className="p-4 border-b border-neutral-200 dark:border-[#242424] flex items-center justify-between">
            <h2 className="font-bold text-sm text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              DIRECT MESSAGES
            </h2>
            <Link to="/discover">
              <button className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white font-medium cursor-pointer">
                Find Friends
              </button>
            </Link>
          </div>

          <div className="flex-1 overflow-y-auto p-2 space-y-1">
            {conversations.length === 0 ? (
              <div className="text-center py-12 px-4 text-xs text-neutral-500 dark:text-[#8A8A8A]">
                <MessageSquare className="w-8 h-8 mx-auto text-neutral-400 dark:text-[#5C5C5C] mb-2" />
                <p>No active conversations yet.</p>
                <p className="mt-1 text-neutral-400 dark:text-[#5C5C5C]">Connect with peers to start chatting!</p>
              </div>
            ) : (
              conversations.map((c) => {
                const isSelected = selectedConvId === c.id;
                return (
                  <button
                    key={c.id}
                    onClick={() => {
                      setSelectedConvId(c.id);
                      navigate(`/messages/${c.id}`);
                    }}
                    className={`w-full flex items-center gap-3 p-3 rounded-2xl text-left transition-all cursor-pointer ${
                      isSelected
                        ? 'bg-neutral-100 dark:bg-[#1A1A1A] border border-neutral-200 dark:border-[#333333] text-neutral-900 dark:text-white shadow-xs'
                        : 'hover:bg-neutral-50 dark:hover:bg-[#141414] text-neutral-600 dark:text-[#8A8A8A]'
                    }`}
                  >
                    {c.other_user?.avatar_url ? (
                      <img
                        src={c.other_user.avatar_url}
                        alt={c.other_user.display_name}
                        className="w-11 h-11 rounded-full object-cover border border-neutral-300 dark:border-[#292929] shrink-0"
                      />
                    ) : (
                      <div className="w-11 h-11 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center text-xs font-bold shrink-0">
                        {getInitials(c.other_user?.display_name || 'U')}
                      </div>
                    )}

                    <div className="flex-1 overflow-hidden">
                      <div className="flex items-center justify-between gap-1 mb-0.5">
                        <span className="font-bold text-xs text-neutral-900 dark:text-white truncate">
                          {c.other_user?.display_name}
                        </span>
                        {c.last_message_at && (
                          <span className="text-[10px] text-neutral-400 dark:text-[#5C5C5C] shrink-0">
                            {formatTimeAgo(c.last_message_at)}
                          </span>
                        )}
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] truncate">
                        {c.last_message?.content || 'Start conversation...'}
                      </p>
                    </div>

                    {c.unread_count > 0 && (
                      <span className="w-4 h-4 rounded-full bg-neutral-900 text-[10px] font-bold text-white dark:bg-white dark:text-black flex items-center justify-center shrink-0">
                        {c.unread_count}
                      </span>
                    )}
                  </button>
                );
              })
            )}
          </div>
        </div>

        {/* Right Pane: Chat Messages Thread */}
        <div className={`md:col-span-8 flex flex-col h-full min-h-0 bg-neutral-50 dark:bg-[#080808] ${!selectedConvId ? 'hidden md:flex items-center justify-center' : 'flex'}`}>
          {selectedConvId && currentOtherUser ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-neutral-200 dark:border-[#242424] bg-white dark:bg-[#0F0F0F] flex items-center justify-between shrink-0 z-10">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setSelectedConvId(null)}
                    className="md:hidden text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white mr-1 text-xs"
                  >
                    ←
                  </button>
                  <Link to={`/users/${currentOtherUser.id}`} className="flex items-center gap-3 group">
                    {currentOtherUser.avatar_url ? (
                      <img
                        src={currentOtherUser.avatar_url}
                        alt={currentOtherUser.display_name}
                        className="w-10 h-10 rounded-full object-cover border border-neutral-300 dark:border-[#292929]"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center text-xs font-bold">
                        {getInitials(currentOtherUser.display_name)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white group-hover:underline transition-colors">
                        {currentOtherUser.display_name}
                      </h3>
                      <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">{currentOtherUser.city || 'Connected Peer'}</p>
                    </div>
                  </Link>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setShowContactModal(true)}
                    className="text-xs font-bold"
                  >
                    <Share2 className="w-3.5 h-3.5 mr-1" />
                    <span className="hidden sm:inline">Share Contacts</span>
                  </Button>
                </div>
              </div>

              {/* Shared Contacts Banner */}
              {activeConvData?.shared_contacts && Object.values(activeConvData.shared_contacts).some(Boolean) && (
                <div className="p-3 bg-neutral-100 dark:bg-[#141414] border-b border-neutral-200 dark:border-[#242424] px-6 flex items-center justify-between text-xs text-neutral-700 dark:text-[#D4D4D4]">
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                    <span className="text-neutral-500 dark:text-[#8A8A8A]">Shared Contacts:</span>
                    {activeConvData.shared_contacts.telegram && (
                      <span className="font-bold px-2 py-0.5 rounded bg-white dark:bg-[#1F1F1F] border border-neutral-200 dark:border-[#2E2E2E] text-neutral-900 dark:text-white">
                        TG: {activeConvData.shared_contacts.telegram}
                      </span>
                    )}
                    {activeConvData.shared_contacts.discord && (
                      <span className="font-bold px-2 py-0.5 rounded bg-white dark:bg-[#1F1F1F] border border-neutral-200 dark:border-[#2E2E2E] text-neutral-900 dark:text-white">
                        Discord: {activeConvData.shared_contacts.discord}
                      </span>
                    )}
                    {activeConvData.shared_contacts.email && (
                      <span className="font-bold px-2 py-0.5 rounded bg-white dark:bg-[#1F1F1F] border border-neutral-200 dark:border-[#2E2E2E] text-neutral-900 dark:text-white">
                        Email: {activeConvData.shared_contacts.email}
                      </span>
                    )}
                  </div>
                </div>
              )}

              {/* Messages Thread */}
              <div ref={messagesContainerRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 min-h-0">
                {activeConvData?.messages?.length === 0 ? (
                  <div className="text-center py-12 text-xs text-neutral-500 dark:text-[#8A8A8A]">
                    <p>Say hello to {currentOtherUser.display_name}!</p>
                    <p className="mt-1 text-neutral-400 dark:text-[#5C5C5C]">Ask what they're studying or building this week.</p>
                  </div>
                ) : (
                  activeConvData?.messages?.map((msg: Message) => {
                    const isMe = msg.sender_id === user?.id;
                    return (
                      <div
                        key={msg.id}
                        className={`flex flex-col group/msg relative ${isMe ? 'items-end' : 'items-start'}`}
                      >
                        <div className="flex items-center gap-1.5 max-w-[85%]">
                          {isMe && (
                            <button
                              type="button"
                              onClick={() => handleDeleteMessage(msg.id)}
                              className="opacity-0 group-hover/msg:opacity-100 transition-opacity p-1.5 text-neutral-400 hover:text-red-500 rounded-lg hover:bg-neutral-200 dark:hover:bg-[#252525] shrink-0 cursor-pointer"
                              title="Delete message"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                          <div
                            className={`rounded-2xl px-4 py-2.5 text-xs sm:text-sm leading-relaxed shadow-xs ${
                              isMe
                                ? 'bg-neutral-900 text-white rounded-br-none dark:bg-[#1F1F1F] dark:border dark:border-[#2E2E2E] dark:text-white'
                                : 'bg-white text-neutral-900 border border-neutral-200 rounded-bl-none dark:bg-[#141414] dark:border-[#242424] dark:text-white'
                            }`}
                          >
                            {msg.message_type === 'contact_share' ? (
                              <div className="space-y-1.5">
                                <p className="font-bold text-xs flex items-center gap-1.5 text-amber-500 dark:text-amber-400">
                                  <ShieldCheck className="w-4 h-4" />
                                  {msg.content}
                                </p>
                                <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
                                  Contacts shared securely per voluntary permission.
                                </p>
                              </div>
                            ) : (
                              <p className="whitespace-pre-line">{msg.content}</p>
                            )}
                          </div>
                        </div>
                        <span className="text-[10px] text-neutral-400 dark:text-[#5C5C5C] mt-1 px-1">
                          {formatTimeAgo(msg.created_at)}
                        </span>
                      </div>
                    );
                  })
                )}
                <div ref={messagesEndRef} />
              </div>

              {/* Input Area - pinned to bottom */}
              <form onSubmit={handleSendMessage} className="p-3 sm:p-4 border-t border-neutral-200 dark:border-[#242424] bg-white dark:bg-[#0F0F0F] flex items-center gap-2 shrink-0 z-20 shadow-sm">
                <input
                  ref={inputRef}
                  type="text"
                  placeholder={`Message ${currentOtherUser.display_name}...`}
                  value={inputMessage}
                  onChange={(e) => setInputMessage(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' && !e.shiftKey) {
                      e.preventDefault();
                      handleSendMessage(e);
                    }
                  }}
                  className="flex-1 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl px-4 py-2.5 sm:py-3 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A] shadow-inner"
                />
                <Button type="submit" variant="primary" size="md" loading={sending} className="rounded-2xl px-4 sm:px-5 h-10 sm:h-11 font-bold shrink-0 shadow-sm">
                  <Send className="w-4 h-4" />
                </Button>
              </form>

              {/* Contact Share Modal */}
              <ContactShareModal
                isOpen={showContactModal}
                onClose={() => setShowContactModal(false)}
                recipientId={currentOtherUser.id}
                recipientName={currentOtherUser.display_name}
                onSuccess={() => fetchActiveConversation(selectedConvId)}
              />
            </>
          ) : (
            <div className="text-center text-neutral-400 dark:text-[#5C5C5C] p-8 space-y-2">
              <MessageSquare className="w-12 h-12 mx-auto text-neutral-300 dark:text-[#242424]" />
              <p className="text-sm text-neutral-900 dark:text-[#D4D4D4] font-bold">Select a conversation to start chatting</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
