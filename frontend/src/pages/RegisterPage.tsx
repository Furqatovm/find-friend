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
  display_name: z.string().min(2, 'Name must be at least 2 characters'),
  username: z.string().min(3, 'Username must be at least 3 characters').regex(/^[a-zA-Z0-9_]+$/, 'Only letters, numbers, underscores'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  city: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [showPass, setShowPass] = React.useState(false);
  const [submitting, setSubmitting] = React.useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    setSubmitting(true);
    try {
      await registerUser(data);
      notify.success('Account Created!', 'Welcome to WithMe.');
      navigate('/onboarding');
    } catch (err: any) {
      let errorMsg = 'Something went wrong.';
      if (err.response?.data) {
        const d = err.response.data;
        if (typeof d === 'string') {
          if (d.includes('FUNCTION_INVOCATION_FAILED')) {
            errorMsg = 'Serverless backend initialization failed on Vercel. Please verify backend deployment and environment variables.';
          } else {
            errorMsg = d.slice(0, 200);
          }
        } else if (typeof d.error === 'string') {
          errorMsg = d.error;
        } else if (typeof d.error === 'object' && d.error?.message) {
          errorMsg = String(d.error.message);
        } else if (typeof d.message === 'string') {
          errorMsg = d.message;
        }
      } else if (err.message) {
        errorMsg = String(err.message);
      }
      notify.error('Registration Failed', errorMsg);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000] flex flex-col items-center justify-center px-4 py-12">
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
      <div className="w-full max-w-[420px] bg-[#0F0F0F] border border-[#1E1E1E] rounded-[18px] p-8">
        <div className="mb-7">
          <h1 className="text-xl font-bold text-white">Create account</h1>
          <p className="text-xs text-[#8A8A8A] mt-1">Find your people on WithMe</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Full Name"
            placeholder="Alex Johnson"
            error={errors.display_name?.message}
            {...register('display_name')}
          />

          <Input
            label="Username"
            placeholder="alexj"
            error={errors.username?.message}
            {...register('username')}
          />

          <Input
            label="Email"
            type="email"
            placeholder="you@example.com"
            error={errors.email?.message}
            {...register('email')}
          />

          <Input
            label="City (optional)"
            placeholder="Tashkent"
            error={errors.city?.message}
            {...register('city')}
          />

          <div className="relative">
            <Input
              label="Password"
              type={showPass ? 'text' : 'password'}
              placeholder="At least 6 characters"
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
            Create Account
          </Button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#1A1A1A] text-center">
          <p className="text-xs text-[#8A8A8A]">
            Already have an account?{' '}
            <Link to="/login" className="text-[#FFAA2B] hover:text-[#FFB83D] font-semibold transition-colors">
              Sign in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
