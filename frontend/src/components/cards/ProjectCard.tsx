import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Rocket, ExternalLink } from 'lucide-react';
import { api } from '@/lib/api';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onUpdate?: () => void;
}

const stageColors: Record<string, string> = {
  Idea:      'bg-[#1A1A1A] text-[#8A8A8A] border-[#2A2A2A]',
  Prototype: 'bg-blue-500/10 text-blue-400 border-blue-500/20',
  MVP:       'bg-[#FFAA2B]/10 text-[#FFAA2B] border-[#FFAA2B]/20',
  Launched:  'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
};

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate }) => {
  const [isMember, setIsMember] = useState(project.is_member || false);
  const [memberCount, setMemberCount] = useState(project.member_count || 1);
  const [loading, setLoading] = useState(false);

  const isFull = memberCount >= project.max_members;
  const isCreator = project.is_creator || false;

  const handleJoin = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setLoading(true);
    try {
      if (isMember) {
        await api.delete(`/projects/${project.id}/leave`);
        setIsMember(false);
        setMemberCount((c) => Math.max(1, c - 1));
      } else {
        await api.post(`/projects/${project.id}/join`, { role: 'Contributor' });
        setIsMember(true);
        setMemberCount((c) => c + 1);
      }
      if (onUpdate) onUpdate();
    } catch (err) {
      console.error('Failed to update project membership', err);
    } finally {
      setLoading(false);
    }
  };

  const stageClass = stageColors[project.stage] || stageColors.Idea;

  return (
    <div className="group bg-[#141414] border border-[#292929] rounded-[12px] p-4 flex flex-col gap-3 transition-all duration-200 hover:border-[#383838] hover:-translate-y-px">
      {/* Stage + category */}
      <div className="flex items-center gap-2 flex-wrap">
        <span className={`inline-flex items-center px-2 py-0.5 rounded-[5px] border text-[11px] font-medium ${stageClass}`}>
          {project.stage}
        </span>
        <span className="inline-flex items-center px-2 py-0.5 rounded-[5px] bg-[#1A1A1A] border border-[#2A2A2A] text-[11px] text-[#666] font-medium">
          {project.category}
        </span>
      </div>

      {/* Title + description */}
      <div>
        <Link to={`/projects/${project.id}`}>
          <h4 className="font-semibold text-white text-sm leading-snug mb-1 hover:text-[#FFAA2B] transition-colors line-clamp-2">
            {project.title}
          </h4>
        </Link>
        {project.description && (
          <p className="text-xs text-[#8A8A8A] line-clamp-2 leading-relaxed">
            {project.description}
          </p>
        )}
      </div>

      {/* Looking for roles */}
      {project.looking_for_roles && project.looking_for_roles.length > 0 && (
        <div>
          <p className="text-[10px] text-[#555] uppercase tracking-wider font-semibold mb-1.5">Looking for</p>
          <div className="flex flex-wrap gap-1.5">
            {project.looking_for_roles.slice(0, 3).map((role, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[5px] bg-[#1A1A1A] border border-[#2A2A2A] text-[11px] text-[#D4D4D4] font-medium"
              >
                <Rocket className="w-2.5 h-2.5 text-[#FFAA2B]" />
                {role}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Member count */}
      <div className="flex items-center gap-1 text-[11px] text-[#666]">
        <Users className="w-3 h-3" />
        {memberCount} / {project.max_members} members
      </div>

      {/* Action */}
      <div className="mt-auto pt-1">
        {isCreator ? (
          <Link
            to={`/projects/${project.id}`}
            className="flex items-center justify-center gap-1.5 w-full h-8 rounded-[8px] border border-[#292929] hover:border-[#3D3D3D] text-[#D4D4D4] hover:text-white hover:bg-[#1A1A1A] text-xs font-medium transition-all"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Manage
          </Link>
        ) : isMember ? (
          <Link
            to={`/projects/${project.id}`}
            className="flex items-center justify-center w-full h-8 rounded-[8px] bg-[#1A1A1A] border border-[#2A2A2A] text-[#D4D4D4] hover:text-white text-xs font-medium transition-all"
          >
            View Project
          </Link>
        ) : (
          <button
            type="button"
            onClick={handleJoin}
            disabled={loading || isFull}
            className={`w-full h-8 rounded-[8px] text-xs font-semibold transition-all cursor-pointer ${
              isFull
                ? 'bg-[#141414] border border-[#292929] text-[#555] cursor-not-allowed'
                : 'bg-[#FFAA2B] hover:bg-[#FFB83D] text-black'
            }`}
          >
            {isFull ? 'Full' : 'View Project'}
          </button>
        )}
      </div>
    </div>
  );
};
