import React, { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import {
  UserPlus,
  MessageSquare,
  MapPin,
  Clock,
  Sparkles,
  Shield,
  Share2,
  Check,
  Edit3,
  Eye,
  Flame,
  Trophy,
  Target,
  Compass,
  Code,
  Save,
  Plus,
  Trash2,
  X,
  Upload,
  Activity,
  Award
} from 'lucide-react';
import { useAuth } from '@/context/AuthContext';
import { useLocation } from '@/context/LocationContext';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { SkillBadge } from '@/components/common/SkillBadge';
import { ContactShareModal } from '@/components/common/ContactShareModal';
import { ReportModal } from '@/components/common/ReportModal';
import { FollowersModal } from '@/components/profile/FollowersModal';
import { getInitials } from '@/lib/utils';

export const UserProfilePage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const { user: currentUser, refreshUser } = useAuth();
  const { setLocationManually } = useLocation();
  const { notify } = useNotification();
  const navigate = useNavigate();

  const isOwnProfile = !id || (currentUser && id === currentUser.id);
  const targetId = isOwnProfile ? currentUser?.id : id;

  const [profileData, setProfileData] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [connStatus, setConnStatus] = useState<string>('none');
  const [connectLoading, setConnectLoading] = useState(false);

  // Instagram-style Followers & Following
  const [showFollowersModal, setShowFollowersModal] = useState(false);
  const [followersModalTab, setFollowersModalTab] = useState<'followers' | 'following'>('followers');
  const [isFollowing, setIsFollowing] = useState(false);
  const [followersCount, setFollowersCount] = useState(0);
  const [followingCount, setFollowingCount] = useState(0);
  const [postsCount, setPostsCount] = useState(0);
  const [followLoading, setFollowLoading] = useState(false);
  const [chatDirectLoading, setChatDirectLoading] = useState(false);

  // In-Place Inline Profile Editing
  const [isEditingInline, setIsEditingInline] = useState(false);
  const [savingInline, setSavingInline] = useState(false);
  const [saveSuccessMsg, setSaveSuccessMsg] = useState('');

  // Form states for inline editing
  const [editName, setEditName] = useState('');
  const [editAvatarUrl, setEditAvatarUrl] = useState('');
  const [editHeadline, setEditHeadline] = useState('');
  const [editBio, setEditBio] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLat, setEditLat] = useState<number | undefined>(undefined);
  const [editLon, setEditLon] = useState<number | undefined>(undefined);
  const [editStatus, setEditStatus] = useState('online');
  const [editStatusMsg, setEditStatusMsg] = useState('');
  const [editActivityMode, setEditActivityMode] = useState('both');
  const [editGroupSize, setEditGroupSize] = useState('small_group');
  const [editTelegram, setEditTelegram] = useState('');
  const [editDiscord, setEditDiscord] = useState('');
  const [editGithub, setEditGithub] = useState('');

  const [editInterests, setEditInterests] = useState<string[]>([]);
  const [newInterestInput, setNewInterestInput] = useState('');

  const [editGoals, setEditGoals] = useState<string[]>([]);
  const [newGoalInput, setNewGoalInput] = useState('');

  const [editSkills, setEditSkills] = useState<{ name: string; level: 'Beginner' | 'Intermediate' | 'Advanced' }[]>([]);
  const [newSkillName, setNewSkillName] = useState('');
  const [newSkillLevel, setNewSkillLevel] = useState<'Beginner' | 'Intermediate' | 'Advanced'>('Intermediate');

  const [detectingGps, setDetectingGps] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Modals for other users
  const [showContactModal, setShowContactModal] = useState(false);
  const [showReportModal, setShowReportModal] = useState(false);

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

  const fetchProfile = async () => {
    if (!targetId) return;
    setLoading(true);
    try {
      if (isOwnProfile) {
        const res = await api.get('/users/me');
        setProfileData(res.data);
        setFollowersCount(res.data.followers_count || 0);
        setFollowingCount(res.data.following_count || 0);
        setPostsCount(res.data.posts_count || 0);
        populateEditForm(res.data);
      } else {
        const res = await api.get(`/users/${targetId}`);
        setProfileData(res.data);
        setFollowersCount(res.data.followers_count || 0);
        setFollowingCount(res.data.following_count || 0);
        setPostsCount(res.data.posts_count || 0);
        setIsFollowing(res.data.is_following || false);
        setConnStatus(res.data.connection?.status || 'none');
      }
    } catch (err) {
      console.error('Failed to load profile', err);
    } finally {
      setLoading(false);
    }
  };

  const populateEditForm = (data: any) => {
    if (!data) return;
    const p = data.profile || {};
    setEditName(p.display_name || data.username || '');
    setEditAvatarUrl(p.avatar_url || '');
    setEditHeadline(p.headline || '');
    setEditBio(p.bio || '');
    setEditCity(p.city || 'Tashkent');
    setEditLat(p.latitude);
    setEditLon(p.longitude);
    setEditStatus(p.status || 'online');
    setEditStatusMsg(p.status_message || '');
    setEditActivityMode(p.activity_mode || 'both');
    setEditGroupSize(p.preferred_group_size || 'small_group');
    setEditTelegram(p.telegram || '');
    setEditDiscord(p.discord || '');
    setEditGithub(p.github || '');

    if (data.interests) {
      setEditInterests(data.interests.map((ui: any) => ui.name || ui.interest?.name || '').filter(Boolean));
    }
    if (data.goals) {
      setEditGoals(data.goals.map((ug: any) => ug.title || ug.goal?.title || '').filter(Boolean));
    }
    if (data.skills) {
      setEditSkills(
        data.skills.map((us: any) => ({
          name: us.name || us.skill?.name || '',
          level: (us.level as any) || 'Intermediate'
        })).filter((s: any) => Boolean(s.name))
      );
    }
  };

  const handleToggleFollow = async () => {
    if (!targetId || isOwnProfile) return;

    // 1. Optimistic instant UI update
    const prevFollowing = isFollowing;
    const prevCount = followersCount;
    setIsFollowing(!prevFollowing);
    setFollowersCount(prevFollowing ? Math.max(0, prevCount - 1) : prevCount + 1);

    // 2. Background backend persistence
    try {
      const res = await api.post(`/users/${targetId}/follow`);
      setIsFollowing(res.data.is_following);
      setFollowersCount(res.data.followers_count);
      const targetName = profileData?.profile?.display_name || profileData?.username || 'user';
      if (res.data.is_following) {
        notify.success('Following', `You are now following ${targetName}.`);
      } else {
        notify.info('Unfollowed', `You unfollowed ${targetName}.`);
      }
    } catch (err) {
      console.error('Failed to toggle follow', err);
      // Rollback on error
      setIsFollowing(prevFollowing);
      setFollowersCount(prevCount);
    }
  };

  useEffect(() => {
    fetchProfile();
  }, [targetId, isOwnProfile]);

  const handleQuickStatusChange = async (newStatus: string) => {
    setEditStatus(newStatus);
    try {
      await api.put('/users/me/status', { status: newStatus });
      setProfileData((prev: any) => ({
        ...prev,
        profile: { ...prev?.profile, status: newStatus }
      }));
      notify.info('Status Updated', `Your status is now ${newStatus}.`);
      await refreshUser();
    } catch (e) {
      console.error('Failed to update quick status', e);
    }
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
        setEditLat(lat);
        setEditLon(lon);
        try {
          const res = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lon}`);
          const data = await res.json();
          const detectedCity = data.address?.city || data.address?.town || data.address?.state || 'Tashkent';
          setEditCity(detectedCity);
          setLocationManually(detectedCity, lat, lon);
        } catch (e) {
          setEditCity('Tashkent');
          setLocationManually('Tashkent', lat, lon);
        } finally {
          setDetectingGps(false);
        }
      },
      () => setDetectingGps(false),
      { timeout: 8000 }
    );
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setEditAvatarUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleSaveInline = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingInline(true);
    setSaveSuccessMsg('');
    try {
      await api.put('/users/me', {
        display_name: editName,
        avatar_url: editAvatarUrl,
        headline: editHeadline,
        bio: editBio,
        city: editCity,
        latitude: editLat,
        longitude: editLon,
        status: editStatus,
        status_message: editStatusMsg,
        activity_mode: editActivityMode,
        preferred_group_size: editGroupSize,
        telegram: editTelegram,
        discord: editDiscord,
        github: editGithub,
        interests: editInterests,
        goals: editGoals,
        skills: editSkills
      });

      if (editCity) {
        setLocationManually(editCity, editLat, editLon);
      }

      await refreshUser();
      await fetchProfile();
      setIsEditingInline(false);
      notify.success('Profile Saved!', 'Your profile information has been updated.');
      setSaveSuccessMsg('Profile updated successfully!');
      setTimeout(() => setSaveSuccessMsg(''), 4000);
    } catch (err) {
      console.error('Failed to update inline profile', err);
      notify.error('Update Failed', 'Failed to update profile.');
    } finally {
      setSavingInline(false);
    }
  };

  const handleConnect = async () => {
    if (connStatus === 'accepted') {
      try {
        const res = await api.post('/conversations', { recipient_id: targetId });
        navigate(`/messages/${res.data.id}`);
      } catch (err) {
        navigate('/messages');
      }
      return;
    }

    // 1. Optimistic instant UI update
    const previousStatus = connStatus;
    setConnStatus('pending');

    // 2. Background backend persistence
    try {
      await api.post(`/connections/${targetId}/request`, {
        note: `Hi ${profileData.profile?.display_name || profileData.username}, let's collaborate on WithMe!`
      });
      notify.success('Request Sent', `Connection request sent to ${profileData.profile?.display_name || profileData.username}.`);
    } catch (err: any) {
      const errMsg = err.response?.data?.error || '';
      console.error('Failed to connect', errMsg);
      if (errMsg.toLowerCase().includes('already')) {
        if (errMsg.toLowerCase().includes('connected')) {
          setConnStatus('accepted');
        } else {
          setConnStatus('pending');
        }
      } else {
        // Rollback on unexpected error
        setConnStatus(previousStatus);
      }
    }
  };

  const handleAcceptConnection = async () => {
    const connId = profileData?.connection?.id;
    if (!connId) return;
    setConnectLoading(true);
    try {
      await api.put(`/connections/${connId}`, { action: 'accept' });
      setConnStatus('accepted');
      notify.success('Connected!', `You are now connected with ${profileData?.profile?.display_name || profileData?.username}!`);
      fetchProfile();
    } catch (err: any) {
      console.error('Failed to accept connection', err);
      notify.error('Error', err.response?.data?.error || 'Failed to accept invitation.');
    } finally {
      setConnectLoading(false);
    }
  };

  const handleDeclineConnection = async () => {
    const connId = profileData?.connection?.id;
    if (!connId) return;
    setConnectLoading(true);
    try {
      await api.put(`/connections/${connId}`, { action: 'decline' });
      setConnStatus('none');
      notify.info('Declined', 'Connection invitation was declined.');
      fetchProfile();
    } catch (err: any) {
      console.error('Failed to decline connection', err);
    } finally {
      setConnectLoading(false);
    }
  };

  const handleStartDirectChat = async () => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    setChatDirectLoading(true);
    try {
      const res = await api.post('/conversations', { recipient_id: targetId });
      if (res.data?.id) {
        navigate(`/messages?conv=${res.data.id}`);
      } else {
        navigate('/messages');
      }
    } catch {
      navigate('/messages');
    } finally {
      setChatDirectLoading(false);
    }
  };

  const renderStatusBadge = (status: string, msg?: string) => {
    const s = status || 'online';
    const config: Record<string, { label: string; dot: string; bg: string; text: string }> = {
      online: { label: 'Online', dot: 'bg-emerald-500', bg: 'bg-emerald-500/10 border-emerald-500/30', text: 'text-emerald-600 dark:text-emerald-400' },
      available: { label: 'Available to Study', dot: 'bg-amber-500 animate-ping', bg: 'bg-amber-500/10 border-amber-500/30', text: 'text-amber-600 dark:text-amber-400' },
      busy: { label: 'In Deep Focus / Busy', dot: 'bg-red-500', bg: 'bg-red-500/10 border-red-500/30', text: 'text-red-600 dark:text-red-400' },
      away: { label: 'Away / In Class', dot: 'bg-neutral-500', bg: 'bg-neutral-500/10 border-neutral-500/30', text: 'text-neutral-600 dark:text-neutral-400' },
      offline: { label: 'Offline', dot: 'bg-neutral-400', bg: 'bg-neutral-200 border-neutral-300 dark:bg-neutral-800 dark:border-neutral-700', text: 'text-neutral-600 dark:text-neutral-400' }
    };

    const cur = config[s] || config.online;

    return (
      <div className={`inline-flex items-center gap-2 px-3 py-1 rounded-xl border text-xs font-bold ${cur.bg} ${cur.text}`}>
        <span className={`w-2 h-2 rounded-full ${cur.dot}`} />
        <span>{cur.label}</span>
        {msg && <span className="text-neutral-600 dark:text-neutral-300 font-normal">· "{msg}"</span>}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-20 text-center text-neutral-500 dark:text-[#8A8A8A]">
        <p className="text-xs">Loading profile...</p>
      </div>
    );
  }

  if (!profileData) {
    return (
      <div className="max-w-md mx-auto px-4 py-20 text-center text-neutral-900 dark:text-white">
        <p className="text-sm text-neutral-500 dark:text-[#D4D4D4]">User not found.</p>
      </div>
    );
  }

  const profile = profileData.profile || {};
  const interests = profileData.interests || [];
  const goals = profileData.goals || [];
  const skills = profileData.skills || [];
  const compatibility = profileData.compatibility;
  const currentPresenceStatus = profile.status || 'online';

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {saveSuccessMsg && (
        <div className="p-3 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-xs text-emerald-600 dark:text-emerald-400 font-bold animate-in fade-in">
          {saveSuccessMsg}
        </div>
      )}

      {/* 1. INSTAGRAM-STYLE PROFILE HEADER CARD */}
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-6 sm:p-8 shadow-xl">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          {/* Avatar + Main Info */}
          <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
            <div className="relative shrink-0">
              {profile.avatar_url ? (
                <img
                  src={profile.avatar_url}
                  alt={profile.display_name}
                  className="w-24 h-24 sm:w-28 sm:h-28 rounded-full object-cover border-2 border-neutral-300 dark:border-[#292929] shadow-xl"
                />
              ) : (
                <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border-2 border-neutral-300 dark:border-[#292929] flex items-center justify-center font-black text-3xl shadow-xl">
                  {getInitials(profile.display_name || profileData.username)}
                </div>
              )}
            </div>

            <div className="space-y-2 text-center sm:text-left">
              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-3">
                <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
                  {profile.display_name || profileData.username}
                </h1>
                {renderStatusBadge(currentPresenceStatus, profile.status_message)}
                {!isOwnProfile && (
                  <button
                    type="button"
                    onClick={handleStartDirectChat}
                    disabled={chatDirectLoading}
                    className="p-1.5 rounded-xl border border-neutral-200 dark:border-[#2E2E2E] bg-neutral-100 hover:bg-neutral-200 dark:bg-[#1A1A1A] dark:hover:bg-[#252525] text-neutral-900 dark:text-white transition-colors cursor-pointer"
                    title={`Send message to ${profile.display_name || profileData.username}`}
                  >
                    <MessageSquare className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  </button>
                )}
              </div>

              {/* Instagram-style metrics */}
              <div className="flex items-center justify-center sm:justify-start gap-6 text-sm pt-1">
                <div>
                  <span className="font-black text-neutral-900 dark:text-white">{postsCount}</span>{' '}
                  <span className="text-neutral-500 dark:text-[#8A8A8A]">activities</span>
                </div>

                <button
                  type="button"
                  onClick={() => {
                    setFollowersModalTab('followers');
                    setShowFollowersModal(true);
                  }}
                  className="cursor-pointer hover:underline"
                >
                  <span className="font-black text-neutral-900 dark:text-white">{followersCount}</span>{' '}
                  <span className="text-neutral-500 dark:text-[#8A8A8A]">followers</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setFollowersModalTab('following');
                    setShowFollowersModal(true);
                  }}
                  className="cursor-pointer hover:underline"
                >
                  <span className="font-black text-neutral-900 dark:text-white">{followingCount}</span>{' '}
                  <span className="text-neutral-500 dark:text-[#8A8A8A]">following</span>
                </button>
              </div>

              {profile.headline && (
                <p className="text-sm text-neutral-700 dark:text-[#D4D4D4] font-medium pt-1">{profile.headline}</p>
              )}

              <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 text-xs text-neutral-500 dark:text-[#8A8A8A] pt-0.5">
                {profile.city && (
                  <span className="flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-neutral-400 dark:text-[#5C5C5C]" />
                    {profile.city}
                  </span>
                )}
                <span className="flex items-center gap-1">
                  <Activity className="w-3.5 h-3.5 text-neutral-400 dark:text-[#5C5C5C]" />
                  Mode: <span className="text-neutral-900 dark:text-white capitalize font-medium">{profile.activity_mode || 'Both'}</span>
                </span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2.5 w-full md:w-auto">
            {isOwnProfile ? (
              <div className="flex items-center gap-2">
                <div className="min-w-[140px]">
                  <Select value={currentPresenceStatus} onValueChange={handleQuickStatusChange}>
                    <SelectTrigger className="h-9 text-xs">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="online">🟢 Online</SelectItem>
                      <SelectItem value="available">⚡ Available to Study</SelectItem>
                      <SelectItem value="busy">🔴 In Deep Focus</SelectItem>
                      <SelectItem value="away">🟡 Away / In Class</SelectItem>
                      <SelectItem value="offline">⚪ Offline</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Link to="/messages">
                  <Button variant="outline" size="md" className="font-bold text-xs flex items-center gap-1.5">
                    <MessageSquare className="w-4 h-4 text-primary" />
                    Chats
                  </Button>
                </Link>

                <Button
                  variant={isEditingInline ? 'secondary' : 'primary'}
                  size="md"
                  onClick={() => setIsEditingInline(!isEditingInline)}
                  className="font-bold text-xs"
                >
                  {isEditingInline ? (
                    <>
                      <Eye className="w-4 h-4 mr-1" />
                      View Dashboard
                    </>
                  ) : (
                    <>
                      <Edit3 className="w-4 h-4 mr-1" />
                      Edit Profile
                    </>
                  )}
                </Button>
              </div>
            ) : (
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={handleToggleFollow}
                  disabled={followLoading}
                  className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 shadow-xs ${
                    isFollowing
                      ? 'bg-neutral-100 text-neutral-800 hover:bg-neutral-200 border border-neutral-300 dark:bg-[#141414] dark:text-[#D4D4D4] dark:hover:bg-[#1C1C1C] dark:border-[#242424]'
                      : 'bg-neutral-900 hover:bg-neutral-800 text-white dark:bg-white dark:hover:bg-neutral-200 dark:text-black font-bold'
                  }`}
                >
                  {isFollowing ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                      Following
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-3.5 h-3.5" />
                      Follow
                    </>
                  )}
                </button>

                {/* Direct Chat button on user profile detail page */}
                <Button
                  variant="outline"
                  size="md"
                  onClick={handleStartDirectChat}
                  loading={chatDirectLoading}
                  className="text-xs font-bold flex items-center gap-1.5"
                  title="Direct Chat"
                >
                  <MessageSquare className="w-4 h-4 text-amber-500 dark:text-amber-400" />
                  <span>Chat</span>
                </Button>

                {connStatus === 'accepted' ? (
                  <Button variant="outline" size="md" onClick={handleConnect} className="text-xs font-bold text-emerald-600 dark:text-emerald-400 border-emerald-500/40">
                    <Check className="w-4 h-4 mr-1 text-emerald-500" />
                    Connected
                  </Button>
                ) : connStatus === 'pending' && profileData?.connection && !profileData.connection.is_requester ? (
                  <div className="flex items-center gap-1.5">
                    <Button variant="primary" size="md" onClick={handleAcceptConnection} loading={connectLoading} className="text-xs font-bold bg-emerald-600 hover:bg-emerald-700 text-white">
                      <Check className="w-4 h-4 mr-1" />
                      Accept
                    </Button>
                    <Button variant="outline" size="md" onClick={handleDeclineConnection} loading={connectLoading} className="text-xs font-bold text-neutral-500 hover:text-red-500 hover:bg-red-500/10">
                      Decline
                    </Button>
                  </div>
                ) : connStatus === 'pending' ? (
                  <Button variant="outline" size="md" disabled className="text-xs">
                    <Clock className="w-4 h-4 mr-1 text-amber-500" />
                    Pending
                  </Button>
                ) : (
                  <Button variant="primary" size="md" onClick={handleConnect} loading={connectLoading} className="text-xs font-bold">
                    <Sparkles className="w-4 h-4 mr-1" />
                    Connect
                  </Button>
                )}

                <Button variant="outline" size="md" onClick={() => setShowContactModal(true)}>
                  <Share2 className="w-4 h-4 mr-1" />
                  Share Info
                </Button>

                <button
                  onClick={() => setShowReportModal(true)}
                  className="p-2.5 rounded-xl border border-neutral-200 dark:border-[#242424] hover:bg-neutral-100 dark:hover:bg-[#141414] text-neutral-500 dark:text-[#8A8A8A] hover:text-red-500 transition-colors cursor-pointer"
                  title="Safety & Report"
                >
                  <Shield className="w-4 h-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. INLINE PROFILE EDITOR */}
      {isOwnProfile && isEditingInline ? (
        <Card className="border-neutral-300 dark:border-neutral-700 shadow-2xl animate-in fade-in">
          <div className="flex items-center justify-between pb-4 mb-6 border-b border-neutral-200 dark:border-neutral-800">
            <div className="flex items-center gap-2">
              <Edit3 className="w-5 h-5 text-neutral-900 dark:text-white" />
              <div>
                <h3 className="font-bold text-base text-neutral-900 dark:text-white">In-Place Profile & Skills Editor</h3>
                <p className="text-xs text-neutral-500 dark:text-neutral-400">Edit all profile information directly on this page.</p>
              </div>
            </div>
            <Button variant="ghost" size="sm" onClick={() => setIsEditingInline(false)}>
              <X className="w-4 h-4" />
              Close Editor
            </Button>
          </div>

          <form onSubmit={handleSaveInline} className="space-y-6">
            {/* Avatar & Photo Picker */}
            <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] space-y-3">
              <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider">Profile Avatar Image</p>
              <div className="flex flex-col sm:flex-row items-center gap-4">
                <div className="relative shrink-0">
                  {editAvatarUrl ? (
                    <img
                      src={editAvatarUrl}
                      alt={editName}
                      className="w-16 h-16 rounded-full object-cover border-2 border-neutral-400 dark:border-neutral-600 shadow-md"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white flex items-center justify-center font-bold text-lg">
                      {getInitials(editName || 'U')}
                    </div>
                  )}
                </div>

                <div className="flex-1 w-full space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="text"
                      placeholder="Paste image URL..."
                      value={editAvatarUrl}
                      onChange={(e) => setEditAvatarUrl(e.target.value)}
                      className="flex-1 bg-white dark:bg-[#080808] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                    />
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1A1A] hover:bg-neutral-100 dark:hover:bg-[#222222] text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-[#242424] flex items-center gap-1.5 cursor-pointer font-bold shadow-xs"
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

                  <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar pt-1">
                    <span className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] shrink-0">Presets:</span>
                    {avatarPresets.map((preset, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setEditAvatarUrl(preset)}
                        className={`w-7 h-7 rounded-full overflow-hidden border transition-transform shrink-0 ${
                          editAvatarUrl === preset ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : 'border-neutral-300 dark:border-[#242424] opacity-70 hover:opacity-100'
                        }`}
                      >
                        <img src={preset} className="w-full h-full object-cover" />
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Basic Info */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Display Name"
                value={editName}
                onChange={(e) => setEditName(e.target.value)}
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
                    {detectingGps ? 'Detecting...' : '📍 GPS Auto-detect'}
                  </button>
                </div>
                <Input
                  placeholder="e.g. Tashkent, Samarqand"
                  value={editCity}
                  onChange={(e) => setEditCity(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold text-neutral-700 dark:text-[#8A8A8A] mb-1.5">Live Presence Status</label>
                <Select value={editStatus} onValueChange={setEditStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="online">🟢 Online</SelectItem>
                    <SelectItem value="available">⚡ Available to Study</SelectItem>
                    <SelectItem value="busy">🔴 In Deep Focus</SelectItem>
                    <SelectItem value="away">🟡 Away / In Class</SelectItem>
                    <SelectItem value="offline">⚪ Offline</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Input
                label="Status Message"
                placeholder="e.g. Prepping for SAT Math 800 · Coding React"
                value={editStatusMsg}
                onChange={(e) => setEditStatusMsg(e.target.value)}
              />
            </div>

            <Input
              label="Headline"
              placeholder="e.g. Fullstack AI Dev · IELTS 8.0 Candidate"
              value={editHeadline}
              onChange={(e) => setEditHeadline(e.target.value)}
            />

            <Textarea
              label="Bio & Introduction"
              rows={3}
              placeholder="Tell potential study buddies and teammates about your goals and what you enjoy doing..."
              value={editBio}
              onChange={(e) => setEditBio(e.target.value)}
            />

            {/* Interests Editor */}
            <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-[#242424]">
              <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" />
                Interests & Hobbies
              </p>
              <div className="flex flex-wrap gap-1.5 min-h-[36px] p-2 bg-neutral-100 dark:bg-[#141414] rounded-xl border border-neutral-200 dark:border-[#242424]">
                {editInterests.map((it) => (
                  <span
                    key={it}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F1F1F] border border-neutral-200 dark:border-[#2E2E2E] text-neutral-900 dark:text-white text-xs font-medium shadow-xs"
                  >
                    {it}
                    <button
                      type="button"
                      onClick={() => setEditInterests(editInterests.filter((i) => i !== it))}
                      className="hover:text-red-500 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add new interest tag..."
                  value={newInterestInput}
                  onChange={(e) => setNewInterestInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newInterestInput.trim()) {
                        setEditInterests([...editInterests, newInterestInput.trim()]);
                        setNewInterestInput('');
                      }
                    }
                  }}
                  className="flex-1 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newInterestInput.trim()) {
                      setEditInterests([...editInterests, newInterestInput.trim()]);
                      setNewInterestInput('');
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add
                </Button>
              </div>
            </div>

            {/* Goals Editor */}
            <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-[#242424]">
              <p className="text-xs font-bold text-amber-600 dark:text-amber-400 uppercase tracking-wider flex items-center gap-1.5">
                <Target className="w-3.5 h-3.5" />
                Target Goals & Pursuits
              </p>
              <div className="space-y-1.5">
                {editGoals.map((g) => (
                  <div
                    key={g}
                    className="flex items-center justify-between p-2 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs text-neutral-900 dark:text-white"
                  >
                    <span>{g}</span>
                    <button
                      type="button"
                      onClick={() => setEditGoals(editGoals.filter((x) => x !== g))}
                      className="text-neutral-500 hover:text-red-500"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))}
              </div>
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Add target goal..."
                  value={newGoalInput}
                  onChange={(e) => setNewGoalInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      if (newGoalInput.trim()) {
                        setEditGoals([...editGoals, newGoalInput.trim()]);
                        setNewGoalInput('');
                      }
                    }
                  }}
                  className="flex-1 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                />
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    if (newGoalInput.trim()) {
                      setEditGoals([...editGoals, newGoalInput.trim()]);
                      setNewGoalInput('');
                    }
                  }}
                >
                  <Plus className="w-3.5 h-3.5" />
                  Add Goal
                </Button>
              </div>
            </div>

            {/* Skills & Levels Editor */}
            <div className="space-y-2 pt-3 border-t border-neutral-200 dark:border-[#242424]">
              <p className="text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider flex items-center gap-1.5">
                <Code className="w-3.5 h-3.5" />
                Skills & Experience Levels
              </p>
              <div className="flex flex-wrap gap-2">
                {editSkills.map((sk) => (
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
                      onClick={() => setEditSkills(editSkills.filter((s) => s.name !== sk.name))}
                      className="text-neutral-500 hover:text-red-500 ml-1"
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
                    placeholder="Skill name (Python, React, Figma)..."
                    value={newSkillName}
                    onChange={(e) => setNewSkillName(e.target.value)}
                    className="w-full bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                  />
                </div>
                <div className="sm:col-span-4">
                  <Select value={newSkillLevel} onValueChange={(val: any) => setNewSkillLevel(val)}>
                    <SelectTrigger className="h-9 text-xs">
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
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (newSkillName.trim()) {
                        setEditSkills([...editSkills, { name: newSkillName.trim(), level: newSkillLevel }]);
                        setNewSkillName('');
                      }
                    }}
                    className="w-full"
                  >
                    <Plus className="w-3.5 h-3.5" />
                  </Button>
                </div>
              </div>
            </div>

            {/* Save Actions */}
            <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-200 dark:border-[#242424]">
              <Button type="button" variant="ghost" onClick={() => setIsEditingInline(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="primary" loading={savingInline} className="font-bold px-6">
                <Save className="w-4 h-4 mr-1" />
                Save Profile Changes
              </Button>
            </div>
          </form>
        </Card>
      ) : null}

      {/* 3. PROFILE DASHBOARD & PROGRESS TRACKING SECTION */}
      {isOwnProfile && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <Activity className="w-5 h-5 text-neutral-900 dark:text-white" />
              Collaboration & Progress Dashboard
            </h2>
            <span className="text-xs text-neutral-500 dark:text-[#8A8A8A]">Live Weekly Stats</span>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Metric 1: Streak */}
            <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A8A]">
                <span>Active Streak</span>
                <Flame className="w-4 h-4 text-orange-500 dark:text-orange-400" />
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">7 Days 🔥</p>
              <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium">Daily study & collaboration</p>
            </div>

            {/* Metric 2: Weekly Hours */}
            <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A8A]">
                <span>Weekly Study Hours</span>
                <Clock className="w-4 h-4 text-neutral-900 dark:text-white" />
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">18.5 hrs</p>
              <div className="w-full bg-neutral-200 dark:bg-[#1F1F1F] h-1.5 rounded-full overflow-hidden mt-2">
                <div className="bg-neutral-900 dark:bg-white h-full rounded-full w-[74%]" />
              </div>
              <p className="text-[10px] text-neutral-500">74% of 25h weekly goal</p>
            </div>

            {/* Metric 3: Active Connections */}
            <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A8A]">
                <span>Partners & Guilds</span>
                <Sparkles className="w-4 h-4 text-emerald-500" />
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">12 Peers</p>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">4 Study Groups active</p>
            </div>

            {/* Metric 4: Trust Karma */}
            <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 space-y-1 shadow-xs">
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A8A]">
                <span>Trust & Reliability</span>
                <Award className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <p className="text-2xl font-black text-neutral-900 dark:text-white">99% Score</p>
              <p className="text-[11px] text-amber-600 dark:text-amber-400 font-bold">Verified Study Partner</p>
            </div>
          </div>

          {/* Achievements */}
          <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-5 space-y-3 shadow-xs">
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-neutral-300 flex items-center gap-2">
              <Trophy className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              Achievements & Badges
            </h3>
            <div className="flex flex-wrap gap-2.5">
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs">
                <span>🏅</span>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">Early Explorer</p>
                  <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">Joined WithMe Beta</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs">
                <span>🔥</span>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">7-Day Streak</p>
                  <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">Unbroken study habit</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs">
                <span>📚</span>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">SAT Sprint Master</p>
                  <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">Completed 10+ problem sets</p>
                </div>
              </div>

              <div className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs">
                <span>🚀</span>
                <div>
                  <p className="font-bold text-neutral-900 dark:text-white">MVP Builder</p>
                  <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">Active project contributor</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 4. PUBLIC PROFILE DETAILS */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (2 cols) */}
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">About Me</h3>
            <p className="text-sm text-neutral-800 dark:text-[#D4D4D4] leading-relaxed whitespace-pre-line">
              {profile.bio || 'This user hasn’t written a bio yet.'}
            </p>
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Compass className="w-4 h-4 text-neutral-900 dark:text-white" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Interests & Hobbies</h3>
            </div>
            {interests.length === 0 ? (
              <p className="text-xs text-neutral-500">No interests specified yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {interests.map((it: any, idx: number) => (
                  <span
                    key={idx}
                    className="px-3 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs font-medium text-neutral-900 dark:text-white shadow-xs"
                  >
                    {it.name || it.interest?.name || it}
                  </span>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Target className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Target Goals & Milestones</h3>
            </div>
            {goals.length === 0 ? (
              <p className="text-xs text-neutral-500">No goals added yet.</p>
            ) : (
              <div className="space-y-2">
                {goals.map((g: any, idx: number) => (
                  <div
                    key={idx}
                    className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs text-neutral-900 dark:text-white"
                  >
                    <span className="font-bold">{g.title || g.goal?.title || g}</span>
                    <span className="text-[10px] text-amber-600 dark:text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md font-bold">
                      In Progress
                    </span>
                  </div>
                ))}
              </div>
            )}
          </Card>

          <Card>
            <div className="flex items-center gap-2 mb-3">
              <Code className="w-4 h-4 text-neutral-900 dark:text-white" />
              <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400">Skills & Tech Stack</h3>
            </div>
            {skills.length === 0 ? (
              <p className="text-xs text-neutral-500">No skills listed yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                {skills.map((s: any, idx: number) => (
                  <SkillBadge
                    key={idx}
                    skill={{
                      name: s.name || s.skill?.name || s,
                      level: s.level || 'Intermediate'
                    }}
                  />
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Right Column (1 col) */}
        <div className="space-y-6">
          {!isOwnProfile && compatibility && (
            <Card className="border-neutral-300 dark:border-neutral-700">
              <div className="flex items-center justify-between mb-4">
                <span className="text-xs font-bold uppercase tracking-wider text-neutral-700 dark:text-white">Compatibility</span>
                <span className="text-lg font-black text-neutral-900 dark:text-white">{compatibility.compatibility_score}%</span>
              </div>
              <div className="space-y-2.5 text-xs text-neutral-600 dark:text-neutral-300">
                <div className="flex justify-between">
                  <span>Shared Interests</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{compatibility.shared_interests?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Target Goals Match</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{compatibility.shared_goals?.length || 0}</span>
                </div>
                <div className="flex justify-between">
                  <span>Distance</span>
                  <span className="font-bold text-neutral-900 dark:text-white">{compatibility.distance_bucket || 'Nearby'}</span>
                </div>
              </div>
            </Card>
          )}

          <Card>
            <h3 className="text-xs font-bold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 mb-3">Social & Handles</h3>
            <div className="space-y-2.5 text-xs">
              {profile.telegram && (
                <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                  <span className="text-neutral-500">Telegram</span>
                  <span className="font-mono font-bold text-neutral-900 dark:text-white">{profile.telegram}</span>
                </div>
              )}
              {profile.discord && (
                <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                  <span className="text-neutral-500">Discord</span>
                  <span className="font-mono text-neutral-900 dark:text-white">{profile.discord}</span>
                </div>
              )}
              {profile.github && (
                <div className="flex items-center justify-between text-neutral-700 dark:text-neutral-300">
                  <span className="text-neutral-500">GitHub</span>
                  <span className="font-mono text-neutral-900 dark:text-white">{profile.github}</span>
                </div>
              )}
              {!profile.telegram && !profile.discord && !profile.github && (
                <p className="text-xs text-neutral-400">No contact handles added yet.</p>
              )}
            </div>
          </Card>
        </div>
      </div>

      {/* Modals */}
      <FollowersModal
        isOpen={showFollowersModal}
        onClose={() => setShowFollowersModal(false)}
        userId={targetId!}
        username={profileData?.username || 'user'}
        initialTab={followersModalTab}
        onFollowChange={fetchProfile}
      />

      <ContactShareModal
        isOpen={showContactModal}
        onClose={() => setShowContactModal(false)}
        recipientId={targetId!}
        recipientName={profile.display_name || profileData.username}
      />

      <ReportModal
        isOpen={showReportModal}
        onClose={() => setShowReportModal(false)}
        targetUserId={targetId!}
        targetUserName={profile.display_name || profileData.username}
      />
    </div>
  );
};
