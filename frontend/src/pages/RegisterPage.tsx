import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { ArrowRight, Lock, Mail, User, MapPin, Navigation, Check } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useNotification } from '@/context/NotificationContext';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { GoogleAuthButton } from '@/components/auth/GoogleAuthButton';

export const RegisterPage: React.FC = () => {
  const { register: registerUser } = useAuth();
  const { setLocationManually } = useLocation();
  const { notify } = useNotification();
  const navigate = useNavigate();
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{
    username: string;
    display_name: string;
    email: string;
    password: string;
    city: string;
    avatar_url: string;
  }>({
    defaultValues: {
      city: 'Tashkent'
    }
  });

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert("Geolocation is not supported by your browser");
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.state || 'Tashkent';
          setValue('city', detectedCity);
          setLocationManually(detectedCity, lat, lon);
          setGpsDetected(true);
        } catch (e) {
          setValue('city', 'Tashkent');
          setLocationManually('Tashkent', lat, lon);
          setGpsDetected(true);
        } finally {
          setDetectingGps(false);
        }
      },
      (err) => {
        console.warn('GPS location access denied', err);
        setDetectingGps(false);
      },
      { timeout: 8000 }
    );
  };

  const onSubmit = async (data: {
    username: string;
    display_name: string;
    email: string;
    password: string;
    city: string;
    avatar_url?: string;
  }) => {
    setErrorMsg('');
    setLoading(true);
    try {
      await registerUser({
        username: data.username.trim(),
        display_name: data.display_name.trim() || data.username.trim(),
        email: data.email.trim(),
        password: data.password,
        city: data.city.trim() || 'Tashkent'
      });
      notify.success('Account Created!', `Welcome to WithMe, ${data.display_name || data.username}!`);
      navigate('/onboarding');
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Registration failed. Please check your information.';
      setErrorMsg(msg);
      notify.error('Registration Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-12 text-neutral-900 dark:text-white transition-colors duration-200">
      <div className="w-full max-w-md space-y-8 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-8 shadow-2xl">
        <div className="text-center space-y-2">
          <Link to="/" className="inline-flex items-center gap-2 mb-2">
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white dark:bg-white dark:text-black flex items-center justify-center font-black text-sm">
              W
            </div>
            <span className="text-xl font-black tracking-tight text-neutral-900 dark:text-white">
              WithMe
            </span>
          </Link>
          <h2 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">CREATE AN ACCOUNT</h2>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">
            Join students, builders, and hobbyists
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium text-center">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Username"
              placeholder="johndoe"
              icon={<User className="w-4 h-4" />}
              {...register('username', { required: 'Username is required', minLength: { value: 3, message: 'At least 3 characters' } })}
              error={errors.username?.message}
            />
            <Input
              label="Display Name"
              placeholder="John Doe"
              {...register('display_name')}
            />
          </div>

          <Input
            label="Email Address"
            type="email"
            placeholder="you@example.com"
            icon={<Mail className="w-4 h-4" />}
            {...register('email', { required: 'Email is required' })}
            error={errors.email?.message}
          />

          {/* Location with Manual Input or GPS Auto-detect */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="text-xs font-bold text-neutral-700 dark:text-[#D4D4D4]">Location</label>
              <button
                type="button"
                onClick={handleDetectGps}
                disabled={detectingGps}
                className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                {detectingGps ? (
                  <span>Detecting...</span>
                ) : gpsDetected ? (
                  <>
                    <Check className="w-3 h-3 text-emerald-500" />
                    <span>GPS Detected</span>
                  </>
                ) : (
                  <>
                    <Navigation className="w-3 h-3" />
                    <span>📍 Detect GPS</span>
                  </>
                )}
              </button>
            </div>
            <Input
              placeholder="e.g. Tashkent, London, New York"
              icon={<MapPin className="w-4 h-4" />}
              {...register('city')}
              helperText="Enter manually or click Detect GPS"
            />
          </div>

          <Input
            label="Password"
            type="password"
            placeholder="At least 6 characters"
            icon={<Lock className="w-4 h-4" />}
            {...register('password', { required: 'Password is required', minLength: { value: 6, message: 'At least 6 characters' } })}
            error={errors.password?.message}
          />

          <Button type="submit" variant="primary" size="lg" loading={loading} className="w-full mt-2 font-bold">
            Create Account & Continue
            <ArrowRight className="w-4 h-4 ml-1.5" />
          </Button>
        </form>

        {/* Google Sign Up */}
        <div className="space-y-3">
          <div className="relative flex items-center justify-center">
            <div className="border-t border-neutral-200 dark:border-[#242424] w-full" />
            <span className="bg-white dark:bg-[#0F0F0F] px-3 text-[11px] text-neutral-500 dark:text-[#5C5C5C] font-bold shrink-0 uppercase tracking-wider">
              Or sign up with
            </span>
          </div>
          <GoogleAuthButton label="Sign up with Google" onError={(msg) => setErrorMsg(msg)} />
        </div>

        <p className="text-center text-xs text-neutral-500 dark:text-[#8A8A8A] pt-2">
          Already have an account?{' '}
          <Link to="/login" className="text-neutral-900 dark:text-white hover:underline font-bold">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  );
};
