import React, { useState, useRef, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Users, Upload, X, Image as ImageIcon, Lock, Globe, Search, Check, UserPlus } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';

interface CreateGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

interface PersonOption {
  id: string;
  username: string;
  display_name: string;
  avatar_url: string | null;
  headline: string;
  relation: string[];
}

export const CreateGroupModal: React.FC<CreateGroupModalProps> = ({
  isOpen,
  onClose,
  onSuccess
}) => {
  const { notify } = useNotification();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Learning');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Member picker state
  const [myPeople, setMyPeople] = useState<PersonOption[]>([]);
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);
  const [memberSearch, setMemberSearch] = useState('');
  const [loadingPeople, setLoadingPeople] = useState(false);

  const groupAvatarPresets = [
    'https://images.unsplash.com/photo-1522071820081-009f0129c71c?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1531482615713-2afd69097998?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1519389950473-47ba0277781c?w=300&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1456513080510-7bf3a84b82f8?w=300&auto=format&fit=crop&q=80'
  ];

  // Fetch connected & followed users when private is toggled on
  useEffect(() => {
    if (isPrivate && myPeople.length === 0) {
      setLoadingPeople(true);
      api.get('/users/my-people')
        .then((res) => setMyPeople(res.data || []))
        .catch(() => {})
        .finally(() => setLoadingPeople(false));
    }
  }, [isPrivate]);

  // Reset state when modal closes
  useEffect(() => {
    if (!isOpen) {
      setName('');
      setDescription('');
      setCategory('Learning');
      setAvatarUrl('');
      setIsPrivate(false);
      setSelectedMembers([]);
      setMemberSearch('');
      setErrorMsg('');
    }
  }, [isOpen]);

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

  const toggleMember = (id: string) => {
    setSelectedMembers((prev) =>
      prev.includes(id) ? prev.filter((m) => m !== id) : [...prev, id]
    );
  };

  const filteredPeople = myPeople.filter((p) => {
    if (!memberSearch.trim()) return true;
    const q = memberSearch.toLowerCase();
    return (
      p.display_name.toLowerCase().includes(q) ||
      p.username.toLowerCase().includes(q) ||
      p.headline?.toLowerCase().includes(q)
    );
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setLoading(true);
    try {
      await api.post('/groups', {
        name: name.trim(),
        description: description.trim(),
        category,
        avatar_url: avatarUrl || undefined,
        is_private: isPrivate,
        invited_member_ids: isPrivate ? selectedMembers : []
      });
      notify.group('Community Guild Created!', `"${name.trim()}" is now open for collaboration.`);
      if (onSuccess) onSuccess();
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create community guild';
      setErrorMsg(msg);
      notify.error('Creation Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const getRelationBadge = (relation: string[]) => {
    if (relation.includes('connected')) return { label: 'Connected', color: 'bg-emerald-500/15 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
    if (relation.includes('following')) return { label: 'Following', color: 'bg-blue-500/15 text-blue-600 dark:text-blue-400 border-blue-500/20' };
    if (relation.includes('follower')) return { label: 'Follower', color: 'bg-amber-500/15 text-amber-600 dark:text-amber-400 border-amber-500/20' };
    return { label: 'Related', color: 'bg-neutral-500/15 text-neutral-600 dark:text-neutral-400 border-neutral-500/20' };
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Community Guild"
      description="Create a real-time community guild for discussions, polls, and collaboration."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-neutral-900 dark:text-white">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}

        <Input
          label="Guild / Group Name"
          placeholder="e.g. Tashkent SAT 1500+ Squad or React 19 Builders"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        {/* Optional Community Avatar */}
        <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] space-y-3">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-neutral-700 dark:text-[#D4D4D4] flex items-center gap-1.5">
              <ImageIcon className="w-3.5 h-3.5 text-neutral-900 dark:text-white" />
              Community Avatar / Logo <span className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] font-normal">(Optional)</span>
            </label>
            {avatarUrl && (
              <button
                type="button"
                onClick={() => setAvatarUrl('')}
                className="text-[11px] text-red-500 dark:text-red-400 hover:underline flex items-center gap-1 cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                Remove
              </button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              {avatarUrl ? (
                <img src={avatarUrl} className="w-12 h-12 rounded-full object-cover border border-neutral-300 dark:border-[#292929] shadow-md" />
              ) : (
                <div className="w-12 h-12 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white flex items-center justify-center font-bold border border-neutral-300 dark:border-[#292929]">
                  <Users className="w-5 h-5" />
                </div>
              )}
            </div>

            <div className="flex-1 space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Paste image URL (https://...)"
                  value={avatarUrl}
                  onChange={(e) => setAvatarUrl(e.target.value)}
                  className="flex-1 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                />
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-3 py-1.5 rounded-xl bg-white dark:bg-[#1A1A1A] hover:bg-neutral-100 dark:hover:bg-[#222222] border border-neutral-200 dark:border-[#292929] text-xs text-neutral-900 dark:text-white flex items-center gap-1.5 cursor-pointer shrink-0 font-medium"
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

              {/* Presets */}
              <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
                <span className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] shrink-0">Presets:</span>
                {groupAvatarPresets.map((preset, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setAvatarUrl(preset)}
                    className={`w-7 h-7 rounded-full overflow-hidden border transition-all shrink-0 ${
                      avatarUrl === preset ? 'ring-2 ring-neutral-900 dark:ring-white scale-110' : 'border-neutral-300 dark:border-[#242424] opacity-60 hover:opacity-100'
                    }`}
                  >
                    <img src={preset} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-700 dark:text-[#D4D4D4] mb-1.5">Category</label>
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger>
              <SelectValue placeholder="Select Category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Learning">Learning & Study</SelectItem>
              <SelectItem value="Startups">Startups & Tech</SelectItem>
              <SelectItem value="Languages">Languages</SelectItem>
              <SelectItem value="Gaming">Gaming & Game Dev</SelectItem>
              <SelectItem value="General">General Community</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <Textarea
          label="Guild Description & Mission"
          placeholder="What is the purpose of this community? What topics are discussed?"
          rows={3}
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        />

        {/* Private / Public Toggle */}
        <div className="p-4 rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2.5">
              {isPrivate ? (
                <Lock className="w-4 h-4 text-amber-500" />
              ) : (
                <Globe className="w-4 h-4 text-emerald-500" />
              )}
              <div>
                <p className="text-xs font-bold text-neutral-900 dark:text-white">
                  {isPrivate ? 'Private Guild' : 'Public Guild'}
                </p>
                <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">
                  {isPrivate
                    ? 'Only connected or followed users can join. You can invite members now.'
                    : 'Anyone can discover and join this guild.'}
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={() => setIsPrivate(!isPrivate)}
              className={`relative w-10 h-5.5 rounded-full transition-colors duration-200 cursor-pointer ${
                isPrivate
                  ? 'bg-amber-500'
                  : 'bg-neutral-300 dark:bg-[#292929]'
              }`}
              style={{ height: '22px' }}
            >
              <span
                className={`absolute top-0.5 left-0.5 w-4.5 h-4.5 bg-white rounded-full shadow-md transition-transform duration-200 ${
                  isPrivate ? 'translate-x-4.5' : ''
                }`}
                style={{
                  width: '18px',
                  height: '18px',
                  transform: isPrivate ? 'translateX(18px)' : 'translateX(0px)'
                }}
              />
            </button>
          </div>

          {/* Member Picker (only when private) */}
          {isPrivate && (
            <div className="space-y-2.5 pt-2 border-t border-neutral-200 dark:border-[#242424]">
              <div className="flex items-center justify-between">
                <p className="text-xs font-bold text-neutral-700 dark:text-[#D4D4D4] flex items-center gap-1.5">
                  <UserPlus className="w-3.5 h-3.5" />
                  Invite Members
                  {selectedMembers.length > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-md bg-amber-500/15 text-amber-600 dark:text-amber-400 text-[10px] font-bold border border-amber-500/20">
                      {selectedMembers.length} selected
                    </span>
                  )}
                </p>
              </div>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-neutral-400 dark:text-[#5C5C5C]" />
                <input
                  type="text"
                  placeholder="Search connections & followers..."
                  value={memberSearch}
                  onChange={(e) => setMemberSearch(e.target.value)}
                  className="w-full bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-xl pl-8 pr-3 py-1.5 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                />
              </div>

              {/* People List */}
              <div className="max-h-[180px] overflow-y-auto space-y-1 pr-1">
                {loadingPeople ? (
                  <div className="p-4 text-center text-[11px] text-neutral-500 dark:text-[#8A8A8A]">Loading your connections...</div>
                ) : filteredPeople.length === 0 ? (
                  <div className="p-4 text-center text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
                    {myPeople.length === 0
                      ? 'No connections or followers yet. Connect with people first!'
                      : 'No matches found.'}
                  </div>
                ) : (
                  filteredPeople.map((person) => {
                    const isSelected = selectedMembers.includes(person.id);
                    const badge = getRelationBadge(person.relation);

                    return (
                      <button
                        key={person.id}
                        type="button"
                        onClick={() => toggleMember(person.id)}
                        className={`w-full flex items-center gap-2.5 p-2 rounded-xl transition-all cursor-pointer ${
                          isSelected
                            ? 'bg-amber-500/10 border border-amber-500/20 dark:bg-amber-500/10 dark:border-amber-500/20'
                            : 'bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] hover:border-neutral-400 dark:hover:border-[#4A4A4A]'
                        }`}
                      >
                        {/* Avatar */}
                        <div className="w-8 h-8 rounded-full bg-neutral-200 dark:bg-[#1A1A1A] border border-neutral-300 dark:border-[#292929] flex items-center justify-center shrink-0 overflow-hidden">
                          {person.avatar_url ? (
                            <img src={person.avatar_url} className="w-full h-full object-cover" />
                          ) : (
                            <span className="text-[10px] font-bold text-neutral-700 dark:text-white">
                              {person.display_name?.slice(0, 2).toUpperCase()}
                            </span>
                          )}
                        </div>

                        <div className="flex-1 min-w-0 text-left">
                          <p className="text-xs font-bold text-neutral-900 dark:text-white truncate">{person.display_name}</p>
                          <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] truncate">@{person.username}</p>
                        </div>

                        {/* Relation badge */}
                        <span className={`px-1.5 py-0.5 rounded-md text-[9px] font-bold border shrink-0 ${badge.color}`}>
                          {badge.label}
                        </span>

                        {/* Checkbox */}
                        <div className={`w-5 h-5 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                          isSelected
                            ? 'bg-amber-500 border-amber-500 text-white'
                            : 'border-neutral-300 dark:border-[#4A4A4A]'
                        }`}>
                          {isSelected && <Check className="w-3 h-3" />}
                        </div>
                      </button>
                    );
                  })
                )}
              </div>
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-[#242424]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading} className="font-bold">
            {isPrivate ? (
              <>
                <Lock className="w-3.5 h-3.5 mr-1" />
                Create Private Guild
              </>
            ) : (
              'Create Community Guild'
            )}
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
