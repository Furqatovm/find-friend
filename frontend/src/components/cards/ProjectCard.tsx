import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, Check } from 'lucide-react';
import { Card } from '../ui/Card';
import { Badge } from '../ui/Badge';
import { Button } from '../ui/Button';
import { getCategoryBadgeColor, getInitials } from '@/lib/utils';
import { api } from '@/lib/api';
import type { Project } from '@/types';

interface ProjectCardProps {
  project: Project;
  onUpdate?: () => void;
}

export const ProjectCard: React.FC<ProjectCardProps> = ({ project, onUpdate }) => {
  const [isMember, setIsMember] = useState(project.is_member || false);
  const [memberCount, setMemberCount] = useState(project.member_count || 1);
  const [loading, setLoading] = useState(false);

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

  return (
    <Card hover className="flex flex-col justify-between h-full group overflow-hidden">
      <div>
        {/* Optional Cover Banner */}
        {project.image_url && (
          <div className="-mx-5 -mt-5 mb-4 h-32 overflow-hidden border-b border-neutral-200 dark:border-[#242424]">
            <img
              src={project.image_url}
              alt={project.title}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          </div>
        )}

        {/* Stage and Category */}
        <div className="flex items-center justify-between gap-2 mb-3">
          <Badge className={getCategoryBadgeColor(project.category)}>
            {project.category}
          </Badge>
          <span className="text-[11px] font-medium px-2 py-0.5 rounded-md border border-neutral-200 dark:border-[#242424] bg-neutral-100 dark:bg-[#141414] text-neutral-700 dark:text-[#D4D4D4]">
            {project.stage}
          </span>
        </div>

        {/* Title & Description */}
        <Link to={`/projects/${project.id}`}>
          <h4 className="font-bold text-neutral-900 dark:text-white text-sm transition-colors line-clamp-1 mb-1.5">
            {project.title}
          </h4>
        </Link>
        <p className="text-xs text-neutral-600 dark:text-[#D4D4D4] line-clamp-2 mb-4 leading-relaxed">
          {project.description}
        </p>

        {/* Looking for roles */}
        <div className="mb-4">
          <p className="text-[11px] font-bold text-amber-600 dark:text-amber-400 mb-1.5 flex items-center gap-1.5">
            <Briefcase className="w-3.5 h-3.5" />
            Looking for:
          </p>
          <div className="flex flex-wrap gap-1.5">
            {project.looking_for_roles?.slice(0, 3).map((role, i) => (
              <span key={i} className="text-xs px-2.5 py-0.5 rounded-md bg-neutral-100 dark:bg-[#141414] text-neutral-800 dark:text-[#E5E5E5] border border-neutral-200 dark:border-[#242424] font-medium">
                {role}
              </span>
            ))}
          </div>
        </div>

        {/* Required skills */}
        {project.required_skills && project.required_skills.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-4">
            {project.required_skills.slice(0, 3).map((skill, i) => (
              <span key={i} className="text-[11px] text-neutral-500 dark:text-[#8A8A8A]">
                #{skill}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="pt-3 border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between gap-2 mt-auto">
        <div className="flex items-center gap-2">
          <div className="flex -space-x-1.5 overflow-hidden">
            {project.members?.slice(0, 3).map((m, i) => (
              m.user?.avatar_url ? (
                <img
                  key={i}
                  src={m.user.avatar_url}
                  alt={m.user.display_name}
                  className="w-6 h-6 rounded-full ring-2 ring-white dark:ring-[#0F0F0F] object-cover"
                />
              ) : (
                <div key={i} className="w-6 h-6 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white text-[9px] font-bold flex items-center justify-center ring-2 ring-white dark:ring-[#0F0F0F]">
                  {getInitials(m.user?.display_name || 'U')}
                </div>
              )
            ))}
          </div>
          <span className="text-xs text-neutral-500 dark:text-[#8A8A8A]">
            <strong className="text-neutral-900 dark:text-white font-bold">{memberCount}</strong> / {project.max_members} members
          </span>
        </div>

        <div className="flex items-center gap-2">
          <Link to={`/projects/${project.id}`}>
            <Button variant="ghost" size="sm" className="text-xs">
              View
            </Button>
          </Link>
          <Button
            variant={isMember ? 'outline' : 'primary'}
            size="sm"
            loading={loading}
            onClick={handleJoin}
            className="text-xs font-bold"
          >
            {isMember ? (
              <>
                <Check className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                Joined
              </>
            ) : (
              'Apply / Join'
            )}
          </Button>
        </div>
      </div>
    </Card>
  );
};
