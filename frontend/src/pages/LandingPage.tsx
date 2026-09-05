import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import {
  MapPin,
  Sparkles,
  Rocket,
  Shield,
  ArrowRight,
  CheckCircle2,
  ChevronDown,
  MessageSquare,
  Zap
} from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';

export const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const categories = [
    { title: 'Study & SAT/IELTS', icon: '📚', count: '450+ peers', desc: 'SAT Math 800, IELTS 8.5, university exams, calculus, and study accountability partner matching.' },
    { title: 'Coding & Tech', icon: '💻', count: '620+ devs', desc: 'React, Python AI, LeetCode sprints, hackathon teams & open-source collaboration.' },
    { title: 'Startups & MVPs', icon: '🚀', count: '280+ builders', desc: 'Find co-founders, UI designers, fullstack engineers, and build real startup MVPs.' },
    { title: 'Gaming & Co-op', icon: '🎮', count: '510+ gamers', desc: 'Minecraft, Valorant, CS2, indie games, and game dev collaboration in Unity & Godot.' },
    { title: 'Language Exchange', icon: '🌎', count: '390+ speakers', desc: 'Practice English speaking circles, French, German, or Uzbek conversation circles.' },
    { title: 'Design & Creative', icon: '🎨', count: '210+ designers', desc: 'UI/UX design critique, 3D Blender modeling, digital illustrations & video production.' }
  ];

  const features = [
    {
      icon: <Sparkles className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      title: 'AI Conversational Matchmaker',
      desc: 'Our interactive AI assistant analyzes your exact learning goals, skill level, and schedule to calculate precise multi-dimensional compatibility scores.'
    },
    {
      icon: <MapPin className="w-5 h-5 text-neutral-900 dark:text-white" />,
      title: 'Privacy-Preserving GPS Discovery',
      desc: 'Discover peers in your city or university campus within 5-25 km without ever sharing your exact street address (using secure coordinate fuzzing).'
    },
    {
      icon: <MessageSquare className="w-5 h-5 text-neutral-900 dark:text-white" />,
      title: 'Community Guilds & Group Chats',
      desc: 'Connect in real-time community guilds with interactive polls, instant replies, hover reactions, and pinned announcements.'
    },
    {
      icon: <Rocket className="w-5 h-5 text-neutral-900 dark:text-white" />,
      title: 'Live Study Sessions & Projects',
      desc: 'Create or join scheduled meetups, project roadmaps, and 1-on-1 accountability sessions with one click.'
    },
    {
      icon: <Shield className="w-5 h-5 text-amber-500 dark:text-amber-400" />,
      title: '100% Non-Dating Safety Focus',
      desc: 'Dedicated purely to friendship, study accountability, and co-building. Built-in moderation, user reporting, and voluntary contact sharing.'
    },
    {
      icon: <Zap className="w-5 h-5 text-neutral-900 dark:text-white" />,
      title: 'Progress Tracking & Streaks',
      desc: 'Track your weekly study hours, completed sessions, skill growth, and collaboration milestones directly on your live profile dashboard.'
    }
  ];

  const faqs = [
    {
      category: 'Platform Purpose',
      q: "Is WithMe a dating app?",
      a: "No, absolutely not. WithMe is strictly a friendship, study-partner, project collaboration, and shared-hobby discovery platform. Profiles emphasize goals, skills, and activities."
    },
    {
      category: 'Matching Algorithm',
      q: "How does the compatibility algorithm work?",
      a: "Our algorithm calculates a multi-dimensional score (0-100%) factoring in shared interests, target goals (e.g. SAT Math, IELTS 8.0), skill levels, schedule overlap, and approximate location."
    },
    {
      category: 'Safety & Privacy',
      q: "Is my exact address or location visible to others?",
      a: "Never. WithMe uses privacy-first coordinate fuzzing (~1-2 km random offset) and only displays approximate distance buckets (e.g. 'Within 3 km' or 'Tashkent, Uzbekistan')."
    },
    {
      category: 'Cost & Access',
      q: "Is WithMe completely free to use?",
      a: "Yes. Creating an account, chatting with AI, finding partners, joining community guilds, and creating study sessions is 100% free."
    }
  ];

  return (
    <div className="space-y-32 bg-[#F8F9FA] dark:bg-[#080808] text-neutral-900 dark:text-white transition-colors duration-200">
      {/* 1. Hero Section */}
      <section className="relative pt-20 pb-20 md:pt-32 md:pb-32 overflow-hidden border-b border-neutral-200 dark:border-[#1F1F1F]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-8">
          
          <motion.div
            initial={{ opacity: 0, y: 15 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3.5 py-1 rounded-full bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#292929] text-xs font-semibold text-neutral-800 dark:text-[#D4D4D4] shadow-xs"
          >
            <span className="w-2 h-2 rounded-full bg-amber-500 dark:bg-amber-400" />
            <span>Discover Study Partners, Co-Builders & Teammates</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.1 }}
            className="text-5xl sm:text-7xl lg:text-8xl font-black tracking-tight text-neutral-900 dark:text-white max-w-4xl mx-auto leading-[1.05]"
          >
            FIND YOUR <br />
            <span className="text-neutral-900 dark:text-white">PEOPLE.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.2 }}
            className="text-base sm:text-xl text-neutral-600 dark:text-[#8A8A8A] max-w-2xl mx-auto leading-relaxed"
          >
            Not just people nearby. People who want to do the exact same things you do.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, delay: 0.3 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-3.5 pt-4"
          >
            <Link to="/register" className="w-full sm:w-auto">
              <Button size="lg" className="w-full sm:w-auto font-bold px-8 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black shadow-lg">
                Find My People
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
            <Link to="/discover" className="w-full sm:w-auto">
              <Button variant="outline" size="lg" className="w-full sm:w-auto px-8 border-neutral-300 dark:border-[#292929] text-neutral-900 dark:text-white hover:bg-neutral-100 dark:hover:bg-[#141414]">
                Explore Community
              </Button>
            </Link>
          </motion.div>

          {/* Minimal Trust Bar */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.5, delay: 0.4 }}
            className="pt-12 flex flex-wrap items-center justify-center gap-6 text-xs text-neutral-500 dark:text-[#8A8A8A]"
          >
            <span className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-neutral-900 dark:text-white" />
              100% Free Platform
            </span>
            <span className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-neutral-900 dark:text-white" />
              Privacy-First & Anti-Dating
            </span>
            <span className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Instant AI Matchmaking
            </span>
          </motion.div>
        </div>
      </section>

      {/* 2. Live Interactive Match Showcase */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-6 sm:p-12 shadow-xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-10 pb-6 border-b border-neutral-200 dark:border-[#242424]">
            <div>
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider mb-1">Live Match Engine</p>
              <h3 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">How compatibility works in real time</h3>
            </div>
            <Link to="/discover" className="text-xs font-bold text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-neutral-300 flex items-center gap-1">
              Browse all 1,200+ members <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Card 1 */}
            <div className="bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl p-5 space-y-4 hover:border-neutral-300 dark:hover:border-[#383838] transition-all shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1F1F1F] border border-neutral-300 dark:border-[#2E2E2E] dark:text-white flex items-center justify-center font-bold text-xs">
                    SK
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Sarah Kim</h4>
                    <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">SAT Math 800 · Tashkent</p>
                  </div>
                </div>
                <Badge variant="accent">98% Match</Badge>
              </div>
              <p className="text-xs text-neutral-700 dark:text-[#D4D4D4] leading-relaxed">
                Solving 40 hard calculus & geometry problems every Saturday morning together.
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-[#242424] text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
                <span>📚 SAT Mathematics</span>
                <span>•</span>
                <span className="text-neutral-900 dark:text-white font-medium">⚡ Available Weekends</span>
              </div>
            </div>

            {/* Card 2 */}
            <div className="bg-neutral-50 dark:bg-[#141414] border border-neutral-300 dark:border-[#2E2E2E] rounded-2xl p-5 space-y-4 shadow-sm">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1F1F1F] border border-neutral-300 dark:border-[#2E2E2E] dark:text-white flex items-center justify-center font-bold text-xs">
                    DP
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">David Park</h4>
                    <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">Python AI Dev · Campus</p>
                  </div>
                </div>
                <Badge variant="accent">94% Match</Badge>
              </div>
              <p className="text-xs text-neutral-700 dark:text-[#D4D4D4] leading-relaxed">
                Fine-tuning open-source LLMs & building agents with FastAPI and LangChain.
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-[#242424] text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
                <span>💻 PyTorch & AI</span>
                <span>•</span>
                <span className="text-neutral-900 dark:text-white font-medium">🚀 Looking for co-builder</span>
              </div>
            </div>

            {/* Card 3 */}
            <div className="bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl p-5 space-y-4 hover:border-neutral-300 dark:hover:border-[#383838] transition-all shadow-xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1F1F1F] border border-neutral-300 dark:border-[#2E2E2E] dark:text-white flex items-center justify-center font-bold text-xs">
                    MV
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-neutral-900 dark:text-white">Marcus Vance</h4>
                    <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">IELTS 8.5 Circle · ~2 km</p>
                  </div>
                </div>
                <Badge variant="accent">91% Match</Badge>
              </div>
              <p className="text-xs text-neutral-700 dark:text-[#D4D4D4] leading-relaxed">
                Daily 30-minute English speaking mock tests & essay peer reviewing.
              </p>
              <div className="flex items-center gap-2 pt-2 border-t border-neutral-200 dark:border-[#242424] text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
                <span>🌎 IELTS Speaking</span>
                <span>•</span>
                <span className="text-neutral-900 dark:text-white font-medium">🟢 Online Now</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* 3. Categories Grid */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center max-w-xl mx-auto space-y-2">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Explore Activities</p>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">Communities built for doing</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {categories.map((cat, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-6 hover:border-neutral-300 dark:hover:border-[#3D3D3D] hover:bg-neutral-50 dark:hover:bg-[#141414] transition-all space-y-3 shadow-xs"
              >
                <div className="flex items-center justify-between">
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="text-[11px] font-bold text-neutral-600 dark:text-[#8A8A8A] bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] px-2.5 py-0.5 rounded-full">
                    {cat.count}
                  </span>
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">{cat.title}</h3>
                <p className="text-xs text-neutral-600 dark:text-[#8A8A8A] leading-relaxed">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 4. Core Features */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-8 sm:p-14 shadow-lg">
          <div className="max-w-xl mb-12 space-y-2">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Engineered for Connection</p>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">Everything you need to find your partner</h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {features.map((feat, idx) => (
              <div key={idx} className="space-y-3">
                <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#292929] flex items-center justify-center shadow-xs">
                  {feat.icon}
                </div>
                <h3 className="text-base font-bold text-neutral-900 dark:text-white">{feat.title}</h3>
                <p className="text-xs text-neutral-600 dark:text-[#8A8A8A] leading-relaxed">{feat.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 5. FAQ Section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-8">
          <div className="text-center space-y-2">
            <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider">Got Questions?</p>
            <h2 className="text-3xl sm:text-4xl font-black text-neutral-900 dark:text-white tracking-tight">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-3">
            {faqs.map((faq, idx) => (
              <div
                key={idx}
                className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl overflow-hidden transition-all shadow-xs"
              >
                <button
                  type="button"
                  onClick={() => setOpenFaq(openFaq === idx ? null : idx)}
                  className="w-full flex items-center justify-between p-5 text-left text-sm font-bold text-neutral-900 dark:text-white hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-amber-600 dark:text-amber-400">
                      {faq.category}
                    </span>
                    <span>{faq.q}</span>
                  </div>
                  <ChevronDown
                    className={`w-4 h-4 text-neutral-500 dark:text-[#8A8A8A] transition-transform duration-200 shrink-0 ml-2 ${
                      openFaq === idx ? 'rotate-180 text-neutral-900 dark:text-white' : ''
                    }`}
                  />
                </button>
                {openFaq === idx && (
                  <div className="px-5 pb-5 pt-1 text-xs text-neutral-600 dark:text-[#8A8A8A] leading-relaxed border-t border-neutral-100 dark:border-[#1F1F1F]">
                    {faq.a}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* 6. Call To Action Footer Banner */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pb-16">
        <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-10 sm:p-16 text-center space-y-6 shadow-xl">
          <h2 className="text-3xl sm:text-5xl font-black text-neutral-900 dark:text-white tracking-tight max-w-2xl mx-auto">
            Ready to meet people who share your passion?
          </h2>
          <p className="text-sm text-neutral-600 dark:text-[#8A8A8A] max-w-lg mx-auto">
            Join hundreds of motivated students, developers, and creators on WithMe today.
          </p>
          <div className="pt-2">
            <Link to="/register">
              <Button size="lg" className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-black font-bold px-10">
                Get Started Free
                <ArrowRight className="w-4 h-4 ml-2" />
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};
