import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Sparkles,
  Send,
  Bot,
  ArrowRight,
  Compass,
  Target,
  Code,
  MapPin
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { getInitials } from '@/lib/utils';

interface ChatMessage {
  id: string;
  sender: 'ai' | 'user';
  text: string;
  suggestedChips?: string[];
  timestamp: string;
}

export const OnboardingPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { setLocationManually } = useLocation();
  const navigate = useNavigate();

  const [currentStep, setCurrentStep] = useState(1);
  const [inputText, setInputText] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const [avatarUrl, setAvatarUrl] = useState(user?.profile?.avatar_url || 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80'
  ];

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setAvatarUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const [extractedProfile, setExtractedProfile] = useState<{
    interests: string[];
    goals: string[];
    skills: { name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' }[];
    activity_mode: 'online' | 'in_person' | 'both';
    preferred_group_size: '1-on-1' | 'small_group' | 'large_group' | 'any';
    availabilities: { day_of_week: string; time_slot: string }[];
    city: string;
    headline: string;
    bio: string;
    looking_for_summary: string;
  }>({
    interests: [],
    goals: [],
    skills: [],
    activity_mode: 'both',
    preferred_group_size: 'small_group',
    availabilities: [
      { day_of_week: 'Saturday', time_slot: 'Afternoon (12:00-18:00)' },
      { day_of_week: 'Sunday', time_slot: 'Morning (08:00-12:00)' }
    ],
    city: user?.profile?.city || 'Tashkent',
    headline: '',
    bio: '',
    looking_for_summary: ''
  });

  const [chatHistory, setChatHistory] = useState<ChatMessage[]>([
    {
      id: 'init-1',
      sender: 'ai',
      text: `Hello ${user?.profile?.display_name || user?.username || 'there'}! 👋 I am your WithMe AI Assistant.\n\nTo find you the most compatible study partners, co-builders, and teammates, tell me what you're passionate about.\n\nStep 1: Which domains and topics interest you most? (Select from options below or type your answer)`,
      suggestedChips: [
        '💻 Web & Software Dev',
        '🤖 AI & Machine Learning',
        '📐 SAT Math Prep',
        '🗣️ IELTS Speaking',
        '🎮 Game Dev (Unity/Godot)',
        '🚀 Startups & MVPs',
        '🎨 UI/UX Design',
        '⚽ Fitness & Sports',
        '📚 Books & Psychology'
      ],
      timestamp: 'Now'
    }
  ]);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatTimelineRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (chatTimelineRef.current) {
      chatTimelineRef.current.scrollTop = chatTimelineRef.current.scrollHeight;
    }
  }, [chatHistory, isAiTyping]);

  const handleSendMessage = async (textToSend?: string) => {
    const message = (textToSend || inputText).trim();
    if (!message) return;

    setInputText('');

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      sender: 'user',
      text: message,
      timestamp: 'Now'
    };
    setChatHistory((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    try {
      const res = await api.post('/users/onboarding-ai-step', {
        step: currentStep,
        message: message,
        current_state: extractedProfile
      });

      const { step: nextStep, reply, suggested_chips, extracted_state } = res.data;

      if (extracted_state) {
        setExtractedProfile(extracted_state);
      }
      setCurrentStep(nextStep);

      setTimeout(() => {
        setIsAiTyping(false);
        const aiMsg: ChatMessage = {
          id: `ai-${Date.now()}`,
          sender: 'ai',
          text: reply,
          suggestedChips: suggested_chips,
          timestamp: 'Now'
        };
        setChatHistory((prev) => [...prev, aiMsg]);
      }, 500);
    } catch (err) {
      setIsAiTyping(false);
      console.error('AI step failed', err);
    }
  };

  const handleFinishOnboarding = async () => {
    setSubmitting(true);
    try {
      await api.put('/users/me', {
        ...extractedProfile,
        avatar_url: avatarUrl
      });
      if (extractedProfile.city) {
        setLocationManually(extractedProfile.city);
      }
      await refreshUser();
      navigate('/dashboard');
    } catch (err) {
      console.error('Failed to save profile', err);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            AI Smart Onboarding
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            MEET YOUR MATCHMAKER
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#8A8A8A]">
            Have a quick conversation with our AI to generate your precision compatibility profile.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleFinishOnboarding}
            className="text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white"
          >
            Skip for now →
          </Button>
        </div>
      </div>

      {/* Main Grid: AI Chat Interface (8 cols) + Live Profile Preview (4 cols) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Pane: Interactive Conversational AI (8 cols) */}
        <div className="lg:col-span-8 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl overflow-hidden shadow-2xl flex flex-col h-[75vh]">
          {/* Chat Timeline */}
          <div ref={chatTimelineRef} className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 bg-neutral-50/70 dark:bg-[#080808]">
            {chatHistory.map((msg) => {
              const isAi = msg.sender === 'ai';
              return (
                <div
                  key={msg.id}
                  className={`flex gap-3 ${isAi ? 'justify-start' : 'justify-end'}`}
                >
                  {isAi && (
                    <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center shrink-0 shadow-xs font-bold text-xs">
                      <Bot className="w-4 h-4" />
                    </div>
                  )}

                  <div className={`space-y-2 max-w-[85%] sm:max-w-[75%]`}>
                    <div
                      className={`p-4 rounded-2xl text-xs sm:text-sm leading-relaxed shadow-xs ${
                        isAi
                          ? 'bg-white border border-neutral-200 text-neutral-900 rounded-tl-xs dark:bg-[#141414] dark:border-[#242424] dark:text-white'
                          : 'bg-neutral-900 text-white rounded-tr-xs dark:bg-[#1F1F1F] dark:border dark:border-[#2E2E2E] dark:text-white'
                      }`}
                    >
                      <p className="whitespace-pre-line">{msg.text}</p>
                    </div>

                    {/* Interactive Suggested Chips */}
                    {isAi && msg.suggestedChips && msg.suggestedChips.length > 0 && currentStep < 6 && (
                      <div className="flex flex-wrap gap-1.5 pt-1">
                        {msg.suggestedChips.map((chip, idx) => (
                          <button
                            key={idx}
                            onClick={() => handleSendMessage(chip)}
                            className="px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-900 hover:text-white dark:bg-[#141414] dark:hover:bg-white dark:hover:text-black border border-neutral-200 dark:border-[#242424] text-neutral-800 dark:text-[#D4D4D4] text-xs font-bold transition-all cursor-pointer shadow-xs"
                          >
                            {chip}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}

            {isAiTyping && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center shrink-0">
                  <Bot className="w-4 h-4" />
                </div>
                <div className="px-4 py-3 bg-white dark:bg-[#141414] rounded-2xl rounded-tl-xs border border-neutral-200 dark:border-[#242424] text-xs text-neutral-500 dark:text-[#8A8A8A] flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white animate-bounce" />
                  <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white animate-bounce [animation-delay:0.2s]" />
                  <span className="w-2 h-2 rounded-full bg-neutral-900 dark:bg-white animate-bounce [animation-delay:0.4s]" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Chat Input Bar */}
          <div className="p-3 sm:p-4 bg-white dark:bg-[#0F0F0F] border-t border-neutral-200 dark:border-[#242424]">
            {currentStep >= 6 ? (
              <Button
                variant="primary"
                size="lg"
                loading={submitting}
                onClick={handleFinishOnboarding}
                className="w-full font-bold"
              >
                Profile Ready! Explore Matches 🚀
              </Button>
            ) : (
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  handleSendMessage();
                }}
                className="flex items-center gap-2"
              >
                <input
                  type="text"
                  placeholder="Type your response or click an option above..."
                  value={inputText}
                  onChange={(e) => setInputText(e.target.value)}
                  className="flex-1 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl px-4 py-3 text-xs sm:text-sm text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                />
                <Button
                  type="submit"
                  variant="primary"
                  size="md"
                  disabled={!inputText.trim() || isAiTyping}
                  className="rounded-2xl px-5 font-bold"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            )}
          </div>
        </div>

        {/* Right Pane: Live Profile Builder Preview (4 cols) */}
        <div className="lg:col-span-4 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-5 sm:p-6 shadow-2xl flex flex-col justify-between h-[75vh] overflow-y-auto space-y-6">
          <div className="space-y-5">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200 dark:border-[#242424]">
              <div className="flex items-center gap-2">
                <Sparkles className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                <h3 className="font-bold text-xs uppercase tracking-wider text-neutral-900 dark:text-white">
                  Live Match Profile
                </h3>
              </div>
              <span className="text-[10px] px-2 py-0.5 rounded-full bg-neutral-100 text-neutral-800 dark:bg-[#141414] dark:text-white font-bold border border-neutral-200 dark:border-[#242424]">
                Auto-Building
              </span>
            </div>

            {/* Profile Card Header with Avatar upload & presets */}
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div
                  onClick={() => fileInputRef.current?.click()}
                  className="relative group cursor-pointer shrink-0"
                  title="Change avatar"
                >
                  {avatarUrl ? (
                    <img
                      src={avatarUrl}
                      alt={user?.profile?.display_name || user?.username}
                      className="w-14 h-14 rounded-full object-cover border border-neutral-300 dark:border-[#292929] shadow-md group-hover:opacity-80 transition-opacity"
                    />
                  ) : (
                    <div className="w-14 h-14 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-lg shadow-md">
                      {getInitials(user?.profile?.display_name || user?.username || 'U')}
                    </div>
                  )}
                  <div className="absolute inset-0 bg-black/60 rounded-full opacity-0 group-hover:opacity-100 flex items-center justify-center text-[10px] text-white font-bold transition-opacity">
                    Upload
                  </div>
                </div>

                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleAvatarUpload}
                  accept="image/*"
                  className="hidden"
                />

                <div>
                  <h4 className="font-bold text-sm text-neutral-900 dark:text-white">{user?.profile?.display_name || user?.username}</h4>
                  <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] line-clamp-1">
                    {extractedProfile.headline || 'Generating profile...'}
                  </p>
                  <p className="text-[10px] text-neutral-400 dark:text-[#5C5C5C] flex items-center gap-1 mt-0.5">
                    <MapPin className="w-3 h-3" />
                    {extractedProfile.city || 'Tashkent'}
                  </p>
                </div>
              </div>

              {/* Avatar Preset Chips */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] shrink-0">Presets:</span>
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-6 h-6 rounded-full overflow-hidden border transition-transform shrink-0 ${
                      avatarUrl === preset ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : 'border-neutral-300 dark:border-[#242424] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Extracted Interests */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-neutral-600 dark:text-[#8A8A8A] flex items-center gap-1">
                <Compass className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                Interests:
              </p>
              {extractedProfile.interests.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">Pending AI interview...</p>
              ) : (
                <div className="flex flex-wrap gap-1">
                  {extractedProfile.interests.map((it, idx) => (
                    <span key={idx} className="text-[11px] px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-neutral-800 dark:text-[#D4D4D4] font-medium shadow-xs">
                      {it}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Extracted Goals */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-neutral-600 dark:text-[#8A8A8A] flex items-center gap-1">
                <Target className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Goals & Focus:
              </p>
              {extractedProfile.goals.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">Pending AI interview...</p>
              ) : (
                <div className="space-y-1">
                  {extractedProfile.goals.map((g, idx) => (
                    <div key={idx} className="text-xs p-2 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-neutral-900 dark:text-white flex items-center gap-2">
                      <span className="w-1.5 h-1.5 rounded-full bg-amber-500 dark:bg-amber-400" />
                      {g}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Extracted Skills */}
            <div className="space-y-1.5">
              <p className="text-[11px] font-bold text-neutral-600 dark:text-[#8A8A8A] flex items-center gap-1">
                <Code className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
                Skills:
              </p>
              {extractedProfile.skills.length === 0 ? (
                <p className="text-xs text-neutral-400 italic">Pending AI interview...</p>
              ) : (
                <div className="flex flex-wrap gap-1.5">
                  {extractedProfile.skills.map((sk, idx) => (
                    <span key={idx} className="text-[11px] px-2 py-0.5 rounded-lg bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-neutral-900 dark:text-white flex items-center gap-1.5 shadow-xs">
                      <span>{sk.name}</span>
                      <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-neutral-200 dark:bg-[#1F1F1F] text-neutral-700 dark:text-[#D4D4D4]">
                        {sk.level}
                      </span>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Format & Schedule */}
            <div className="p-3 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-[#8A8A8A]">Format:</span>
                <span className="font-bold text-neutral-900 dark:text-white capitalize">{extractedProfile.activity_mode}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-neutral-500 dark:text-[#8A8A8A]">Group Preference:</span>
                <span className="font-bold text-neutral-900 dark:text-white">{extractedProfile.preferred_group_size}</span>
              </div>
            </div>
          </div>

          {/* Quick Submit CTA Button */}
          <Button
            variant="primary"
            size="md"
            loading={submitting}
            onClick={handleFinishOnboarding}
            className="w-full font-bold"
          >
            {currentStep >= 6 ? 'Explore Peers' : 'Save & Continue'}
            <ArrowRight className="w-4 h-4 ml-1" />
          </Button>
        </div>
      </div>
    </div>
  );
};
