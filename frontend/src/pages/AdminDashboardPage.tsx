import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import {
  Shield,
  Users,
  Rocket,
  Calendar,
  MessageSquare,
  Trash2,
  CheckCircle2,
  Search,
  RefreshCw,
  ChevronRight
} from 'lucide-react';
import { api } from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { getInitials } from '@/lib/utils';

export const AdminDashboardPage: React.FC = () => {
  const { user } = useAuth();

  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'projects' | 'activities' | 'groups' | 'reports'>('overview');
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [notification, setNotification] = useState<string>('');

  // Stats
  const [stats, setStats] = useState<any>(null);

  // Entities
  const [userList, setUserList] = useState<any[]>([]);
  const [projectList, setProjectList] = useState<any[]>([]);
  const [activityList, setActivityList] = useState<any[]>([]);
  const [groupList, setGroupList] = useState<any[]>([]);
  const [reportList, setReportList] = useState<any[]>([]);

  // Filters & Search
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'active' | 'blocked' | 'admins'>('all');

  const showNotification = (msg: string) => {
    setNotification(msg);
    setTimeout(() => setNotification(''), 4000);
  };

  const fetchStats = async () => {
    try {
      const res = await api.get('/admin/stats');
      setStats(res.data);
    } catch (e) {
      console.error('Failed to load admin stats', e);
    }
  };

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/users', { params: { search: userSearch } });
      setUserList(res.data);
    } catch (e) {
      console.error('Failed to load users', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchProjects = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/projects');
      setProjectList(res.data);
    } catch (e) {
      console.error('Failed to load projects', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchActivities = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/activities');
      setActivityList(res.data);
    } catch (e) {
      console.error('Failed to load activities', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchGroups = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/groups');
      setGroupList(res.data);
    } catch (e) {
      console.error('Failed to load groups', e);
    } finally {
      setLoading(false);
    }
  };

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await api.get('/admin/reports');
      setReportList(res.data);
    } catch (e) {
      console.error('Failed to load reports', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStats();
  }, []);

  useEffect(() => {
    if (activeTab === 'users') fetchUsers();
    else if (activeTab === 'projects') fetchProjects();
    else if (activeTab === 'activities') fetchActivities();
    else if (activeTab === 'groups') fetchGroups();
    else if (activeTab === 'reports') fetchReports();
  }, [activeTab]);

  // Admin Actions: Users
  const handleToggleBlock = async (userId: string) => {
    setActionLoading(`block-${userId}`);
    try {
      const res = await api.put(`/admin/users/${userId}/block`);
      showNotification(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (e: any) {
      showNotification(e.response?.data?.error || 'Failed to toggle block');
    } finally {
      setActionLoading(null);
    }
  };

  const handleToggleRole = async (userId: string) => {
    setActionLoading(`role-${userId}`);
    try {
      const res = await api.put(`/admin/users/${userId}/role`);
      showNotification(res.data.message);
      fetchUsers();
    } catch (e: any) {
      showNotification(e.response?.data?.error || 'Failed to toggle role');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteUser = async (userId: string, username: string) => {
    if (!confirm(`Are you sure you want to permanently delete user @${username}? This action is irreversible.`)) return;
    setActionLoading(`delete-${userId}`);
    try {
      const res = await api.delete(`/admin/users/${userId}`);
      showNotification(res.data.message);
      fetchUsers();
      fetchStats();
    } catch (e: any) {
      showNotification(e.response?.data?.error || 'Failed to delete user');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeleteProject = async (projectId: string, title: string) => {
    if (!confirm(`Delete project "${title}" permanently?`)) return;
    try {
      const res = await api.delete(`/admin/projects/${projectId}`);
      showNotification(res.data.message);
      fetchProjects();
      fetchStats();
    } catch (e: any) {
      showNotification('Failed to delete project');
    }
  };

  const handleDeleteActivity = async (activityId: string, title: string) => {
    if (!confirm(`Delete activity "${title}" permanently?`)) return;
    try {
      const res = await api.delete(`/admin/activities/${activityId}`);
      showNotification(res.data.message);
      fetchActivities();
      fetchStats();
    } catch (e: any) {
      showNotification('Failed to delete activity');
    }
  };

  const handleDeleteGroup = async (groupId: string, name: string) => {
    if (!confirm(`Delete group guild "${name}" permanently?`)) return;
    try {
      const res = await api.delete(`/admin/groups/${groupId}`);
      showNotification(res.data.message);
      fetchGroups();
      fetchStats();
    } catch (e: any) {
      showNotification('Failed to delete group');
    }
  };

  const handleResolveReport = async (reportId: string) => {
    try {
      const res = await api.put(`/admin/reports/${reportId}/resolve`);
      showNotification(res.data.message);
      fetchReports();
      fetchStats();
    } catch (e: any) {
      showNotification('Failed to resolve report');
    }
  };

  const filteredUsers = userList.filter((u) => {
    if (userFilter === 'active') return u.is_active;
    if (userFilter === 'blocked') return !u.is_active;
    if (userFilter === 'admins') return u.is_admin;
    return true;
  });

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8 text-neutral-900 dark:text-white transition-colors duration-200">
      {/* Admin Header Banner */}
      <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl p-6 sm:p-8 shadow-2xl relative overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        <div className="space-y-2">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-amber-600 dark:text-amber-400 text-xs font-bold uppercase tracking-wider">
            <Shield className="w-3.5 h-3.5 text-amber-500 dark:text-amber-400" />
            Super Administrator Control Center
          </div>
          <h1 className="text-2xl sm:text-3xl font-black text-neutral-900 dark:text-white tracking-tight">
            WITHME PLATFORM ADMINISTRATION
          </h1>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-[#8A8A8A]">
            Root authority: user moderation, system metrics, content moderation, and safety reports.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              fetchStats();
              if (activeTab === 'users') fetchUsers();
            }}
          >
            <RefreshCw className="w-3.5 h-3.5 mr-1" />
            Refresh Data
          </Button>
          <div className="px-3.5 py-1.5 rounded-xl bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] text-xs text-neutral-700 dark:text-[#D4D4D4] font-mono">
            Admin: <span className="text-amber-600 dark:text-amber-400 font-bold">@{user?.username}</span>
          </div>
        </div>
      </div>

      {notification && (
        <div className="p-4 bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-2xl text-xs sm:text-sm text-neutral-900 dark:text-white font-medium flex items-center gap-2 animate-in fade-in shadow-xs">
          <CheckCircle2 className="w-5 h-5 text-amber-500 dark:text-amber-400 shrink-0" />
          {notification}
        </div>
      )}

      {/* Navigation Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-1 border-b border-neutral-200 dark:border-[#242424]">
        {[
          { id: 'overview', label: '📊 System Overview', count: null },
          { id: 'users', label: '👥 User Management', count: stats?.users?.total },
          { id: 'projects', label: '🚀 Projects', count: stats?.content?.projects },
          { id: 'activities', label: '🎯 Activities', count: stats?.content?.activities },
          { id: 'groups', label: '💬 Telegram Guilds', count: stats?.content?.groups },
          { id: 'reports', label: '🛡️ Safety Reports', count: stats?.safety?.pending_reports }
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id as any)}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition-all cursor-pointer whitespace-nowrap flex items-center gap-2 border shadow-xs ${
              activeTab === tab.id
                ? 'bg-neutral-900 text-white border-neutral-900 dark:bg-white dark:text-black dark:border-white'
                : 'bg-white text-neutral-600 hover:text-neutral-900 border-neutral-200 dark:bg-[#0F0F0F] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white dark:hover:bg-[#141414]'
            }`}
          >
            <span>{tab.label}</span>
            {tab.count !== null && tab.count !== undefined && (
              <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                activeTab === tab.id ? 'bg-white/20 text-white dark:bg-black/15 dark:text-black' : 'bg-neutral-100 text-neutral-600 dark:bg-[#141414] dark:text-[#8A8A8A]'
              }`}>
                {tab.count}
              </span>
            )}
          </button>
        ))}
      </div>

      {/* 1. OVERVIEW TAB */}
      {activeTab === 'overview' && stats && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A8A] mb-1">
                <span>Total Registered Users</span>
                <Users className="w-4 h-4 text-neutral-900 dark:text-white" />
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-white">{stats.users.total}</p>
              <div className="flex items-center gap-2 text-[11px] text-neutral-500 dark:text-[#8A8A8A] font-medium pt-1">
                <span className="text-neutral-900 dark:text-white font-bold">{stats.users.active} Active</span>
                <span>·</span>
                <span className="text-red-500 dark:text-red-400">{stats.users.blocked} Blocked</span>
              </div>
            </Card>

            <Card>
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A8A] mb-1">
                <span>Total Projects</span>
                <Rocket className="w-4 h-4 text-neutral-900 dark:text-white" />
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-white">{stats.content.projects}</p>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] pt-1">Active collaboration teams</p>
            </Card>

            <Card>
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A8A] mb-1">
                <span>Total Activities</span>
                <Calendar className="w-4 h-4 text-neutral-900 dark:text-white" />
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-white">{stats.content.activities}</p>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] pt-1">Live meetups & sessions</p>
            </Card>

            <Card>
              <div className="flex items-center justify-between text-xs text-neutral-500 dark:text-[#8A8A8A] mb-1">
                <span>Community Guilds</span>
                <MessageSquare className="w-4 h-4 text-amber-500 dark:text-amber-400" />
              </div>
              <p className="text-3xl font-black text-neutral-900 dark:text-white">{stats.content.groups}</p>
              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] pt-1">Real-time chat guilds</p>
            </Card>
          </div>

          {/* Quick Shortcuts */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div
              onClick={() => setActiveTab('users')}
              className="p-5 rounded-2xl bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] hover:border-neutral-400 dark:hover:border-[#383838] cursor-pointer transition-all space-y-2 group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900 dark:text-white">User Moderation Center</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:text-[#8A8A8A] dark:group-hover:text-white" />
              </div>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">
                Block abusers, promote administrators, view email addresses, and delete accounts permanently.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('projects')}
              className="p-5 rounded-2xl bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] hover:border-neutral-400 dark:hover:border-[#383838] cursor-pointer transition-all space-y-2 group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900 dark:text-white">Project & Content Control</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:text-[#8A8A8A] dark:group-hover:text-white" />
              </div>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">
                Delete spam projects, manage application vacancies, and maintain clean showcases.
              </p>
            </div>

            <div
              onClick={() => setActiveTab('reports')}
              className="p-5 rounded-2xl bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] hover:border-neutral-400 dark:hover:border-[#383838] cursor-pointer transition-all space-y-2 group shadow-xs"
            >
              <div className="flex items-center justify-between">
                <span className="font-bold text-sm text-neutral-900 dark:text-white">Safety & Incident Reports</span>
                <ChevronRight className="w-4 h-4 text-neutral-400 group-hover:text-neutral-900 dark:text-[#8A8A8A] dark:group-hover:text-white" />
              </div>
              <p className="text-xs text-neutral-500 dark:text-[#8A8A8A]">
                Review user safety reports, inappropriate messages, and anti-dating policy flags.
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 2. USERS TAB */}
      {activeTab === 'users' && (
        <div className="space-y-4">
          <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-xs">
            {/* Search Input */}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchUsers();
              }}
              className="relative flex-1 max-w-md"
            >
              <input
                type="text"
                placeholder="Search by username, email, name, or city..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="w-full bg-neutral-100 dark:bg-[#141414] border border-neutral-200 dark:border-[#242424] rounded-xl pl-9 pr-4 py-2 text-xs text-neutral-900 dark:text-white placeholder-neutral-400 dark:placeholder-neutral-500 focus:outline-none focus:border-neutral-400"
              />
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            </form>

            {/* Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar">
              {[
                { id: 'all', label: 'All Users' },
                { id: 'active', label: 'Active' },
                { id: 'blocked', label: 'Blocked / Banned' },
                { id: 'admins', label: 'Admins' }
              ].map((f) => (
                <button
                  key={f.id}
                  onClick={() => setUserFilter(f.id as any)}
                  className={`px-3 py-1 rounded-xl text-xs font-bold cursor-pointer whitespace-nowrap transition-colors shadow-xs ${
                    userFilter === f.id
                      ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                      : 'bg-neutral-100 text-neutral-600 border border-neutral-200 dark:bg-[#141414] dark:border-[#242424] dark:text-[#8A8A8A] dark:hover:text-white'
                  }`}
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          {/* User Table */}
          <div className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-neutral-700 dark:text-neutral-300">
                <thead className="bg-neutral-100 dark:bg-[#141414] text-neutral-600 dark:text-[#8A8A8A] uppercase font-bold text-[10px] tracking-wider border-b border-neutral-200 dark:border-[#242424]">
                  <tr>
                    <th className="px-5 py-4">User</th>
                    <th className="px-4 py-4">Email & Contact</th>
                    <th className="px-4 py-4">Location</th>
                    <th className="px-4 py-4">Status & Role</th>
                    <th className="px-4 py-4">Joined</th>
                    <th className="px-5 py-4 text-right">Admin Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-neutral-200 dark:divide-[#242424]">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="text-center py-10 text-neutral-400">
                        No users matching the criteria.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => (
                      <tr key={u.id} className="hover:bg-neutral-50 dark:hover:bg-[#141414]/50 transition-colors">
                        <td className="px-5 py-3.5">
                          <div className="flex items-center gap-3">
                            {u.profile?.avatar_url ? (
                              <img src={u.profile.avatar_url} className="w-9 h-9 rounded-full object-cover border border-neutral-200 dark:border-[#242424]" />
                            ) : (
                              <div className="w-9 h-9 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white font-bold text-xs flex items-center justify-center border border-neutral-300 dark:border-[#292929]">
                                {getInitials(u.profile?.display_name || u.username)}
                              </div>
                            )}
                            <div>
                              <p className="font-bold text-neutral-900 dark:text-white text-xs">
                                {u.profile?.display_name || u.username}
                              </p>
                              <p className="text-[11px] text-neutral-500 dark:text-[#8A8A8A] font-mono">@{u.username}</p>
                            </div>
                          </div>
                        </td>

                        <td className="px-4 py-3.5 font-mono text-[11px] text-neutral-600 dark:text-neutral-300">
                          <p>{u.email || '—'}</p>
                          {u.profile?.telegram && (
                            <p className="text-neutral-900 dark:text-white font-bold">{u.profile.telegram}</p>
                          )}
                        </td>

                        <td className="px-4 py-3.5 text-xs text-neutral-700 dark:text-neutral-300">
                          {u.profile?.city || 'Tashkent'}
                        </td>

                        <td className="px-4 py-3.5 space-y-1">
                          <div className="flex items-center gap-1.5">
                            {u.is_admin ? (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-900 text-white dark:bg-white dark:text-black text-[10px] font-bold">
                                🛡️ Admin
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-neutral-100 text-neutral-700 dark:bg-[#1F1F1F] dark:text-neutral-300 text-[10px] font-medium">
                                Member
                              </span>
                            )}

                            {u.is_active ? (
                              <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold">
                                Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 rounded-md bg-red-500/20 text-red-600 dark:text-red-400 font-bold text-[10px]">
                                🚫 Blocked
                              </span>
                            )}
                          </div>
                        </td>

                        <td className="px-4 py-3.5 text-neutral-500 dark:text-[#8A8A8A] text-[11px]">
                          {u.created_at ? new Date(u.created_at).toLocaleDateString() : '—'}
                        </td>

                        <td className="px-5 py-3.5 text-right">
                          <div className="flex items-center justify-end gap-1.5">
                            <button
                              onClick={() => handleToggleRole(u.id)}
                              disabled={actionLoading === `role-${u.id}` || u.id === user?.id}
                              className={`p-1.5 rounded-lg text-xs font-semibold cursor-pointer transition-colors ${
                                u.is_admin
                                  ? 'bg-neutral-900 text-white dark:bg-white dark:text-black'
                                  : 'bg-neutral-100 text-neutral-700 hover:bg-neutral-200 dark:bg-[#141414] dark:text-[#8A8A8A] dark:hover:text-white'
                              }`}
                              title={u.is_admin ? "Demote from Admin" : "Promote to Admin"}
                            >
                              <Shield className="w-3.5 h-3.5" />
                            </button>

                            <button
                              onClick={() => handleToggleBlock(u.id)}
                              disabled={actionLoading === `block-${u.id}` || u.id === user?.id}
                              className={`px-2.5 py-1.5 rounded-lg text-xs font-bold cursor-pointer transition-colors ${
                                u.is_active
                                  ? 'bg-amber-500/10 text-amber-600 hover:bg-amber-500/20'
                                  : 'bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20'
                              }`}
                            >
                              {u.is_active ? 'Block' : 'Unblock'}
                            </button>

                            <button
                              onClick={() => handleDeleteUser(u.id, u.username)}
                              disabled={actionLoading === `delete-${u.id}` || u.id === user?.id}
                              className="p-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-600 dark:text-red-400 cursor-pointer transition-colors"
                              title="Delete Account Permanently"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 3. PROJECTS TAB */}
      {activeTab === 'projects' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {projectList.map((proj) => (
              <div key={proj.id} className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="accent">{proj.category}</Badge>
                    <span className="text-xs text-neutral-500">Stage: {proj.stage}</span>
                  </div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{proj.title}</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{proj.description}</p>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Owner: @{proj.creator?.username || 'user'}</span>
                  <div className="flex items-center gap-2">
                    <Link to={`/projects/${proj.id}`} className="text-xs font-bold text-neutral-900 dark:text-white hover:underline">
                      View →
                    </Link>
                    <button
                      onClick={() => handleDeleteProject(proj.id, proj.title)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 cursor-pointer"
                      title="Delete Project as Admin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 4. ACTIVITIES TAB */}
      {activeTab === 'activities' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {activityList.map((act) => (
              <div key={act.id} className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <Badge variant="outline">{act.category}</Badge>
                    <span className="text-xs text-neutral-500 capitalize">{act.location_type}</span>
                  </div>
                  <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{act.title}</h3>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{act.description}</p>
                  <p className="text-[11px] text-neutral-500">📅 {act.event_date} {act.event_time}</p>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between">
                  <span className="text-[11px] text-neutral-500">Host: @{act.creator?.username || 'host'}</span>
                  <div className="flex items-center gap-2">
                    <Link to={`/activities/${act.id}`} className="text-xs font-bold text-neutral-900 dark:text-white hover:underline">
                      View →
                    </Link>
                    <button
                      onClick={() => handleDeleteActivity(act.id, act.title)}
                      className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 cursor-pointer"
                      title="Delete Activity as Admin"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 5. TELEGRAM GROUPS TAB */}
      {activeTab === 'groups' && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {groupList.map((grp) => (
              <div key={grp.id} className="bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-2xl p-5 space-y-3 flex flex-col justify-between shadow-xs">
                <div className="space-y-2">
                  <div className="flex items-center gap-3">
                    {grp.avatar_url ? (
                      <img src={grp.avatar_url} className="w-10 h-10 rounded-full object-cover border border-neutral-200 dark:border-[#242424]" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-neutral-200 text-neutral-900 dark:bg-[#1A1A1A] dark:text-white flex items-center justify-center font-bold text-xs border border-neutral-300 dark:border-[#292929]">
                        {getInitials(grp.name)}
                      </div>
                    )}
                    <div>
                      <h3 className="font-bold text-sm text-neutral-900 dark:text-white">{grp.name}</h3>
                      <p className="text-xs text-neutral-500">{grp.member_count} members · {grp.category}</p>
                    </div>
                  </div>
                  <p className="text-xs text-neutral-600 dark:text-neutral-400 line-clamp-2">{grp.description}</p>
                </div>

                <div className="pt-3 border-t border-neutral-200 dark:border-[#242424] flex items-center justify-between">
                  <Link to={`/groups/${grp.id}`} className="text-xs font-bold text-neutral-900 dark:text-white hover:underline">
                    Enter Chat Room →
                  </Link>
                  <button
                    onClick={() => handleDeleteGroup(grp.id, grp.name)}
                    className="p-1.5 rounded-lg bg-red-500/10 text-red-600 dark:text-red-400 hover:bg-red-500/20 cursor-pointer"
                    title="Delete Telegram Community"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* 6. REPORTS TAB */}
      {activeTab === 'reports' && (
        <div className="space-y-4">
          {reportList.length === 0 ? (
            <div className="text-center py-12 bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] rounded-3xl text-neutral-500 text-xs shadow-xs">
              <CheckCircle2 className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              <p>No safety or user violation reports currently filed.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {reportList.map((rep) => (
                <div key={rep.id} className="p-4 rounded-2xl bg-white dark:bg-[#0F0F0F] border border-neutral-200 dark:border-[#242424] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 shadow-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-red-600 dark:text-red-400 uppercase tracking-wider">{rep.reason}</span>
                      <span className={`text-[10px] px-2 py-0.2 rounded-full font-bold ${
                        rep.status === 'pending' ? 'bg-amber-500/20 text-amber-600 dark:text-amber-300' : 'bg-emerald-500/20 text-emerald-600 dark:text-emerald-300'
                      }`}>
                        {rep.status}
                      </span>
                    </div>
                    <p className="text-xs text-neutral-800 dark:text-neutral-200">
                      Reported user ID: <span className="font-mono text-neutral-900 dark:text-white font-bold">{rep.reported_user_id}</span>
                    </p>
                    <p className="text-xs text-neutral-600 dark:text-neutral-400">Details: "{rep.details || 'No extra notes'}"</p>
                  </div>

                  <div className="flex items-center gap-2">
                    {rep.status === 'pending' && (
                      <Button
                        variant="primary"
                        size="sm"
                        onClick={() => handleResolveReport(rep.id)}
                        className="text-xs font-bold"
                      >
                        Mark Resolved
                      </Button>
                    )}
                    <button
                      onClick={() => handleToggleBlock(rep.reported_user_id)}
                      className="px-3 py-1.5 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-600 dark:text-red-400 text-xs font-bold cursor-pointer"
                    >
                      Ban Offender
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};
