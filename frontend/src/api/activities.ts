import { api } from '@/lib/api';
import type { Activity, Group } from '@/types';

export interface ActivityFilterParams {
  category?: string;
  location_type?: string;
  search?: string;
  date?: string;
  page?: number;
  limit?: number;
}

export const getActivities = async (
  params?: ActivityFilterParams,
  signal?: AbortSignal
): Promise<Activity[]> => {
  const cleanParams: Record<string, any> = {};
  if (params) {
    if (params.category && params.category !== 'All') cleanParams.category = params.category;
    if (params.location_type && params.location_type !== 'All') cleanParams.location_type = params.location_type;
    if (params.search) cleanParams.search = params.search;
    if (params.date) cleanParams.date = params.date;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
  }
  const res = await api.get<Activity[]>('/activities', {
    params: cleanParams,
    signal,
  });
  return res.data || [];
};

export const getActivity = async (
  id: string | number,
  signal?: AbortSignal
): Promise<Activity> => {
  const res = await api.get<Activity>(`/activities/${id}`, { signal });
  return res.data;
};

export const createActivity = async (
  data: Partial<Activity>
): Promise<Activity> => {
  const res = await api.post<Activity>('/activities', data);
  return res.data;
};

export const joinActivity = async (
  id: string | number
): Promise<{ success: boolean; message?: string }> => {
  const res = await api.post(`/activities/${id}/join`);
  return res.data;
};

export const leaveActivity = async (
  id: string | number
): Promise<{ success: boolean; message?: string }> => {
  const res = await api.delete(`/activities/${id}/join`);
  return res.data;
};

export const deleteActivity = async (
  id: string | number
): Promise<void> => {
  await api.delete(`/activities/${id}`);
};

export const getActivityGroup = async (
  id: string | number,
  signal?: AbortSignal
): Promise<Group | null> => {
  try {
    const res = await api.get<Group>(`/activities/${id}/group`, { signal });
    return res.data;
  } catch {
    return null;
  }
};
