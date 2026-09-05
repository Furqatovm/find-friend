import React, { useState, useEffect } from 'react';
import { Shield, User, Save, Check, Sparkles } from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Card } from '@/components/ui/Card';
import { EditProfileModal } from '@/components/profile/EditProfileModal';

export const SettingsPage: React.FC = () => {
  const { user, refreshUser } = useAuth();
  const { notify } = useNotification();
  const [showEditTaxonomiesModal, setShowEditTaxonomiesModal] = useState(false);

  // Profile Form state
  const [displayName, setDisplayName] = useState(user?.profile?.display_name || '');
  const [headline, setHeadline] = useState(user?.profile?.headline || '');
  const [bio, setBio] = useState(user?.profile?.bio || '');
  const [city, setCity] = useState(user?.profile?.city || '');
  const [telegram, setTelegram] = useState(user?.profile?.telegram || '');
  const [discord, setDiscord] = useState(user?.profile?.discord || '');
  const [github, setGithub] = useState(user?.profile?.github || '');

  // Privacy Form state
  const [locationEnabled] = useState(user?.location_pref?.location_enabled ?? true);
  const [discoveryRadius] = useState(user?.location_pref?.discovery_radius_km || 25);
  const [showOnNearby, setShowOnNearby] = useState(user?.location_pref?.show_on_nearby ?? true);
  const [showDistance, setShowDistance] = useState(user?.location_pref?.show_distance ?? true);
  const [showCity] = useState(user?.location_pref?.show_city ?? true);

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPrivacy, setSavingPrivacy] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  useEffect(() => {
    const fetchBlocks = async () => {
      try {
        const res = await api.get('/blocks');
        setBlockedUsers(res.data);
      } catch (e) {
        // ignore
      }
    };
    fetchBlocks();
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingProfile(true);
    setStatusMessage('');
    try {
      await api.put('/users/me', {
        display_name: displayName,
        headline,
        bio,
        city,
        telegram,
        discord,
        github
      });
      await refreshUser();
      notify.success('Profile Saved', 'Profile settings updated successfully.');
      setStatusMessage('Profile updated successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to update profile', err);
      notify.error('Update Failed', err.response?.data?.error || 'Failed to update profile');
    } finally {
      setSavingProfile(false);
    }
  };

  const handleSavePrivacy = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingPrivacy(true);
    setStatusMessage('');
    try {
      await api.put('/settings/privacy', {
        location_enabled: locationEnabled,
        discovery_radius_km: discoveryRadius,
        show_on_nearby: showOnNearby,
        show_distance: showDistance,
        show_city: showCity
      });
      await refreshUser();
      notify.success('Privacy Saved', 'Privacy preferences updated successfully.');
      setStatusMessage('Privacy settings updated successfully!');
      setTimeout(() => setStatusMessage(''), 3000);
    } catch (err: any) {
      console.error('Failed to update privacy', err);
      notify.error('Update Failed', err.response?.data?.error || 'Failed to update privacy');
    } finally {
      setSavingPrivacy(false);
    }
  };

  const handleUnblock = async (blockedId: string) => {
    try {
      await api.delete(`/blocks/${blockedId}`);
      setBlockedUsers((prev) => prev.filter((b) => b.blocked_id !== blockedId));
      notify.info('User Unblocked', 'User has been unblocked.');
    } catch (e: any) {
      console.error('Failed to unblock', e);
      notify.error('Action Failed', e.response?.data?.error || 'Failed to unblock user');
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      <div>
        <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">SETTINGS & PRIVACY</h1>
        <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
          Manage your public profile, location discovery permissions, and safety controls.
        </p>
      </div>

      {statusMessage && (
        <div className="p-3.5 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl text-xs text-neutral-900 dark:text-white font-bold flex items-center gap-2 animate-in fade-in shadow-xs">
          <Check className="w-4 h-4 text-amber-500 dark:text-amber-400" />
          {statusMessage}
        </div>
      )}

      {/* Profile Edit Form */}
      <Card>
        <div className="flex items-center justify-between gap-2 mb-4 pb-3 border-b border-neutral-200 dark:border-[#242424]">
          <div className="flex items-center gap-2">
            <User className="w-4 h-4 text-neutral-900 dark:text-white" />
            <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Public Profile Information</h2>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => setShowEditTaxonomiesModal(true)}
            className="text-xs font-bold"
          >
            <Sparkles className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400 mr-1" />
            Edit Interests, Goals & Skills
          </Button>
        </div>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Display Name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
            />
            <Input
              label="Headline"
              value={headline}
              placeholder="e.g. Frontend Dev · React 19"
              onChange={(e) => setHeadline(e.target.value)}
            />
          </div>

          <Textarea
            label="Bio"
            value={bio}
            placeholder="Tell peers what you love to do..."
            rows={3}
            onChange={(e) => setBio(e.target.value)}
          />

          <Input
            label="City"
            value={city}
            placeholder="e.g. Tashkent"
            onChange={(e) => setCity(e.target.value)}
          />

          <div className="pt-2">
            <p className="text-xs font-bold text-neutral-700 dark:text-[#D4D4D4] mb-2">Social & Direct Contacts (Shared voluntarily)</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <Input
                label="Telegram"
                placeholder="@username"
                value={telegram}
                onChange={(e) => setTelegram(e.target.value)}
              />
              <Input
                label="Discord"
                placeholder="user#1234"
                value={discord}
                onChange={(e) => setDiscord(e.target.value)}
              />
              <Input
                label="GitHub"
                placeholder="github_username"
                value={github}
                onChange={(e) => setGithub(e.target.value)}
              />
            </div>
          </div>

          <div className="flex justify-end pt-3 border-t border-neutral-200 dark:border-[#242424]">
            <Button type="submit" variant="primary" size="md" loading={savingProfile} className="font-bold">
              <Save className="w-4 h-4 mr-1" />
              Save Profile
            </Button>
          </div>
        </form>
      </Card>

      {/* Privacy Settings */}
      <Card>
        <div className="flex items-center gap-2 mb-4 pb-3 border-b border-neutral-200 dark:border-[#242424]">
          <Shield className="w-4 h-4 text-neutral-900 dark:text-white" />
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white">Location & Discovery Privacy</h2>
        </div>

        <form onSubmit={handleSavePrivacy} className="space-y-4">
          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">Show on Nearby Discovery Map</p>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">Allow peers nearby to discover you using privacy-fuzzed markers.</p>
            </div>
            <input
              type="checkbox"
              checked={showOnNearby}
              onChange={(e) => setShowOnNearby(e.target.checked)}
              className="w-4 h-4 rounded text-neutral-900 dark:text-white bg-white dark:bg-[#1A1A1A] border-neutral-300 dark:border-[#292929] cursor-pointer"
            />
          </div>

          <div className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">Show Approximate Distance</p>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">Display distance buckets (e.g., '~3 km') rather than hiding location.</p>
            </div>
            <input
              type="checkbox"
              checked={showDistance}
              onChange={(e) => setShowDistance(e.target.checked)}
              className="w-4 h-4 rounded text-neutral-900 dark:text-white bg-white dark:bg-[#1A1A1A] border-neutral-300 dark:border-[#292929] cursor-pointer"
            />
          </div>

          <div className="flex justify-end pt-3 border-t border-neutral-200 dark:border-[#242424]">
            <Button type="submit" variant="primary" size="md" loading={savingPrivacy} className="font-bold">
              <Save className="w-4 h-4 mr-1" />
              Save Privacy Settings
            </Button>
          </div>
        </form>
      </Card>

      {/* Blocked Users */}
      {blockedUsers.length > 0 && (
        <Card>
          <h2 className="text-sm font-bold text-neutral-900 dark:text-white mb-3">Blocked Users ({blockedUsers.length})</h2>
          <div className="space-y-2">
            {blockedUsers.map((b) => (
              <div key={b.blocked_id} className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
                <span className="text-xs text-neutral-900 dark:text-white font-mono">@{b.blocked_username || b.blocked_id}</span>
                <Button variant="outline" size="sm" onClick={() => handleUnblock(b.blocked_id)} className="text-xs">
                  Unblock
                </Button>
              </div>
            ))}
          </div>
        </Card>
      )}

      <EditProfileModal
        isOpen={showEditTaxonomiesModal}
        onClose={() => setShowEditTaxonomiesModal(false)}
        onSuccess={refreshUser}
      />
    </div>
  );
};
