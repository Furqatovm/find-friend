import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, MapPin, Users, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/Button';

// Animated connection node component
const ConnectionNode: React.FC<{
  x: number; y: number; label: string; size?: 'sm' | 'md';
  delay?: number; color?: string;
}> = ({ x, y, label, size = 'sm', delay = 0, color = '#FFAA2B' }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.5 }}
    animate={{ opacity: 1, scale: 1 }}
    transition={{ duration: 0.5, delay }}
    className="absolute flex flex-col items-center gap-1.5"
    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
  >
    <div
      className={`rounded-full border-2 flex items-center justify-center font-bold text-black text-xs shadow-lg ${
        size === 'md' ? 'w-14 h-14' : 'w-10 h-10'
      }`}
      style={{ backgroundColor: color, borderColor: color }}
    >
      {label.slice(0, 2).toUpperCase()}
    </div>
    <span className="text-[10px] text-[#8A8A8A] font-medium whitespace-nowrap">{label}</span>
  </motion.div>
);

// SVG connection line — plain SVG with CSS fade-in (no pathLength to avoid AnimatePresence conflicts)
const ConnectionLine: React.FC<{
  x1: number; y1: number; x2: number; y2: number; delay?: number;
}> = ({ x1, y1, x2, y2, delay = 0 }) => (
  <line
    x1={`${x1}%`} y1={`${y1}%`}
    x2={`${x2}%`} y2={`${y2}%`}
    stroke="#FFAA2B"
    strokeWidth="1"
    strokeOpacity="0.25"
    strokeDasharray="4 4"
    style={{
      opacity: 0,
      animation: `fadeIn 0.6s ease forwards`,
      animationDelay: `${delay}s`,
    }}
  />
);

const faqs = [
  {
    q: 'Is WithMe a dating app?',
    a: 'No. WithMe is strictly a friendship, study-partner, and project collaboration platform. Profiles focus on goals, skills, and activities.'
  },
  {
    q: 'How does the compatibility score work?',
    a: 'Our algorithm factors shared interests, goals, skill levels, schedule overlap, and approximate location to compute a 0–100% compatibility score.'
  },
  {
    q: 'Is my exact location visible to others?',
    a: 'Never. We use privacy-preserving coordinate fuzzing — only approximate distance (e.g. "Within 3 km") is shown.'
  },
  {
    q: 'Is WithMe free?',
    a: 'Yes. Finding partners, joining groups, creating sessions, and all core features are 100% free.'
  }
];

const features = [
  {
    icon: <Sparkles className="w-5 h-5 text-[#FFAA2B]" />,
    title: 'AI Matchmaker',
    desc: 'Precise multi-dimensional compatibility scores based on your goals, skills, and schedule.'
  },
  {
    icon: <MapPin className="w-5 h-5 text-[#FFAA2B]" />,
    title: 'Privacy-First GPS',
    desc: 'Discover people nearby without ever sharing your exact address.'
  },
  {
    icon: <Users className="w-5 h-5 text-[#FFAA2B]" />,
    title: 'Live Study Groups',
    desc: 'Create or join scheduled sessions, projects, and accountability circles.'
  }
];

