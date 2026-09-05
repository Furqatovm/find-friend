import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { ShieldCheck, Mail, Phone, Send, MessageSquare, GitBranch, Globe } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';

interface ContactShareModalProps {
  isOpen: boolean;
  onClose: () => void;
  recipientId: string;
  recipientName: string;
  onSuccess?: () => void;
}

export const ContactShareModal: React.FC<ContactShareModalProps> = ({
  isOpen,
  onClose,
  recipientId,
  recipientName,
  onSuccess
}) => {
  const { notify } = useNotification();
  const [selectedChannels, setSelectedChannels] = useState<{ [key: string]: boolean }>({
    telegram: true,
    discord: true,
    email: false,
    phone: false,
    github: true,
    website: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const toggleChannel = (channel: string) => {
    setSelectedChannels((prev) => ({ ...prev, [channel]: !prev[channel] }));
  };

  const handleShare = async () => {
    setLoading(true);
    try {
      await api.post('/conversations/share-contacts', {
        recipient_id: recipientId,
        channels: selectedChannels
      });
      notify.success('Contacts Shared', `Contact info shared with ${recipientName}.`);
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
        if (onSuccess) onSuccess();
      }, 1500);
    } catch (e: any) {
      console.error('Failed to share contacts', e);
      notify.error('Share Failed', e.response?.data?.error || 'Failed to share contacts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Share Contact Info with ${recipientName}`}
      description="You have full control. Only selected contact methods will be shared."
    >
      <div className="space-y-4 text-neutral-900 dark:text-white">
        <div className="p-3 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl text-xs text-neutral-700 dark:text-[#D4D4D4] flex items-center gap-2.5">
          <ShieldCheck className="w-4 h-4 shrink-0 text-neutral-900 dark:text-white" />
          <span>WithMe never exposes your contacts without your voluntary selection.</span>
        </div>

        <div className="space-y-2">
          {[
            { id: 'telegram', label: 'Telegram Handle', icon: <Send className="w-4 h-4 text-neutral-900 dark:text-white" /> },
            { id: 'discord', label: 'Discord Username', icon: <MessageSquare className="w-4 h-4 text-neutral-900 dark:text-white" /> },
            { id: 'email', label: 'Email Address', icon: <Mail className="w-4 h-4 text-amber-500 dark:text-amber-400" /> },
            { id: 'github', label: 'GitHub Profile', icon: <GitBranch className="w-4 h-4 text-neutral-900 dark:text-white" /> },
            { id: 'phone', label: 'Phone Number', icon: <Phone className="w-4 h-4 text-neutral-900 dark:text-white" /> },
            { id: 'website', label: 'Personal Website', icon: <Globe className="w-4 h-4 text-neutral-900 dark:text-white" /> }
          ].map((item) => {
            const isChecked = selectedChannels[item.id];
            return (
              <label
                key={item.id}
                onClick={() => toggleChannel(item.id)}
                className={`flex items-center justify-between p-3 rounded-xl border transition-all cursor-pointer ${
                  isChecked
                    ? 'bg-neutral-100 dark:bg-[#141414] border-neutral-400 dark:border-white/50 text-neutral-900 dark:text-white font-bold'
                    : 'bg-white dark:bg-[#0F0F0F] border-neutral-200 dark:border-[#242424] text-neutral-500 hover:text-neutral-900 hover:bg-neutral-50 dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414]'
                }`}
              >
                <div className="flex items-center gap-3">
                  {item.icon}
                  <span className="text-sm font-medium">{item.label}</span>
                </div>
                <input
                  type="checkbox"
                  checked={isChecked}
                  onChange={() => {}}
                  className="w-4 h-4 rounded text-neutral-900 dark:text-white bg-neutral-100 dark:bg-[#1A1A1A] border-neutral-300 dark:border-[#292929] cursor-pointer"
                />
              </label>
            );
          })}
        </div>

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-[#242424]">
          <Button variant="ghost" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button variant="primary" loading={loading} onClick={handleShare} className="font-bold text-xs">
            {success ? 'Shared Successfully!' : 'Share Selected'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
