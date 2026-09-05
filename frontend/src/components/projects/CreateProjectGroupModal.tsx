import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { MessageSquare, Lock, Globe } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import type { Group } from '@/types';

interface CreateProjectGroupModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectId: string;
  projectTitle: string;
  onSuccess: (newGroup: Group) => void;
}

export const CreateProjectGroupModal: React.FC<CreateProjectGroupModalProps> = ({
  isOpen,
  onClose,
  projectId,
  projectTitle,
  onSuccess
}) => {
  const { notify } = useNotification();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Discussion');
  const [isPrivate, setIsPrivate] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setErrorMsg('Please enter a group name');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.post(`/projects/${projectId}/groups`, {
        name: name.trim(),
        description: description.trim() || `Chat group for ${projectTitle}`,
        category,
        is_private: isPrivate
      });
      notify.group('Team Channel Created!', `"${res.data.name}" was created for ${projectTitle}.`);
      setName('');
      setDescription('');
      setIsPrivate(false);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create group';
      setErrorMsg(msg);
      notify.error('Creation Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Project Chat Group"
      description={`Create a dedicated group chat channel for ${projectTitle}. All project members will automatically have access.`}
      maxWidth="max-w-lg"
    >
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
            Group Name *
          </label>
          <Input
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="e.g. General Discussion, Frontend Team, Sprint 1"
            required
            autoFocus
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
            Topic / Description
          </label>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What is this chat group focused on?"
            rows={3}
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
                <SelectItem value="Discussion">Discussion</SelectItem>
                <SelectItem value="Development">Development</SelectItem>
                <SelectItem value="Design">Design</SelectItem>
                <SelectItem value="Planning">Planning</SelectItem>
                <SelectItem value="Marketing">Marketing</SelectItem>
                <SelectItem value="Random">Random</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
              Channel Visibility
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
                Team
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

        <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-200 dark:border-[#242424]">
          <Button type="button" variant="ghost" size="sm" onClick={onClose} disabled={loading}>
            Cancel
          </Button>
          <Button type="submit" variant="primary" size="sm" loading={loading} className="font-bold">
            <MessageSquare className="w-4 h-4 mr-1.5" />
            Create Group Chat
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
