import React, { useState } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Plus, Trash2, ShieldCheck } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';

interface CreatePollModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (pollData: any) => void;
}

export const CreatePollModal: React.FC<CreatePollModalProps> = ({
  isOpen,
  onClose,
  onSubmit
}) => {
  const { notify } = useNotification();
  const [question, setQuestion] = useState('');
  const [options, setOptions] = useState(['', '']);
  const [isAnonymous, setIsAnonymous] = useState(true);

  const handleAddOption = () => {
    if (options.length < 8) {
      setOptions([...options, '']);
    }
  };

  const handleRemoveOption = (index: number) => {
    if (options.length > 2) {
      setOptions(options.filter((_, i) => i !== index));
    }
  };

  const handleOptionChange = (index: number, value: string) => {
    const updated = [...options];
    updated[index] = value;
    setOptions(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validOptions = options.map((opt) => opt.trim()).filter(Boolean);
    if (!question.trim() || validOptions.length < 2) return;

    const pollData = {
      question: question.trim(),
      options: validOptions.map((opt, idx) => ({
        id: `opt_${Date.now()}_${idx}`,
        text: opt,
        voters: []
      })),
      is_anonymous: isAnonymous,
      is_closed: false
    };

    onSubmit(pollData);
    notify.success('Poll Created!', `"${question.trim()}" is now open for voting.`);
    setQuestion('');
    setOptions(['', '']);
    onClose();
  };

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Create Poll"
      description="Create a poll for guild members to vote on."
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-neutral-900 dark:text-white">
        <Input
          label="Poll Question"
          placeholder="Ask a question..."
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          required
        />

        <div className="space-y-2">
          <label className="block text-xs font-bold text-neutral-700 dark:text-[#D4D4D4]">
            Poll Options (2 to 8)
          </label>
          {options.map((opt, index) => (
            <div key={index} className="flex items-center gap-2">
              <input
                type="text"
                placeholder={`Option ${index + 1}`}
                value={opt}
                onChange={(e) => handleOptionChange(index, e.target.value)}
                className="flex-1 bg-white dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl px-3.5 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
                required
              />
              {options.length > 2 && (
                <button
                  type="button"
                  onClick={() => handleRemoveOption(index)}
                  className="p-2 text-neutral-500 hover:text-red-500 rounded-lg hover:bg-neutral-100 dark:text-[#8A8A8A] dark:hover:bg-[#1A1A1A] cursor-pointer"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </div>
          ))}

          {options.length < 8 && (
            <button
              type="button"
              onClick={handleAddOption}
              className="text-xs text-neutral-900 dark:text-white hover:underline font-bold flex items-center gap-1.5 pt-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              Add an option
            </button>
          )}
        </div>

        <div className="p-3 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-neutral-900 dark:text-white" />
            <span className="text-xs text-neutral-700 dark:text-[#D4D4D4]">Anonymous Voting</span>
          </div>
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded text-neutral-900 dark:text-white bg-neutral-100 dark:bg-[#1A1A1A] border-neutral-300 dark:border-[#292929] cursor-pointer"
          />
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-200 dark:border-[#242424]">
          <Button variant="ghost" size="sm" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" size="sm" type="submit" disabled={!question.trim() || options.filter((o) => o.trim()).length < 2} className="font-bold">
            Create Poll
          </Button>
        </div>
      </form>
    </Dialog>
  );
};
