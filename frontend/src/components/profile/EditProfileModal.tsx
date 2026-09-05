import React, { useState, useEffect, useRef } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import {
  Sparkles,
  Plus,
  Trash2,
  X,
  Compass,
  Target,
  Code,
  Save,
  User as UserIcon,
  Navigation,
  Check,
  Upload,
  Camera
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useNotification } from '@/context/NotificationContext';
import { getInitials } from '@/lib/utils';

interface EditProfileModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export const EditProfileModal: React.FC<EditProfileModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { user, refreshUser } = useAuth();
  const { setLocationManually } = useLocation();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [detectingGps, setDetectingGps] = useState(false);
  const [gpsDetected, setGpsDetected] = useState(false);

  // Form states
  const [displayName, setDisplayName] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [headline, setHeadline] = useState('');
  const [bio, setBio] = useState('');
  const [city, setCity] = useState('');
  const [latitude, setLatitude] = useState<number | undefined>(undefined);
  const [longitude, setLongitude] = useState<number | undefined>(undefined);
  const [activityMode, setActivityMode] = useState<'online' | 'in_person' | 'both'>('both');
  const [groupSize, setGroupSize] = useState<'1-on-1' | 'small_group' | 'large_group' | 'any'>('small_group');

  // Interactive Taxonomies
  const [interests, setInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');

  const [goals, setGoals] = useState<string[]>([]);
  const [newGoalInput, setNewGoalInput] = useState('');

  const [skills, setSkills] = useState<{ name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' }[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');

  const [availabilities, setAvailabilities] = useState<{ day_of_week: string; time_slot: string }[]>([]);

  // Contacts
  const [telegram, setTelegram] = useState('');
  const [discord, setDiscord] = useState('');
  const [github, setGithub] = useState('');

  const fileInputRef = useRef<HTMLInputElement>(null);

  const avatarPresets = [
    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=300&auto=format&fit=crop&q=80'
  ];

  useEffect(() => {
    if (user) {
      setDisplayName(user.profile?.display_name || user.username || '');
      setAvatarUrl(user.profile?.avatar_url || '');
      setHeadline(user.profile?.headline || '');
      setBio(user.profile?.bio || '');
      setCity(user.profile?.city || 'Tashkent');
      setActivityMode(user.profile?.activity_mode || 'both');
      setGroupSize(user.profile?.preferred_group_size || 'small_group');
      setTelegram(user.profile?.telegram || '');
      setDiscord(user.profile?.discord || '');
      setGithub(user.profile?.github || '');

      if (user.interests) {
        setInterests(user.interests.map((ui: any) => ui.name || ui.interest?.name || '').filter(Boolean));
      }
      if (user.goals) {
        setGoals(user.goals.map((ug: any) => ug.title || ug.goal?.title || '').filter(Boolean));
      }
      if (user.skills) {
        setSkills(
          user.skills.map((us: any) => ({
            name: us.name || us.skill?.name || '',
            level: (us.level as any) || 'Intermediate'
          })).filter((s) => Boolean(s.name))
        );
      }
      if (user.availabilities) {
        setAvailabilities(
          user.availabilities.map((a) => ({
            day_of_week: a.day_of_week,
            time_slot: a.time_slot
          }))
        );
      }
    }
  }, [user, isOpen]);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
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

  const handleDetectGps = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser');
      return;
    }
    setDetectingGps(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        const lat = pos.coords.latitude;
        const lon = pos.coords.longitude;
        setLatitude(lat);
        setLongitude(lon);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.state || 'Tashkent';
          setCity(detectedCity);
          setLocationManually(detectedCity, lat, lon);
          setGpsDetected(true);
        } catch (e) {
          setCity('Tashkent');
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

  const handleAddInterest = () => {
    const val = newInterestInput.trim();
    if (val && !interests.includes(val)) {
      setInterests([...interests, val]);
      setNewInterestInput('');
    }
  };

  const handleRemoveInterest = (name: string) => {
    setInterests(interests.filter((i) => i !== name));
  };

  const handleAddGoal = () => {
    const val = newGoalInput.trim();
    if (val && !goals.includes(val)) {
      setGoals([...goals, val]);
      setNewGoalInput('');
    }
  };

  const handleRemoveGoal = (title: string) => {
    setGoals(goals.filter((g) => g !== title));
  };

  const handleAddSkill = () => {
    const val = newSkillName.trim();
    if (val && !skills.some((s) => s.name.toLowerCase() === val.toLowerCase())) {
      setSkills([...skills, { name: val, level: newSkillLevel }]);
      setNewSkillName('');
    }
  };

  const handleRemoveSkill = (name: string) => {
    setSkills(skills.filter((s) => s.name !== name));
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);

    try {
      await api.put('/users/me', {
        display_name: displayName,
        avatar_url: avatarUrl,
        headline,
        bio,
        city,
        latitude,
        longitude,
        activity_mode: activityMode,
        preferred_group_size: groupSize,
        telegram,
        discord,
        github,
        interests,
        goals,
        skills,
        availabilities
      });

      if (city) {
        setLocationManually(city, latitude, longitude);
      }

      await refreshUser();
      notify.success('Profile Saved!', 'Your profile information has been updated.');
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update profile';
      setErrorMsg(msg);
      notify.error('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const interestSuggestions = [
    'Programming', 'Artificial Intelligence', 'SAT Prep', 'IELTS Speaking',
    'Game Development', 'UI/UX Design', 'Startups & Venture', 'Football', 'Reading'
  ];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Profile, Picture & Interests"
      description="Update your profile photo, location, goals, skills, and preferences."
    >
      <form onSubmit={handleSave} className="space-y-6 max-h-[75vh] overflow-y-auto pr-1 text-neutral-900 dark:text-white">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}

        {/* 1. Profile Picture / Avatar Section */}
        <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] space-y-3">
          <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
            Profile Picture
          </p>

          <div className="flex flex-col sm:flex-row items-center gap-4">
            {/* Avatar Preview */}
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={displayName}
                  className="w-16 h-16 rounded-full object-cover border border-neutral-300 dark:border-[#292929] shadow-md"
                />
              ) : (
                <div className="w-16 h-16 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center font-bold text-xl shadow-md">
                  {getInitials(displayName || user?.username || 'U')}
                </div>
              )}
            </div>

            <div className="flex-1 w-full space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste image URL..."
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#080808] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1A1A] hover:bg-neutral-100 dark:hover:bg-[#222222] text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-[#242424] flex items-center gap-1.5 cursor-pointer shrink-0 font-bold shadow-xs"
                >
                  <Upload className="w-3.5 h-3.5" />
                  Upload
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/*"
                  className="hidden"
                />
              </div>

              {/* Quick Preset Avatars */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                <span className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] shrink-0">Presets:</span>
                {avatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-7 h-7 rounded-full overflow-hidden border transition-transform shrink-0 ${
                      avatarUrl === preset ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : 'border-neutral-300 dark:border-[#242424] opacity-70 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* 2. Basic Info & Location */}
        <div className="space-y-3">
          <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <UserIcon className="w-3.5 h-3.5" />
            Basic Info & Location
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
            />
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-neutral-700 dark:text-[#8A8A8A]">City / Location</label>
                <button
                  type="button"
                  onClick={handleDetectGps}
                  disabled={detectingGps}
                  className="text-[11px] font-bold text-amber-600 dark:text-amber-400 hover:underline flex items-center gap-1 cursor-pointer"
                >
                  {detectingGps ? (
                    <Sparkles className="w-3 h-3 animate-spin text-amber-500" />
                  ) : gpsDetected ? (
                    <Check className="w-3 h-3 text-emerald-500" />
                  ) : (
                    <Navigation className="w-3 h-3" />
                  )}
                  {detectingGps ? 'Detecting...' : '📍 GPS Auto-detect'}
                </button>
              </div>
              <Input
                placeholder="e.g. Tashkent, Samarqand"
                value={city}
                onChange={(e) => setCity(e.target.value)}
              />
            </div>
          </div>

          <Input
            label="Headline"
            placeholder="e.g. SAT Math Prep · React Developer"
            value={headline}
            onChange={(e) => setHeadline(e.target.value)}
          />

          <Textarea
            label="Bio"
            placeholder="Tell potential study partners and teammates about yourself..."
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={2}
          />
        </div>

        {/* 3. Interests / Hobbies */}
        <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-[#242424]">
          <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Compass className="w-3.5 h-3.5" />
            Interests & Topics
          </p>

          <div className="flex flex-wrap gap-1.5 min-h-[32px] p-2 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl">
            {interests.map((it) => (
              <span
                key={it}
                className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F1F1F] border border-neutral-200 dark:border-[#2E2E2E] text-neutral-900 dark:text-white text-xs font-medium shadow-xs"
              >
                {it}
                <button
                  type="button"
                  onClick={() => handleRemoveInterest(it)}
                  className="hover:text-red-500 ml-0.5"
                >
                  <X className="w-3 h-3" />
                </button>
              </span>
            ))}
            {interests.length === 0 && (
              <span className="text-xs text-neutral-400 dark:text-[#5C5C5C]">No interests selected yet</span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="Add interest topic..."
              value={newInterestInput}
              onChange={(e) => setNewInterestInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddInterest();
                }
              }}
              className="flex-1 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddInterest}>
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>

          {/* Quick Suggestions */}
          <div className="flex flex-wrap gap-1 pt-1">
            {interestSuggestions.filter((s) => !interests.includes(s)).map((s) => (
              <button
                key={s}
                type="button"
                onClick={() => setInterests([...interests, s])}
                className="text-[11px] px-2 py-0.5 rounded-md bg-neutral-100 hover:bg-neutral-900 hover:text-white dark:bg-[#141414] dark:hover:bg-white dark:hover:text-black border border-neutral-200 dark:border-[#242424] text-neutral-600 dark:text-[#8A8A8A] font-medium transition-colors cursor-pointer"
              >
                + {s}
              </button>
            ))}
          </div>
        </div>

        {/* 4. Goals & Targets */}
        <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-[#242424]">
          <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
            <Target className="w-3.5 h-3.5" />
            Goals & Focus
          </p>

          <div className="space-y-1.5">
            {goals.map((g) => (
              <div
                key={g}
                className="flex items-center justify-between p-2 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs text-neutral-900 dark:text-white"
              >
                <span>{g}</span>
                <button
                  type="button"
                  onClick={() => handleRemoveGoal(g)}
                  className="text-neutral-500 hover:text-red-500 p-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="e.g. SAT Math 800 or Launch SaaS MVP..."
              value={newGoalInput}
              onChange={(e) => setNewGoalInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddGoal();
                }
              }}
              className="flex-1 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
            />
            <Button type="button" variant="outline" size="sm" onClick={handleAddGoal}>
              <Plus className="w-3.5 h-3.5" />
              Add
            </Button>
          </div>
        </div>

        {/* 5. Skills & Levels */}
        <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-[#242424]">
          <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
            <Code className="w-3.5 h-3.5" />
            Skills & Levels
          </p>

          <div className="flex flex-wrap gap-2">
            {skills.map((sk) => (
              <div
                key={sk.name}
                className="flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs text-neutral-900 dark:text-white"
              >
                <span>{sk.name}</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded font-bold bg-neutral-200 dark:bg-[#1F1F1F] text-neutral-700 dark:text-[#D4D4D4]">
                  {sk.level}
                </span>
                <button
                  type="button"
                  onClick={() => handleRemoveSkill(sk.name)}
                  className="text-neutral-500 hover:text-red-500 ml-1 cursor-pointer"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
            ))}
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-12 gap-2">
            <div className="sm:col-span-6">
              <input
                type="text"
                placeholder="Skill name (Python, Figma...)"
                value={newSkillName}
                onChange={(e) => setNewSkillName(e.target.value)}
                className="w-full bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
              />
            </div>
            <div className="sm:col-span-4">
              <Select
                value={newSkillLevel}
                onValueChange={(val: any) => setNewSkillLevel(val)}
              >
                <SelectTrigger className="h-9 bg-white dark:bg-[#141414] border-neutral-200 dark:border-[#242424] text-xs">
                  <SelectValue placeholder="Level" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Beginner">Beginner</SelectItem>
                  <SelectItem value="Intermediate">Intermediate</SelectItem>
                  <SelectItem value="Advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="sm:col-span-2">
              <Button type="button" variant="outline" size="sm" onClick={handleAddSkill} className="w-full">
                <Plus className="w-3.5 h-3.5" />
              </Button>
            </div>
          </div>
        </div>

        {/* 6. Format & Group Size */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2 border-t border-neutral-200 dark:border-[#242424]">
          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-[#8A8A8A] mb-1.5">Collaboration Format</label>
            <Select
              value={activityMode}
              onValueChange={(val: any) => setActivityMode(val)}
            >
              <SelectTrigger className="h-9 bg-white dark:bg-[#141414] border-neutral-200 dark:border-[#242424] text-xs">
                <SelectValue placeholder="Select format" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="both">⚡ Both (Online & In-Person)</SelectItem>
                <SelectItem value="online">🌐 Online</SelectItem>
                <SelectItem value="in_person">📍 In-Person</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-700 dark:text-[#8A8A8A] mb-1.5">Team Size Preference</label>
            <Select
              value={groupSize}
              onValueChange={(val: any) => setGroupSize(val)}
            >
              <SelectTrigger className="h-9 bg-white dark:bg-[#141414] border-neutral-200 dark:border-[#242424] text-xs">
                <SelectValue placeholder="Select size" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1-on-1">1-on-1 (Direct partner)</SelectItem>
                <SelectItem value="small_group">Small Group (3-5 peers)</SelectItem>
                <SelectItem value="large_group">Large Group</SelectItem>
                <SelectItem value="any">Any Group Size</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* 7. Social Contacts */}
        <div className="space-y-2 pt-2 border-t border-neutral-200 dark:border-[#242424]">
          <p className="text-xs font-bold text-neutral-800 dark:text-[#D4D4D4] uppercase tracking-wider">
            Direct Contacts (Shared voluntarily)
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <Input
              placeholder="Telegram @user"
              value={telegram}
              onChange={(e) => setTelegram(e.target.value)}
            />
            <Input
              placeholder="Discord user#1234"
              value={discord}
              onChange={(e) => setDiscord(e.target.value)}
            />
            <Input
              placeholder="GitHub username"
              value={github}
              onChange={(e) => setGithub(e.target.value)}
            />
          </div>
        </div>

        {/* Submit */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-[#242424]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading} className="font-bold text-xs">
            <Save className="w-4 h-4 mr-1" />
            Save Profile
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
