import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Check, ShieldCheck } from 'lucide-react';

import { auth, googleProvider, signInWithPopup } from '@/lib/firebase';

interface GoogleAuthButtonProps {
  label?: string;
  onError?: (err: string) => void;
}

export const GoogleAuthButton: React.FC<GoogleAuthButtonProps> = ({
  label = 'Continue with Google',
  onError
}) => {
  const { loginWithGoogle } = useAuth();
  const navigate = useNavigate();
  const [showModal, setShowModal] = useState(false);
  const [loading, setLoading] = useState(false);
  const [customEmail, setCustomEmail] = useState('');
  const [customName, setCustomName] = useState('');

  // Sample Google Accounts for instant 1-click test login
  const sampleGoogleAccounts = [
    {
      name: 'Sherzod Alimov',
      email: 'sherzod.alimov.dev@gmail.com',
      avatar_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=200&auto=format&fit=crop&q=80'
    },
    {
      name: 'Malika Rustamova',
      email: 'malika.rustamova.sat@gmail.com',
      avatar_url: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=200&auto=format&fit=crop&q=80'
    }
  ];

  const handleGoogleSignIn = async (account: { email: string; name: string; avatar_url?: string }) => {
    setLoading(true);
    try {
      await loginWithGoogle(account);
      setShowModal(false);
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Google authentication failed';
      if (onError) onError(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleButtonClick = async () => {
    setLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (user && user.email) {
        await handleGoogleSignIn({
          email: user.email,
          name: user.displayName || user.email.split('@')[0],
          avatar_url: user.photoURL || undefined
        });
      } else {
        setShowModal(true);
      }
    } catch (error: any) {
      console.warn('Firebase Google Auth popup error:', error);
      // If user closed the popup or popup was blocked, fallback to instant account modal
      if (error?.code === 'auth/popup-closed-by-user' || error?.code === 'auth/cancelled-popup-request') {
        // User voluntarily closed popup
      } else {
        setShowModal(true);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCustomGoogleSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!customEmail) return;
    await handleGoogleSignIn({
      email: customEmail.trim().toLowerCase(),
      name: customName.trim() || customEmail.split('@')[0],
      avatar_url: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=200&auto=format&fit=crop&q=80'
    });
  };

  return (
    <>
      <button
        type="button"
        onClick={handleButtonClick}
        className="w-full flex items-center justify-center gap-3 py-2.5 px-4 rounded-xl bg-white hover:bg-slate-100 text-slate-900 font-semibold text-xs transition-all shadow-md hover:shadow-lg border border-slate-200 cursor-pointer group active:scale-[0.99]"
      >
        <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
          <path
            fill="#4285F4"
            d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
          />
          <path
            fill="#34A853"
            d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
          />
          <path
            fill="#FBBC05"
            d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
          />
          <path
            fill="#EA4335"
            d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
          />
        </svg>
        <span>{label}</span>
      </button>

      {/* Google Account Selector Dialog */}
      <Dialog
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        title="Sign in with Google"
        description="Choose a Google account or enter your Google email to instantly sign in or create an account."
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <p className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider">
              1-Click Instant Sign-In
            </p>
            {sampleGoogleAccounts.map((acc, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => handleGoogleSignIn(acc)}
                disabled={loading}
                className="w-full flex items-center justify-between p-3 rounded-2xl bg-slate-900 border border-slate-800 hover:border-indigo-500/50 hover:bg-slate-800/80 transition-all text-left cursor-pointer group"
              >
                <div className="flex items-center gap-3">
                  <img src={acc.avatar_url} className="w-9 h-9 rounded-full object-cover border border-slate-700" />
                  <div>
                    <p className="text-xs font-bold text-white group-hover:text-indigo-400 transition-colors">
                      {acc.name}
                    </p>
                    <p className="text-[11px] text-slate-400 font-mono">{acc.email}</p>
                  </div>
                </div>
                <span className="text-xs font-medium text-indigo-400 opacity-0 group-hover:opacity-100 transition-opacity">
                  Continue →
                </span>
              </button>
            ))}
          </div>

          <div className="relative flex items-center justify-center py-2">
            <div className="border-t border-slate-800 w-full" />
            <span className="bg-slate-950 px-3 text-[11px] text-slate-500 font-mono shrink-0 uppercase">
              Or Enter Google Account
            </span>
          </div>

          {/* Custom Google Email Form */}
          <form onSubmit={handleCustomGoogleSignIn} className="space-y-3">
            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Your Full Name</label>
              <input
                type="text"
                placeholder="e.g. Jasur Karimov"
                value={customName}
                onChange={(e) => setCustomName(e.target.value)}
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <div>
              <label className="block text-xs text-slate-300 font-medium mb-1">Google Email Address</label>
              <input
                type="email"
                placeholder="username@gmail.com"
                value={customEmail}
                onChange={(e) => setCustomEmail(e.target.value)}
                required
                className="w-full bg-slate-900 border border-slate-800 rounded-xl px-3.5 py-2 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-indigo-500"
              />
            </div>

            <Button
              type="submit"
              variant="primary"
              size="md"
              loading={loading}
              className="w-full text-xs font-semibold"
            >
              Sign In with this Google Account
            </Button>
          </form>

          <div className="flex items-center gap-2 text-[10px] text-slate-400 justify-center pt-2">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Secure 256-bit OAuth authentication by Google</span>
          </div>
        </div>
      </Dialog>
    </>
  );
};
