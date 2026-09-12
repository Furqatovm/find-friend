import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Eye, EyeOff } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import logoImg from '@/assets/logo.png';

const schema = z.object({
  email_or_username: z.string().min(1, 'Email or username is required'),
  password: z.string().min(1, 'Password is required'),
});

type FormData = z.infer<typeof schema>;

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [showPass, setShowPass] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const { register, handleSubmit, formState: { errors } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await login(data);
      notify.success('Welcome back!', 'You have been successfully signed in.');
      navigate('/dashboard');
    } catch (err: any) {
      notify.error('Login Failed', err.response?.data?.error || 'Invalid credentials');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000000] flex flex-col items-center justify-center px-4 py-12">
      {/* Logo */}
      <Link to="/" className="flex items-center gap-2.5 mb-10">
        <img
          src={logoImg}
          alt="WithMe Logo"
          className="w-9 h-9 rounded-[8px] object-contain"
        />
        <span className="text-white font-bold text-lg">WithMe</span>
      </Link>

      {/* Card */}
      <div className="w-full max-w-[400px] bg-[#0F0F0F] border border-[#1E1E1E] rounded-[18px] p-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-white">Sign in</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">Welcome back to WithMe</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Email or Username"
            placeholder="you@example.com"
            error={errors.email_or_username?.message}
            {...register('email_or_username')}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="••••••••"
              error={errors.password?.message}
              {...register('password')}
            />
            <button
              type="button"
              onClick={() => setShowPass(!showPass)}
              className="absolute right-3 top-8 text-[#555] hover:text-white transition-colors cursor-pointer"
            >
              {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>

          <Button
            type="submit"
            variant="primary"
            size="md"
            loading={submitting}
            className="w-full mt-2 font-bold"
          >
            Sign In
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#1A1A1A] text-center">
          <p className="text-xs text-[#8A8A8A]">
            Don't have an account?{' '}
            <Link to="/register" className="text-[#FFAA2B] hover:text-[#FFB83D] font-semibold transition-colors">
              Create one
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
