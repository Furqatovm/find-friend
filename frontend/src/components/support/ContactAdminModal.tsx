import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import {
  Send,
  MessageSquare,
  Mail,
  CheckCircle2
} from 'lucide-react';
import { api } from '@/lib/api';

interface ContactAdminModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const ContactAdminModal: React.FC<ContactAdminModalProps> = ({
  isOpen,
  onClose
}) => {
  const [topic, setTopic] = useState('support');
  const [subject, setSubject] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMsg, setSuccessMsg] = useState('');
  const [errorMsg, setErrorMsg] = useState('');
  const [adminInfo, setAdminInfo] = useState<any>(null);

  useEffect(() => {
    if (isOpen) {
      api.get('/users/admin-contact-info')
        .then((res) => setAdminInfo(res.data))
        .catch(() => {});
    }
  }, [isOpen]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!message.trim()) return;
    setErrorMsg('');
    setLoading(true);
    try {
      const res = await api.post('/users/contact-admin', {
        topic,
        subject: subject.trim() || 'General Inquiry',
        message: message.trim()
      });
      setSuccessMsg(res.data.message);
      setMessage('');
      setSubject('');
      setTimeout(() => {
        setSuccessMsg('');
        onClose();
      }, 3500);
    } catch (err: any) {
      setErrorMsg(err.response?.data?.error || 'Failed to send message to admin');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Contact Administration & Support"
      description="Need help, want to report a safety concern, or have a suggestion? Send a direct message to the Super Admin team."
    >
      <div className="space-y-4 text-neutral-900 dark:text-white">
        {/* Admin Direct Channels */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 p-3.5 rounded-2xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-[#292929] flex items-center justify-center text-neutral-900 dark:text-white shadow-xs">
              <MessageSquare className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] uppercase font-bold tracking-wider">Telegram Admin</p>
              <p className="text-xs font-bold text-neutral-900 dark:text-white font-mono">{adminInfo?.telegram || '@withme_admin'}</p>
            </div>
          </div>

          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-white dark:bg-[#1A1A1A] border border-neutral-200 dark:border-[#292929] flex items-center justify-center text-amber-500 dark:text-amber-400 shadow-xs">
              <Mail className="w-4 h-4" />
            </div>
            <div>
              <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] uppercase font-bold tracking-wider">Email Support</p>
              <p className="text-xs font-bold text-neutral-900 dark:text-white font-mono">{adminInfo?.email || 'admin@withme.com'}</p>
            </div>
          </div>
        </div>

        {successMsg && (
          <div className="p-3.5 bg-emerald-500/10 border border-emerald-500/20 dark:bg-[#141414] dark:border-[#242424] rounded-2xl text-xs text-emerald-700 dark:text-white font-medium flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-500 dark:text-amber-400 shrink-0" />
            {successMsg}
          </div>
        )}

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}

        {/* Message Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] mb-1.5">Topic</label>
              <Select value={topic} onValueChange={setTopic}>
                <SelectTrigger>
                  <SelectValue placeholder="Select topic" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="support">Technical Support & Help</SelectItem>
                  <SelectItem value="safety">Safety, Abuse & Report</SelectItem>
                  <SelectItem value="feature">Feature Request & Feedback</SelectItem>
                  <SelectItem value="partnership">Partnership & Communities</SelectItem>
                  <SelectItem value="other">Other Inquiry</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] mb-1.5">Subject</label>
              <input
                type="text"
                placeholder="Brief summary..."
                value={subject}
                onChange={(e) => setSubject(e.target.value)}
                className="w-full bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
              />
            </div>
          </div>

          <Textarea
            label="Your Message to Admin"
            placeholder="Explain what happened or how we can assist you..."
            rows={4}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
          />

          <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-[#242424]">
            <span className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
              ⚡ Guaranteed response within 2 hours
            </span>

            <div className="flex items-center gap-2">
              <Button type="button" variant="ghost" size="sm" onClick={onClose} className="text-xs">
                Cancel
              </Button>
              <Button type="submit" variant="primary" size="sm" loading={loading} className="gap-1.5 font-bold text-xs">
                <Send className="w-3.5 h-3.5" />
                Send to Admin
              </Button>
            </div>
          </div>
        </form>
      </div>
    </Dialog>
  );
};
