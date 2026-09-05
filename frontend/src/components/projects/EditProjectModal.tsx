import React, { useState, useEffect } from 'react';
import { Dialog } from '@/components/ui/Dialog';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { Save, AlertCircle } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import type { Project } from '@/types';

interface EditProjectModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: Project;
  onSuccess: (updated: Project) => void;
}

export const EditProjectModal: React.FC<EditProjectModalProps> = ({
  isOpen,
  onClose,
  project,
  onSuccess
}) => {
  const { notify } = useNotification();
  const [title, setTitle] = useState(project.title);
  const [description, setDescription] = useState(project.description);
  const [category, setCategory] = useState(project.category);
  const [stage, setStage] = useState(project.stage);
  const [lookingForRoles, setLookingForRoles] = useState(
    project.looking_for_roles ? project.looking_for_roles.join(', ') : ''
  );
  const [requiredSkills, setRequiredSkills] = useState(
    project.required_skills ? project.required_skills.join(', ') : ''
  );
  const [maxMembers, setMaxMembers] = useState(project.max_members || 5);
  const [goals, setGoals] = useState(project.goals || '');
  const [imageUrl, setImageUrl] = useState(project.image_url || '');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  useEffect(() => {
    if (isOpen) {
      setTitle(project.title);
      setDescription(project.description);
      setCategory(project.category);
      setStage(project.stage);
      setLookingForRoles(project.looking_for_roles ? project.looking_for_roles.join(', ') : '');
      setRequiredSkills(project.required_skills ? project.required_skills.join(', ') : '');
      setMaxMembers(project.max_members || 5);
      setGoals(project.goals || '');
      setImageUrl(project.image_url || '');
      setErrorMsg('');
    }
  }, [isOpen, project]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !description.trim()) {
      setErrorMsg('Title and description are required');
      return;
    }

    setLoading(true);
    setErrorMsg('');
    try {
      const payload = {
        title: title.trim(),
        description: description.trim(),
        category,
        stage,
        looking_for_roles: lookingForRoles.split(',').map((s) => s.trim()).filter(Boolean),
        required_skills: requiredSkills.split(',').map((s) => s.trim()).filter(Boolean),
        max_members: Number(maxMembers),
        goals: goals.trim(),
        image_url: imageUrl.trim() || null
      };
      const res = await api.put(`/projects/${project.id}`, payload);
      notify.project('Project Updated!', `"${res.data.title}" changes saved successfully.`);
      onSuccess(res.data);
      onClose();
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to update project';
      setErrorMsg(msg);
      notify.error('Update Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Startups', 'Game Dev', 'Open Source', 'AI', 'EdTech', 'Creative', 'Other'];
  const stages = ['Idea', 'Prototype', 'MVP', 'Launched'];

  return (
    <Dialog
      isOpen={isOpen}
      onClose={onClose}
      title="Edit Project"
      description="Update your project settings, goals, and recruitment criteria."
      maxWidth="max-w-xl"
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
            Project Title *
          </label>
          <Input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. AI-Powered Autonomous Agent"
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
            placeholder="What is your project about? What problem does it solve?"
            rows={4}
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
              Project Stage
            </label>
            <Select value={stage} onValueChange={(val: any) => setStage(val)}>
              <SelectTrigger>
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {stages.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
            Looking For Roles (comma separated)
          </label>
          <Input
            value={lookingForRoles}
            onChange={(e) => setLookingForRoles(e.target.value)}
            placeholder="e.g. Frontend Engineer, UI/UX Designer, ML Engineer"
          />
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
            Required Skills (comma separated)
          </label>
          <Input
            value={requiredSkills}
            onChange={(e) => setRequiredSkills(e.target.value)}
            placeholder="e.g. React, Python, PyTorch, Figma"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
              Max Team Members
            </label>
            <Input
              type="number"
              min={2}
              max={50}
              value={maxMembers}
              onChange={(e) => setMaxMembers(Number(e.target.value))}
            />
          </div>

          <div>
            <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
              Cover Image URL (optional)
            </label>
            <Input
              value={imageUrl}
              onChange={(e) => setImageUrl(e.target.value)}
              placeholder="https://images.unsplash.com/..."
            />
          </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1.5">
            Goals & Milestones
          </label>
          <Textarea
            value={goals}
            onChange={(e) => setGoals(e.target.value)}
            placeholder="Next steps, MVP launch date, hackathon deadlines, etc."
            rows={2}
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