export const LandingPage: React.FC = () => {
  const navigate = useNavigate();
  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="bg-[#000000] text-white overflow-x-hidden">
      {/* ── Hero ───────────────────────────────────────── */}
      <section className="relative min-h-[90vh] flex items-center border-b border-[#1A1A1A] overflow-hidden">
        {/* Subtle background glow */}
        <div className="absolute inset-0 overflow-hidden pointer-events-none">
          <div className="absolute top-1/4 right-1/4 w-96 h-96 bg-[#FFAA2B]/5 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 left-1/4 w-64 h-64 bg-[#FFAA2B]/3 rounded-full blur-3xl" />
        </div>

        <div className="relative max-w-6xl mx-auto px-4 sm:px-6 py-20 grid lg:grid-cols-2 gap-12 lg:gap-16 items-center">
          {/* Left — copy */}
          <div className="space-y-8">
            {/* Pill badge */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4 }}
              className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-[#141414] border border-[#292929] text-xs font-semibold text-[#D4D4D4]"
            >
              <span className="w-2 h-2 rounded-full bg-[#FFAA2B] animate-pulse" />
              50,000+ active members
            </motion.div>

            {/* Heading */}
            <motion.h1
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.1 }}
              className="text-5xl sm:text-6xl font-black leading-[1.08] tracking-tight"
            >
              Find your people<br />
              for what you{' '}
              <span className="text-[#FFAA2B]">love.</span>
            </motion.h1>

            {/* Sub */}
            <motion.p
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.2 }}
              className="text-base text-[#8A8A8A] leading-relaxed max-w-md"
            >
              Study together. Build projects. Play games. Practice skills.
              Find people nearby. Connect around shared interests.
            </motion.p>

            {/* CTA row */}
            <motion.div
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.3 }}
              className="flex flex-wrap items-center gap-3"
            >
              <Link to="/register">
                <Button variant="primary" size="lg" className="font-bold gap-2">
                  Find My People
                  <ArrowRight className="w-4 h-4" />
                </Button>
              </Link>
              <Link to="/discover">
                <Button variant="outline" size="lg">
                  Browse People
                </Button>
              </Link>
            </motion.div>

            {/* Social proof avatars */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="flex items-center gap-3"
            >
              <div className="flex -space-x-2">
                {['AJ', 'SK', 'DK', 'EW', 'MK'].map((init, i) => (
                  <div
                    key={i}
                    className="w-8 h-8 rounded-full bg-[#1A1A1A] border-2 border-[#000] flex items-center justify-center text-[10px] font-bold text-white"
                    style={{ zIndex: 5 - i }}
                  >
                    {init}
                  </div>
                ))}
              </div>
              <span className="text-xs text-[#8A8A8A]">
                Join <strong className="text-white">50,000+</strong> active members
              </span>
            </motion.div>
          </div>

          {/* Right — connection diagram */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6, delay: 0.2 }}
            className="relative h-80 lg:h-[420px] hidden sm:block"
          >
            {/* Background card */}
            <div className="absolute inset-0 bg-[#0A0A0A] border border-[#1E1E1E] rounded-[20px] overflow-hidden">
              {/* SVG connection lines */}
              <svg className="absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg">
                <ConnectionLine x1={50} y1={50} x2={25} y2={20} delay={0.8} />
                <ConnectionLine x1={50} y1={50} x2={75} y2={20} delay={0.9} />
                <ConnectionLine x1={50} y1={50} x2={15} y2={70} delay={1.0} />
                <ConnectionLine x1={50} y1={50} x2={85} y2={70} delay={1.1} />
                <ConnectionLine x1={50} y1={50} x2={50} y2={88} delay={1.2} />
              </svg>

              {/* Center node — WithMe */}
              <motion.div
                initial={{ opacity: 0, scale: 0 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
              >
                <div className="w-16 h-16 rounded-full bg-[#FFAA2B] border-4 border-[#000] flex items-center justify-center shadow-[0_0_32px_rgba(255,170,43,0.4)]">
                  <span className="text-black font-black text-base">W</span>
                </div>
                <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 whitespace-nowrap text-[11px] font-bold text-[#FFAA2B]">
                  WithMe
                </div>
              </motion.div>

              {/* Outer nodes */}
              <ConnectionNode x={25} y={18} label="Study" delay={0.8} />
              <ConnectionNode x={75} y={18} label="Gaming" delay={0.9} />
              <ConnectionNode x={12} y={70} label="Reading" delay={1.0} size="sm" color="#444" />
              <ConnectionNode x={88} y={70} label="Projects" delay={1.1} size="sm" color="#444" />
              <ConnectionNode x={50} y={88} label="Music" delay={1.2} size="sm" color="#333" />
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── Features ───────────────────────────────────── */}
      <section className="py-24 border-b border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Built for real connections</h2>
            <p className="text-[#8A8A8A] text-sm max-w-md mx-auto">
              Everything you need to find, connect, and collaborate with the right people.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.1 }}
                className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-[14px] p-6 hover:border-[#292929] transition-colors"
              >
                <div className="w-10 h-10 rounded-[10px] bg-[#141414] border border-[#2A2A2A] flex items-center justify-center mb-4">
                  {f.icon}
                </div>
                <h3 className="font-semibold text-white text-sm mb-2">{f.title}</h3>
                <p className="text-xs text-[#8A8A8A] leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Categories ─────────────────────────────────── */}
      <section className="py-24 border-b border-[#1A1A1A]">
        <div className="max-w-5xl mx-auto px-4 sm:px-6">
          <div className="text-center mb-14">
            <h2 className="text-3xl font-bold text-white mb-3">Find your community</h2>
            <p className="text-[#8A8A8A] text-sm">Thousands of people across every interest area</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
            {[
              { label: 'Study & SAT/IELTS', count: '450+ peers', emoji: '📚' },
              { label: 'Coding & Tech',     count: '620+ devs',   emoji: '💻' },
              { label: 'Startups & MVPs',   count: '280+ builders', emoji: '🚀' },
              { label: 'Gaming & Co-op',    count: '510+ gamers',  emoji: '🎮' },
              { label: 'Language Exchange', count: '390+ speakers', emoji: '🌎' },
              { label: 'Design & Creative', count: '210+ designers', emoji: '🎨' },
            ].map((cat, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="group bg-[#0F0F0F] border border-[#1E1E1E] rounded-[12px] p-5 hover:border-[#292929] hover:bg-[#141414] transition-all cursor-pointer"
                onClick={() => navigate('/discover')}
              >
                <div className="text-2xl mb-3">{cat.emoji}</div>
                <h4 className="text-sm font-semibold text-white mb-1">{cat.label}</h4>
                <p className="text-[11px] text-[#555]">{cat.count}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── FAQ ────────────────────────────────────────── */}
      <section className="py-24 border-b border-[#1A1A1A]">
        <div className="max-w-2xl mx-auto px-4 sm:px-6">
          <h2 className="text-3xl font-bold text-white mb-10 text-center">Common questions</h2>
          <div className="space-y-2">
            {faqs.map((faq, i) => (
              <div
                key={i}
                className="bg-[#0F0F0F] border border-[#1E1E1E] rounded-[12px] overflow-hidden"
              >
                <button
                  type="button"
                  className="w-full flex items-center justify-between px-5 py-4 text-left cursor-pointer hover:bg-[#141414] transition-colors"
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                >
                  <span className="text-sm font-medium text-white">{faq.q}</span>
                  <span className={`text-[#555] text-lg transition-transform ${openFaq === i ? 'rotate-45' : ''}`}>+</span>
                </button>
                {openFaq === i && (
                  <div className="px-5 pb-4">
                    <p className="text-sm text-[#8A8A8A] leading-relaxed">{faq.a}</p>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ────────────────────────────────────────── */}
      <section className="py-24">
        <div className="max-w-2xl mx-auto px-4 sm:px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            className="space-y-6"
          >
            <h2 className="text-4xl font-black text-white leading-tight">
              Ready to find<br />
              your people?
            </h2>
            <p className="text-[#8A8A8A] text-sm">
              Join 50,000+ members already connecting on WithMe.
            </p>
            <Link to="/register">
              <Button variant="primary" size="lg" className="font-bold gap-2 mx-auto">
                Get Started Free
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>
    </div>
  );
};
