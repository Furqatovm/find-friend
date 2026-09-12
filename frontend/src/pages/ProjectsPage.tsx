import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Rocket, Plus } from 'lucide-react';
import { useQuery } from '@tanstack/react-query';
import { getProjects } from '@/api';
import { ProjectCard } from '@/components/cards/ProjectCard';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/Select';
import { EmptyState } from '@/components/common/EmptyState';
import { UserCardSkeleton } from '@/components/ui/Skeleton';
import type { Project } from '@/types';

const CATEGORIES = ['All', 'Startups', 'Game Dev', 'Open Source', 'AI', 'EdTech'];
const STAGES = ['All', 'Idea', 'Prototype', 'MVP', 'Launched'];

export const ProjectsPage: React.FC = () => {
  const [category, setCategory] = useState('All');
  const [stage, setStage] = useState('All');

  const { data: projects = [], isLoading, refetch } = useQuery<Project[]>({
    queryKey: ['projects', category, stage],
    queryFn: ({ signal }) =>
      getProjects({ category, stage }, signal),
  });

  return (
    <div className="min-h-screen bg-[#000]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-white">Collaborative Projects</h1>
            <p className="text-xs text-[#555] mt-1">
              Find co-founders, designers, and developers to build real products
            </p>
          </div>
          <Link
            to="/projects/create"
            className="inline-flex items-center gap-1.5 px-4 py-2 rounded-[10px] bg-[#FFAA2B] hover:bg-[#FFB83D] text-black text-sm font-bold transition-all shrink-0"
          >
            <Plus className="w-4 h-4" />
            Create Project
          </Link>
        </div>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
          {/* Category pills */}
          <div className="flex items-center gap-2 overflow-x-auto pb-1 no-scrollbar flex-1">
            {CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                onClick={() => setCategory(cat)}
                className={`px-3.5 py-1.5 rounded-[20px] text-xs font-semibold whitespace-nowrap transition-all cursor-pointer border ${
                  category === cat
                    ? 'bg-[#FFAA2B] text-black border-[#FFAA2B]'
                    : 'bg-transparent text-[#8A8A8A] border-[#292929] hover:text-white hover:border-[#3D3D3D]'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>

          {/* Stage select */}
          <div className="shrink-0 w-36">
            <Select value={stage} onValueChange={setStage}>
              <SelectTrigger className="h-8 text-xs">
                <SelectValue placeholder="Stage" />
              </SelectTrigger>
              <SelectContent>
                {STAGES.map((s) => (
                  <SelectItem key={s} value={s}>{s === 'All' ? 'All Stages' : s}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Grid */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((i) => <UserCardSkeleton key={i} />)}
          </div>
        ) : projects.length === 0 ? (
          <EmptyState
            icon={<Rocket className="w-8 h-8 text-[#555]" />}
            title="No projects found"
            description="Have an idea? Create a project and find your teammates!"
          />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map((proj) => (
              <ProjectCard key={proj.id} project={proj} onUpdate={refetch} />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
