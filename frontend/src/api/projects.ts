import { api } from '@/lib/api';
import type { Project } from '@/types';

export interface ProjectFilterParams {
  category?: string;
  stage?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getProjects = async (
  params?: ProjectFilterParams,
  signal?: AbortSignal
): Promise<Project[]> => {
  const cleanParams: Record<string, any> = {};
  if (params) {
    if (params.category && params.category !== 'All') cleanParams.category = params.category;
    if (params.stage && params.stage !== 'All') cleanParams.stage = params.stage;
    if (params.search) cleanParams.search = params.search;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
  }
  const res = await api.get<Project[]>('/projects', {
    params: cleanParams,
    signal,
  });
  return res.data || [];
};

export const getProject = async (
  id: string | number,
  signal?: AbortSignal
): Promise<Project> => {
  const res = await api.get<Project>(`/projects/${id}`, { signal });
  return res.data;
};

export const createProject = async (
  data: Partial<Project>
): Promise<Project> => {
  const res = await api.post<Project>('/projects', data);
  return res.data;
};

export const updateProject = async (
  id: string | number,
  data: Partial<Project>
): Promise<Project> => {
  const res = await api.put<Project>(`/projects/${id}`, data);
  return res.data;
};

export const deleteProject = async (
  id: string | number
): Promise<void> => {
  await api.delete(`/projects/${id}`);
};

export const joinProject = async (
  id: string | number,
  role?: string
): Promise<{ success: boolean }> => {
  const res = await api.post(`/projects/${id}/join`, { role });
  return res.data;
};

export const leaveProject = async (
  id: string | number
): Promise<{ success: boolean }> => {
  const res = await api.delete(`/projects/${id}/join`);
  return res.data;
};
