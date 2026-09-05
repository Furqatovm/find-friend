import React, { useState, useEffect } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Briefcase,
  Check,
  ArrowLeft,
  Layers,
  Pencil,
  Trash2,
  Plus,
  MessageSquare,
  Users,
  AlertTriangle
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useNotification } from '@/context/NotificationContext';
import { Button } from '@/components/ui/Button';
import { Badge } from '@/components/ui/Badge';
import { Card } from '@/components/ui/Card';
import { Dialog } from '@/components/ui/Dialog';
import { getCategoryBadgeColor, getInitials } from '@/lib/utils';
import { EditProjectModal } from '@/components/projects/EditProjectModal';
import { CreateProjectGroupModal } from '@/components/projects/CreateProjectGroupModal';
import { EditGroupModal } from '@/components/groups/EditGroupModal';
import type { Project, Group } from '@/types';

export const ProjectDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { notify } = useNotification();

  const [project, setProject] = useState<Project | null>(null);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);

  // Modals state
  const [showEditProject, setShowEditProject] = useState(false);
  const [showDeleteProject, setShowDeleteProject] = useState(false);
  const [deleteProjectLoading, setDeleteProjectLoading] = useState(false);

  const [showCreateGroup, setShowCreateGroup] = useState(false);
  const [editingGroup, setEditingGroup] = useState<Group | null>(null);
  const [deletingGroup, setDeletingGroup] = useState<Group | null>(null);
  const [deleteGroupLoading, setDeleteGroupLoading] = useState(false);

  const fetchDetail = async () => {
    if (!id) return;
    setLoading(true);
    try {
      const res = await api.get(`/projects/${id}`);
      setProject(res.data);
    } catch (err) {
      console.error('Failed to load project detail', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [id]);

  const handleToggleJoin = async () => {
    if (!project) return;
    setActionLoading(true);
    try {
      if (project.is_member) {
        await api.delete(`/projects/${project.id}/leave`);
        notify.info('Left Team', `You left "${project.title}".`);
      } else {
        await api.post(`/projects/${project.id}/join`, { role: 'Contributor' });
        notify.success('Joined Team!', `You are now a team member of "${project.title}".`);
      }
      await fetchDetail();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to update project membership');
    } finally {
      setActionLoading(false);
    }
  };

  const handleDeleteProject = async () => {
    if (!project) return;
    setDeleteProjectLoading(true);
    try {
      await api.delete(`/projects/${project.id}`);
      notify.success('Project Deleted', `"${project.title}" has been permanently removed.`);
      setShowDeleteProject(false);
      navigate('/projects');
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to delete project');
    } finally {
      setDeleteProjectLoading(false);
    }
  };

  const handleDeleteGroup = async () => {
    if (!deletingGroup) return;
    setDeleteGroupLoading(true);
    const groupName = deletingGroup.name;
    try {
      await api.delete(`/groups/${deletingGroup.id}`);
      notify.success('Group Deleted', `Group "${groupName}" was deleted.`);
      setDeletingGroup(null);
      await fetchDetail();
    } catch (err: any) {
      notify.error(err.response?.data?.error || 'Failed to delete group');
    } finally {
      setDeleteGroupLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 py-16 text-center text-neutral-500 dark:text-[#8A8A8A]">
        <p className="text-xs">Loading project details...</p>
      </div>
    );
  }

  if (!project) {
    return (
      <div className="max-w-md mx-auto px-4 py-16 text-center text-neutral-900 dark:text-white">
        <p className="text-sm text-neutral-500 dark:text-[#8A8A8A]">Project not found.</p>
        <Link to="/projects" className="mt-4 inline-block">
          <Button variant="primary" size="sm">Back to Projects</Button>
        </Link>
      </div>
    );
  }

  const isCreator = Boolean(project.is_creator || (user && user.id === project.creator_id));
  const canParticipate = isCreator || project.is_member;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Back button */}
      <Link to="/projects" className="inline-flex items-center gap-1.5 text-xs text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white transition-colors">
        <ArrowLeft className="w-4 h-4" />
        Back to all projects
      </Link>

      {/* Main Header Card */}
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-6 sm:p-8 shadow-xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Badge className={getCategoryBadgeColor(project.category)}>
              {project.category}
            </Badge>
            <span className="text-xs px-2.5 py-1 rounded-lg bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-neutral-700 dark:text-[#D4D4D4] font-medium">
              Stage: {project.stage}
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Team Chat Link */}
            {project.groups && project.groups.length > 0 ? (
              <Link to={`/groups/${project.groups[0].id}`}>
                <Button
                  variant="outline"
                  size={isCreator ? "sm" : "md"}
                  className="font-bold text-xs flex items-center gap-1.5 shadow-xs"
                  title="Open Project Chat Group"
                >
                  <MessageSquare className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                  <span>Team Chat {project.groups.length > 1 ? `(${project.groups.length})` : ''}</span>
                </Button>
              </Link>
            ) : (
              <Button
                variant="outline"
                size={isCreator ? "sm" : "md"}
                onClick={() => setShowCreateGroup(true)}
                className="font-bold text-xs flex items-center gap-1.5 shadow-xs"
                title="Create Chat Group for this Project"
              >
                <MessageSquare className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
                <span>Create Chat</span>
              </Button>
            )}

            {/* Creator Actions */}
            {isCreator && (
              <>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setShowEditProject(true)}
                  className="font-bold text-xs"
                >
                  <Pencil className="w-3.5 h-3.5 mr-1" />
                  Edit Project
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowDeleteProject(true)}
                  className="text-red-500 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 text-xs font-bold"
                >
                  <Trash2 className="w-3.5 h-3.5 mr-1" />
                  Delete
                </Button>
              </>
            )}

            {!isCreator && (
              <Button
                variant={project.is_member ? 'outline' : 'primary'}
                size="md"
                loading={actionLoading}
                onClick={handleToggleJoin}
                className="font-bold"
              >
                {project.is_member ? (
                  <>
                    <Check className="w-4 h-4 mr-1 text-emerald-500" />
                    Joined Team
                  </>
                ) : (
                  'Apply / Join Team'
                )}
              </Button>
            )}
          </div>
        </div>

        <div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight mb-2">
            {project.title}
          </h1>
          <p className="text-xs sm:text-sm text-neutral-700 dark:text-[#D4D4D4] leading-relaxed whitespace-pre-line">
            {project.description}
          </p>
        </div>

        {/* Roles needed & Goals */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-4 border-t border-neutral-200 dark:border-[#242424]">
          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] space-y-2">
            <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Briefcase className="w-4 h-4 text-neutral-900 dark:text-white" />
              Roles Looking For
            </p>
            <div className="flex flex-wrap gap-1.5">
              {project.looking_for_roles?.map((r, i) => (
                <span key={i} className="text-xs px-2.5 py-1 rounded-lg bg-white dark:bg-[#1F1F1F] text-neutral-900 dark:text-white border border-neutral-200 dark:border-[#2E2E2E] font-medium shadow-xs">
                  {r}
                </span>
              ))}
            </div>
          </div>

          <div className="p-4 rounded-2xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] space-y-2">
            <p className="text-xs font-bold text-neutral-900 dark:text-white flex items-center gap-1.5">
              <Layers className="w-4 h-4 text-neutral-900 dark:text-white" />
              Project Goals & Milestones
            </p>
            <p className="text-xs text-neutral-600 dark:text-[#D4D4D4] leading-relaxed">
              {project.goals || 'Build functional prototype and launch to early users.'}
            </p>
          </div>
        </div>
      </div>

      {/* Project Chat Groups Section */}
      <Card>
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-neutral-200 dark:border-[#242424]">
          <div>
            <h3 className="text-sm font-bold text-neutral-900 dark:text-white flex items-center gap-2">
              <MessageSquare className="w-4 h-4 text-primary" />
              Project Chat Groups & Channels ({project.groups?.length || 0})
            </h3>
            <p className="text-xs text-neutral-500 dark:text-[#8A8A8A] mt-0.5">
              Collaborative group chats and discussion rooms for project teammates.
            </p>
          </div>

          {canParticipate && (
            <Button
              variant="primary"
              size="sm"
              onClick={() => setShowCreateGroup(true)}
              className="font-bold text-xs"
            >
              <Plus className="w-3.5 h-3.5 mr-1" />
              New Chat Group
            </Button>
          )}
        </div>

        {(!project.groups || project.groups.length === 0) ? (
          <div className="text-center py-8 px-4 border border-dashed border-neutral-200 dark:border-[#282828] rounded-2xl bg-neutral-50/50 dark:bg-[#141414]/50 space-y-3">
            <div className="w-12 h-12 rounded-full bg-neutral-200 dark:bg-[#202020] text-neutral-500 dark:text-[#8A8A8A] flex items-center justify-center mx-auto">
              <MessageSquare className="w-6 h-6" />
            </div>
            <div>
              <p className="text-xs font-bold text-neutral-900 dark:text-white">No Chat Groups Yet</p>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] mt-0.5 max-w-sm mx-auto">
                Create a chat group for this project to brainstorm ideas, plan deliverables, and chat with team members in real time.
              </p>
            </div>
            {canParticipate && (
              <Button
                variant="outline"
                size="sm"
                onClick={() => setShowCreateGroup(true)}
                className="font-bold text-xs"
              >
                <Plus className="w-3.5 h-3.5 mr-1" />
                Create First Group Chat
              </Button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {project.groups.map((group) => {
              const canManageGroup = isCreator || group.is_creator || (user && user.id === group.creator_id);

              return (
                <div
                  key={group.id}
                  className="flex flex-col justify-between p-4 rounded-2xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] hover:border-neutral-300 dark:hover:border-[#383838] transition-all space-y-3"
                >
                  <div>
                    <div className="flex items-start justify-between gap-2 mb-1.5">
                      <div className="min-w-0">
                        <Link
                          to={`/groups/${group.id}`}
                          className="font-bold text-xs sm:text-sm text-neutral-900 dark:text-white hover:underline truncate block"
                        >
                          {group.name}
                        </Link>
                        <span className="text-[10px] text-neutral-500 dark:text-[#8A8A8A] flex items-center gap-1 mt-0.5">
                          <Users className="w-3 h-3 text-neutral-400" />
                          {group.member_count} members
                        </span>
                      </div>

                      <Badge className={getCategoryBadgeColor(group.category)}>
                        {group.category}
                      </Badge>
                    </div>

                    <p className="text-xs text-neutral-600 dark:text-[#D4D4D4] line-clamp-2 leading-relaxed">
                      {group.description}
                    </p>
                  </div>

                  <div className="flex items-center justify-between pt-2 border-t border-neutral-200 dark:border-[#242424]">
                    <div className="flex items-center gap-1">
                      {canManageGroup && (
                        <>
                          <button
                            type="button"
                            onClick={() => setEditingGroup(group)}
                            className="p-1.5 text-neutral-500 hover:text-neutral-900 dark:text-[#8A8A8A] dark:hover:text-white rounded-lg hover:bg-neutral-200 dark:hover:bg-[#202020] transition-colors"
                            title="Edit group"
                          >
                            <Pencil className="w-3.5 h-3.5" />
                          </button>
                          <button
                            type="button"
                            onClick={() => setDeletingGroup(group)}
                            className="p-1.5 text-red-500 hover:text-red-600 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                            title="Delete group"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </>
                      )}
                    </div>

                    <Link to={`/groups/${group.id}`}>
                      <Button variant="primary" size="sm" className="text-xs font-bold py-1">
                        <MessageSquare className="w-3.5 h-3.5 mr-1" />
                        Open Chat
                      </Button>
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Team Roster */}
      <Card>
        <h3 className="text-sm font-bold text-neutral-900 dark:text-white mb-4 flex items-center justify-between">
          <span>Project Team ({project.members?.length || 0} / {project.max_members})</span>
        </h3>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {project.members?.map((m) => (
            <Link
              key={m.user_id}
              to={`/users/${m.user_id}`}
              className="flex items-center justify-between p-3 rounded-xl bg-neutral-50 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] hover:border-neutral-300 dark:hover:border-[#383838] transition-colors"
            >
              <div className="flex items-center gap-3">
                {m.user?.avatar_url ? (
                  <img src={m.user.avatar_url} className="w-9 h-9 rounded-full object-cover border border-neutral-300 dark:border-[#292929]" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white border border-neutral-300 dark:border-[#292929] flex items-center justify-center text-xs font-bold">
                    {getInitials(m.user?.display_name || 'U')}
                  </div>
                )}
                <div>
                  <p className="font-bold text-xs text-neutral-900 dark:text-white">{m.user?.display_name || 'Member'}</p>
                  <p className="text-[10px] text-neutral-500 dark:text-[#8A8A8A]">@{m.user?.username}</p>
                </div>
              </div>

              <span className="text-[11px] px-2 py-0.5 rounded-md font-bold bg-neutral-200 text-neutral-700 dark:bg-[#1F1F1F] dark:text-[#D4D4D4] border border-neutral-300 dark:border-[#2E2E2E]">
                {m.role}
              </span>
            </Link>
          ))}
        </div>
      </Card>

      {/* Edit Project Modal */}
      {showEditProject && project && (
        <EditProjectModal
          isOpen={showEditProject}
          onClose={() => setShowEditProject(false)}
          project={project}
          onSuccess={(updated) => {
            setProject(updated);
            notify.success('Project Updated', `Changes to "${updated.title}" have been saved.`);
            fetchDetail();
          }}
        />
      )}

      {/* Delete Project Confirmation Dialog */}
      <Dialog
        isOpen={showDeleteProject}
        onClose={() => setShowDeleteProject(false)}
        title="Delete Project"
        description="Are you sure you want to delete this project? This action cannot be undone and will delete all associated project groups and team memberships."
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This will permanently delete "{project.title}".</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setShowDeleteProject(false)}
              disabled={deleteProjectLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={deleteProjectLoading}
              onClick={handleDeleteProject}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Delete Permanently
            </Button>
          </div>
        </div>
      </Dialog>

      {/* Create Project Group Modal */}
      {showCreateGroup && project && (
        <CreateProjectGroupModal
          isOpen={showCreateGroup}
          onClose={() => setShowCreateGroup(false)}
          projectId={project.id}
          projectTitle={project.title}
          onSuccess={(newGroup) => {
            notify.group('Group Created!', `"${newGroup.name}" is now ready for chatting.`, `/groups/${newGroup.id}`);
            fetchDetail();
          }}
        />
      )}

      {/* Edit Project Group Modal */}
      {editingGroup && (
        <EditGroupModal
          isOpen={Boolean(editingGroup)}
          onClose={() => setEditingGroup(null)}
          group={editingGroup}
          onSuccess={(updated) => {
            notify.success('Group Updated', `"${updated.name}" settings were updated.`);
            fetchDetail();
          }}
        />
      )}

      {/* Delete Project Group Confirmation Dialog */}
      <Dialog
        isOpen={Boolean(deletingGroup)}
        onClose={() => setDeletingGroup(null)}
        title="Delete Project Group"
        description={`Are you sure you want to delete "${deletingGroup?.name}"? All chat messages, polls, and media in this channel will be permanently removed.`}
        maxWidth="max-w-md"
      >
        <div className="p-6 space-y-4">
          <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl text-xs text-red-600 dark:text-red-400 font-medium flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 shrink-0" />
            <span>This action cannot be undone.</span>
          </div>

          <div className="flex items-center justify-end gap-2 pt-2">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setDeletingGroup(null)}
              disabled={deleteGroupLoading}
            >
              Cancel
            </Button>
            <Button
              type="button"
              variant="primary"
              size="sm"
              loading={deleteGroupLoading}
              onClick={handleDeleteGroup}
              className="bg-red-600 hover:bg-red-700 text-white font-bold"
            >
              Delete Group
            </Button>
          </div>
        </div>
      </Dialog>
    </div>
  );
};
