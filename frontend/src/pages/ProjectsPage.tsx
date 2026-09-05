import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Plus } from 'lucide-react';
import { api } from '@/lib/api';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { Button } from '@/components/ui/Button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { Project } from '@/types';

export const ProjectsPage: React.FC = () => {
  const [projects, setProjects] = useState<Project[]>([]);
  const [category, setCategory] = useState('All');
  const [stage, setStage] = useState('All');
  const [loading, setLoading] = useState(true);

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (category !== 'All') params.category = category;
      if (stage !== 'All') params.stage = stage;

      const res = await api.get('/projects', { params });
      setProjects(res.data);
    } catch (err) {
      console.error('Failed to load projects', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProjects();
  }, [category, stage]);

  const categories = ['All', 'Startups', 'Game Dev', 'Open Source', 'AI', 'EdTech'];
  const stages = ['All', 'Idea', 'Prototype', 'MVP', 'Launched'];

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-black text-neutral-900 dark:text-white tracking-tight">COLLABORATIVE PROJECTS</h1>
          <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-1">
            Find technical co-founders, UI/UX designers, developers, and creators to build real products.
          </p>
        </div>

        <Link to="/projects/create">
          <Button variant="primary" size="md" className="font-bold">
            <Plus className="w-4 h-4 mr-1.5" />
            Start a Project
          </Button>
        </Link>
      </div>

      {/* Filter Bar */}
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 shadow-sm">
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
          {categories.map((c) => (
            <button
              key={c}
              type="button"
              onClick={() => setCategory(c)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold border transition-all cursor-pointer whitespace-nowrap shadow-xs ${
                category === c
                  ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
                  : 'bg-neutral-100 text-neutral-600 hover:text-neutral-900 border-neutral-200 dark:bg-[#141414] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-2 min-w-[140px]">
          <span className="text-xs text-neutral-500 dark:text-[#8A8A8A] font-medium shrink-0">Stage:</span>
          <Select value={stage} onValueChange={setStage}>
            <SelectTrigger className="h-9 text-xs">
              <SelectValue placeholder="Select stage" />
            </SelectTrigger>
            <SelectContent>
              {stages.map((s) => (
                <SelectItem key={s} value={s}>
                  {s}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Projects Grid */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {[1, 2, 3].map((i) => (
            <UserCardSkeleton key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <EmptyState
          icon={<Rocket className="w-8 h-8 text-neutral-400 dark:text-[#5C5C5C]" />}
          title="No projects found"
          description="Have an idea for a tool, startup, or game? Create a project and find teammates!"
          actionLabel="Create a Project"
          onAction={() => {}}
        />
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {projects.map((proj) => (
            <ProjectCard key={proj.id} project={proj} onUpdate={fetchProjects} />
          ))}
        </div>
      )}
    </div>
  );
};
