import React, { useState } from 'react';
import { Dialog } from '../ui/Dialog';
import { Button } from '../ui/Button';
import { Textarea } from '../ui/Textarea';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';

interface ReportModalProps {
  isOpen: boolean;
  onClose: () => void;
  targetUserId: string;
  targetUserName: string;
}

export const ReportModal: React.FC<ReportModalProps> = ({
  isOpen,
  onClose,
  targetUserId,
  targetUserName
}) => {
  const { notify } = useNotification();
  const [reason, setReason] = useState('spam');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async () => {
    setLoading(true);
    try {
      await api.post('/reports', {
        reported_user_id: targetUserId,
        reason,
        description
      });
      notify.info('Report Submitted', 'Thank you. Our moderation team has received your report.');
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        onClose();
      }, 1500);
    } catch (e: any) {
      console.error('Failed to report user', e);
      notify.error('Report Failed', e.response?.data?.error || 'Failed to submit report');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title={`Report ${targetUserName}`}
      description="Help us keep WithMe safe, friendly, and productive."
    >
      <div className="space-y-4 text-neutral-900 dark:text-white">
        <div>
          <label className="block text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] mb-2">
            Reason for report
          </label>
          <div className="grid grid-cols-2 gap-2">
            {[
              { id: 'spam', label: 'Spam or Advertising' },
              { id: 'harassment', label: 'Harassment / Rude' },
              { id: 'inappropriate', label: 'Inappropriate Content' },
              { id: 'fake_profile', label: 'Fake / Impersonation' },
              { id: 'other', label: 'Other Concern' }
            ].map((r) => (
              <button
                type="button"
                key={r.id}
                onClick={() => setReason(r.id)}
                className={`p-2.5 text-xs text-left rounded-xl border transition-all cursor-pointer ${
                  reason === r.id
                    ? 'bg-neutral-900 text-white font-bold border-neutral-900 dark:bg-white dark:text-black dark:border-white shadow-xs'
                    : 'bg-neutral-100 text-neutral-700 hover:text-neutral-900 hover:bg-neutral-200 border-neutral-200 dark:bg-[#141414] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#1A1A1A]'
                }`}
              >
                {r.label}
              </button>
            ))}
          </div>
        </div>

        <Textarea
          label="Additional Details (Optional)"
          placeholder="Please describe what happened..."
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={3}
        />

        <div className="flex items-center justify-end gap-3 pt-3 border-t border-neutral-200 dark:border-[#242424]">
          <Button variant="ghost" onClick={onClose} className="text-xs">
            Cancel
          </Button>
          <Button variant="destructive" loading={loading} onClick={handleSubmit} className="text-xs font-bold">
            {success ? 'Report Submitted' : 'Submit Report'}
          </Button>
        </div>
      </div>
    </Dialog>
  );
};
