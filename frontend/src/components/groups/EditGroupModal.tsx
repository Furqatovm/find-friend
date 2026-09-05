import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Save, AlertCircle, Globe, Lock } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import type { Group } from '@/types';

interface EditGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  group: Group;
  onSuccess: (updated: Group) => void;
}

export const EditGroupModal: React.FC<EditGroupModalProps> = ({
  isOpen,
  onClose,
  group,
  onSuccess
}) => {
  const { notify } = useNotification();
  const [name, setName] = useState(group.name);
  const [description, setDescription] = useState(group.description);
  const [category, setCategory] = useState(group.category);
  const [avatarUrl, setAvatarUrl] = useState(group.avatar_url || '');
  const [isPrivate, setIsPrivate] = useState(group.is_private || false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(group.name);
      setDescription(group.description);
      setCategory(group.category);
      setAvatarUrl(group.avatar_url || '');
      setIsPrivate(group.is_private || false);
      setErrorMsg('');
    }
  }, [isOpen, group]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim() || !description.trim()) {
      setErrorMsg('Group name and description are required');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        name: name.trim(),
        description: description.trim(),
        category,
        avatar_url: avatarUrl.trim() || null,
        is_private: isPrivate
      };
      const res = await api.put(`/groups/${group.id}`, payload);
      notify.success('Group Updated!', `"${res.data.name}" changes saved successfully.`);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update group';
      setErrorMsg(msg);
      notify.error('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Learning', 'Coding', 'Gaming', 'Reading', 'Fitness', 'Discussion', 'Projects', 'Other'];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Group"
      description="Update group settings, topic, category, and access."
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
            Group Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Frontend Engineers Guild"
            required
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
            Description *
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this group about?"
            rows={3}
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
              Category
            </label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger>
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((c) => (
                  <SelectItem key={c} value={c}>{c}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
              Visibility
            </label>
            <div className="flex rounded-xl p-1 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
              <button
                type="button"
                onClick={() => setIsPrivate(false)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  !isPrivate
                    ? 'bg-white dark:bg-[#202020] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 dark:text-[#8A8A8A]'
                }`}
              >
                <Globe className="w-3.5 h-3.5" />
                Public
              </button>
              <button
                type="button"
                onClick={() => setIsPrivate(true)}
                className={`flex-1 flex items-center justify-center gap-1.5 py-1.5 text-xs font-bold rounded-lg transition-all ${
                  isPrivate
                    ? 'bg-white dark:bg-[#202020] text-neutral-900 dark:text-white shadow-xs'
                    : 'text-neutral-500 dark:text-[#8A8A8A]'
                }`}
              >
                <Lock className="w-3.5 h-3.5" />
                Private
              </button>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
            Avatar URL (optional)
          </label>
          <Input
            value={avatarUrl}
            onChange={(e) => setAvatarUrl(e.target.value)}
            placeholder="https://images.unsplash.com/..."
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-[#242424]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading} className="font-bold">
            <Save className="w-4 h-4 mr-1.5" />
            Save Changes
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
