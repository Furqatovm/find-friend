import { api } from '@/lib/api';
import type { Group } from '@/types';

export interface GroupFilterParams {
  category?: string;
  search?: string;
  page?: number;
  limit?: number;
}

export const getGroups = async (
  params?: GroupFilterParams,
  signal?: AbortSignal
): Promise<Group[]> => {
  const cleanParams: Record<string, any> = {};
  if (params) {
    if (params.category && params.category !== 'All') cleanParams.category = params.category;
    if (params.search) cleanParams.search = params.search;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
  }
  const res = await api.get<Group[]>('/groups', {
    params: cleanParams,
    signal,
  });
  return res.data || [];
};

export const getGroup = async (
  id: string | number,
  signal?: AbortSignal
): Promise<Group> => {
  const res = await api.get<Group>(`/groups/${id}`, { signal });
  return res.data;
};

export const createGroup = async (
  data: Partial<Group>
): Promise<Group> => {
  const res = await api.post<Group>('/groups', data);
  return res.data;
};

export const updateGroup = async (
  id: string | number,
  data: Partial<Group>
): Promise<Group> => {
  const res = await api.put<Group>(`/groups/${id}`, data);
  return res.data;
};

export const deleteGroup = async (
  id: string | number
): Promise<void> => {
  await api.delete(`/groups/${id}`);
};

export const joinGroup = async (
  id: string | number
): Promise<{ success: boolean; message?: string }> => {
  const res = await api.post(`/groups/${id}/join`);
  return res.data;
};

export const leaveGroup = async (
  id: string | number
): Promise<{ success: boolean; message?: string }> => {
  const res = await api.delete(`/groups/${id}/join`);
  return res.data;
};

export const createGroupPoll = async (
  groupId: string | number,
  data: { question: string; options: string[]; is_anonymous?: boolean }
): Promise<any> => {
  const res = await api.post(`/groups/${groupId}/polls`, data);
  return res.data;
};

export const voteGroupPoll = async (
  groupId: string | number,
  pollId: string | number,
  optionId: number
): Promise<any> => {
  const res = await api.post(`/groups/${groupId}/polls/${pollId}/vote`, { option_id: optionId });
  return res.data;
};
