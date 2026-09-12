import { api } from '@/lib/api';
import type { User } from '@/types';

export const getMe = async (signal?: AbortSignal): Promise<User> => {
  const res = await api.get<User>('/users/me', { signal });
  return res.data;
};

export const getUserProfile = async (
  userId: string | number,
  signal?: AbortSignal
): Promise<any> => {
  const res = await api.get<any>(`/users/${userId}`, { signal });
  return res.data;
};

export const updateProfile = async (data: any): Promise<any> => {
  const res = await api.put('/users/me', data);
  return res.data;
};

export const updateMyStatus = async (status: string): Promise<any> => {
  const res = await api.put('/users/me/status', { status });
  return res.data;
};

export const toggleFollowUser = async (
  userId: string | number
): Promise<{ is_following: boolean; followers_count: number }> => {
  const res = await api.post(`/users/${userId}/follow`);
  return res.data;
};

export const getUserFollowers = async (
  userId: string | number,
  signal?: AbortSignal
): Promise<any[]> => {
  const res = await api.get(`/users/${userId}/followers`, { signal });
  return res.data || [];
};

export const getUserFollowing = async (
  userId: string | number,
  signal?: AbortSignal
): Promise<any[]> => {
  const res = await api.get(`/users/${userId}/following`, { signal });
  return res.data || [];
};

export const getMyPeople = async (signal?: AbortSignal): Promise<any[]> => {
  const res = await api.get('/users/my-people', { signal });
  return res.data || [];
};

export const getAdminContactInfo = async (signal?: AbortSignal): Promise<any> => {
  const res = await api.get('/users/admin-contact-info', { signal });
  return res.data;
};
