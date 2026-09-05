import React, { useState, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { Rocket, ArrowLeft, Upload, X } from 'lucide-react';
import { useNotification } from '@/context/NotificationContext';
import { api } from '@/lib/api';
import { Input } from '@/components/ui/Input';
import { Textarea } from '@/components/ui/Textarea';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';

export const CreateProjectPage: React.FC = () => {
  const navigate = useNavigate();
  const { notify } = useNotification();
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const projectCoverPresets = [
    'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1550745165-9bc0b252726f?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1551288049-bebda4e38f71?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1526374965328-7f61d4dc18c5?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=600&auto=format&fit=crop&q=80',
    'https://images.unsplash.com/photo-1600132806370-bf17e65e942f?w=600&auto=format&fit=crop&q=80'
  ];

  const { register, handleSubmit, setValue, formState: { errors } } = useForm<{
    title: string;
    description: string;
    category: string;
    goals: string;
    looking_for_roles: string;
    required_skills: string;
    stage: string;
    max_members: number;
  }>({
    defaultValues: {
      category: 'Startups',
      stage: 'Idea',
      max_members: 5,
      looking_for_roles: 'Frontend Dev, UI/UX Designer, ML Engineer'
    }
  });

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      if (reader.result) {
        setImageUrl(reader.result as string);
      }
    };
    reader.readAsDataURL(file);
  };

  const onSubmit = async (data: any) => {
    setErrorMsg('');
    setLoading(true);
    try {
      const payload = {
        ...data,
        image_url: imageUrl || undefined
      };
      const res = await api.post('/projects', payload);
      notify.project('Project Launched!', `"${data.title}" was successfully created.`);
      navigate(`/projects/${res.data.id}`);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Failed to create project';
      setErrorMsg(msg);
      notify.error('Creation Failed', msg);
    } finally {
      setLoading(false);
    }
  };

  const categories = ['Startups', 'Game Dev', 'Open Source', 'AI', 'EdTech', 'Creative', 'Other'];
  const stages = ['Idea', 'Prototype', 'MVP', 'Launched'];

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-6 text-neutral-900 dark:text-white transition-colors duration-200">
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to projects
      </Link>

      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-900 dark:text-white uppercase tracking-wider mb-1">
            <Rocket className="w-3.5 h-3.5" />
            New Collaboration
          </div>
          <h1 className="text-2xl font-black text-neutral-900 dark:text-white tracking-tight">CREATE A PROJECT</h1>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
            Recruit co-founders, developers, and designers for your next build.
          </p>
        </div>

        {errorMsg && (
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            label="Project Title"
            placeholder="e.g. AI-Powered Medical Summarizer, Indie 2D Platformer"
            {...register('title', { required: 'Title is required' })}
            error={errors.title?.message}
          />

          {/* Optional Project Cover Image */}
          <div className="space-y-2 p-3.5 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-neutral-700 dark:text-[#D4D4D4]">Project Cover Image (Optional)</label>
              {imageUrl && (
                <button
                  type="button"
                  onClick={() => setImageUrl('')}
                  className="text-xs text-neutral-500 hover:text-red-500 dark:text-[#8A8A8A] dark:hover:text-red-400 flex items-center gap-1"
                >
                  <X className="w-3.5 h-3.5" />
                  Remove image
                </button>
              )}
            </div>

            {imageUrl && (
              <div className="relative w-full h-36 rounded-xl overflow-hidden border border-neutral-200 dark:border-[#242424] mb-2">
                <img src={imageUrl} alt="Cover preview" className="w-full h-full object-cover" />
              </div>
            )}

            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="Paste image URL..."
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                className="flex-1 bg-white dark:bg-[#080808] border border-neutral-200 dark:border-[#242424] rounded-xl px-3 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-[#5C5C5C] focus:outline-none focus:border-neutral-400 dark:focus:border-[#4A4A4A]"
              />
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="px-3 py-2 rounded-xl bg-white dark:bg-[#1A1A1A] hover:bg-neutral-100 dark:hover:bg-[#222222] text-xs text-neutral-900 dark:text-white border border-neutral-200 dark:border-[#242424] flex items-center gap-1.5 cursor-pointer shrink-0 font-bold shadow-xs"
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

            {/* Cover Presets */}
            <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pt-1">
              <span className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] shrink-0">Presets:</span>
              {projectCoverPresets.map((preset, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setImageUrl(preset)}
                  className={`w-12 h-8 rounded-lg overflow-hidden border transition-all shrink-0 ${
                    imageUrl === preset ? 'ring-2 ring-neutral-900 dark:ring-white scale-105' : 'border-neutral-300 dark:border-[#242424] opacity-60 hover:opacity-100'
                  }`}
                >
                  <img src={preset} className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] mb-1.5">Category</label>
              <Select
                defaultValue="Startups"
                onValueChange={(val) => setValue('category', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-xs font-bold text-neutral-600 dark:text-[#8A8A8A] mb-1.5">Project Stage</label>
              <Select
                defaultValue="Idea"
                onValueChange={(val) => setValue('stage', val)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select stage" />
                </SelectTrigger>
                <SelectContent>
                  {stages.map((s) => (
                    <SelectItem key={s} value={s}>{s}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <Textarea
            label="Project Description"
            placeholder="Explain what problem your project solves and your vision..."
            rows={4}
            {...register('description', { required: 'Description is required' })}
            error={errors.description?.message}
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input
              label="Looking for Roles"
              placeholder="e.g. Frontend Dev, UI/UX, Backend"
              {...register('looking_for_roles')}
            />
            <Input
              label="Max Team Size"
              type="number"
              min={2}
              max={20}
              {...register('max_members')}
            />
          </div>

          <Input
            label="Key Skills / Tech Stack"
            placeholder="e.g. Next.js, Python, PostgreSQL, Figma"
            {...register('required_skills')}
          />

          <div className="pt-4 flex items-center justify-end gap-3 border-t border-neutral-200 dark:border-[#242424]">
            <Link to="/projects">
              <Button variant="ghost" size="md">Cancel</Button>
            </Link>
            <Button type="submit" variant="primary" size="md" loading={loading} className="font-bold">
              Launch Project
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
