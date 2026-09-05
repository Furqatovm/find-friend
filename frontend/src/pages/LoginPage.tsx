import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, Lock, Mail } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<{
    login_id: string;
    password: string;
  }>();

  const onSubmit = async (data: { login_id: string; password: string }) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await login({
        email_or_username: data.login_id,
        password: data.password
      });
      notify.success('Welcome back!', 'You have successfully signed in.');
      navigate('/dashboard');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Invalid username/email or password';
      setErrorMsg(msg);
      notify.error('Sign In Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  // Demo auto-fill helper
  const handleDemoLogin = (username: string) => {
    login({ email_or_username: username, password: 'password123' })
      .then(() => {
        notify.success('Demo Login', `Signed in as @${username}`);
        navigate('/dashboard');
      })
      .catch(() => {
        setErrorMsg('Demo login failed');
        notify.error('Login Failed', 'Demo login failed');
      });
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2.5 mb-2 group">
            <img
              src="/logo.svg"
              alt="WithMe Logo"
              className="w-9 h-9 rounded-xl shadow-md group-hover:scale-105 transition-transform shrink-0"
            />
            <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
              WithMe
            </span>
          </Link>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">WELCOME BACK</h2>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">
            Sign in to continue connecting with your people
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email or Username"
            placeholder="alex@withme.app or alex_chen"
            icon={<Mail className="w-4 h-4" />}
            {...register('login_id', { required: 'Email or Username is required' })}
            error={errors.login_id?.message}
          />

          <Input
            label="Password"
            type="password"
            placeholder="••••••••"
            icon={<Lock className="w-4 h-4" />}
            {...register('password', { required: 'Password is required' })}
            error={errors.password?.message}
          />

          <Button type="submit" loading={loading} className="w-full py-2.5 font-bold mt-2">
            Sign In
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Google Sign In */}
        <div className="space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-200 dark:border-[#242424] w-full" />
            <span className="bg-white dark:bg-[#0F0F0F] px-3 text-[11px] text-neutral-500 dark:text-[#5C5C5C] font-bold shrink-0 uppercase tracking-wider">
              Or continue with
            </span>
          </div>
          <GoogleAuthButton label="Sign in with Google" onError={(msg) => setErrorMsg(msg)} />
        </div>

        {/* Demo Quick Logins */}
        <div className="pt-4 border-t border-neutral-200 dark:border-[#242424] space-y-2 text-center">
          <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] font-medium">Quick Demo Profiles</p>
          <div className="flex flex-wrap gap-2 justify-center">
            <button
              type="button"
              onClick={() => handleDemoLogin('alex_chen')}
              className="text-xs px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#141414] dark:hover:bg-[#1C1C1C] border border-neutral-200 dark:border-[#242424] text-neutral-700 dark:text-[#D4D4D4] transition-colors cursor-pointer"
            >
              Alex (Developer)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('sarah_kim')}
              className="text-xs px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#141414] dark:hover:bg-[#1C1C1C] border border-neutral-200 dark:border-[#242424] text-neutral-700 dark:text-[#D4D4D4] transition-colors cursor-pointer"
            >
              Sarah (SAT Prep)
            </button>
            <button
              type="button"
              onClick={() => handleDemoLogin('elena_rostova')}
              className="text-xs px-3 py-1.5 rounded-xl bg-neutral-100 hover:bg-neutral-200 dark:bg-[#141414] dark:hover:bg-[#1C1C1C] border border-neutral-200 dark:border-[#242424] text-neutral-700 dark:text-[#D4D4D4] transition-colors cursor-pointer"
            >
              Elena (IELTS)
            </button>
          </div>
        </div>

        <div className="text-center text-xs text-neutral-500 dark:text-[#8A8A8A]">
          Don't have an account yet?{' '}
          <Link to="/register" className="text-neutral-900 dark:text-white hover:underline font-bold">
            Sign up
          </Link>
        </div>
      </div>
    </div>
  );
};
