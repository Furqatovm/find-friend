import { api } from '@/lib/api';
import type { UserCardData, Activity } from '@/types';

export interface NearbyParams {
  radius?: number;
  category?: string;
  lat?: number;
  lon?: number;
}

export const getNearbyUsers = async (
  params?: NearbyParams,
  signal?: AbortSignal
): Promise<UserCardData[]> => {
  const cleanParams: Record<string, any> = {};
  if (params) {
    if (params.radius) cleanParams.radius = params.radius;
    if (params.category && params.category !== 'All') cleanParams.category = params.category;
    if (params.lat !== undefined) cleanParams.lat = params.lat;
    if (params.lon !== undefined) cleanParams.lon = params.lon;
  }
  const res = await api.get<UserCardData[]>('/nearby/users', {
    params: cleanParams,
    signal,
  });
  return res.data || [];
};

export const getNearbyActivities = async (
  params?: NearbyParams,
  signal?: AbortSignal
): Promise<Activity[]> => {
  const cleanParams: Record<string, any> = {};
  if (params) {
    if (params.radius) cleanParams.radius = params.radius;
    if (params.category && params.category !== 'All') cleanParams.category = params.category;
    if (params.lat !== undefined) cleanParams.lat = params.lat;
    if (params.lon !== undefined) cleanParams.lon = params.lon;
  }
  const res = await api.get<Activity[]>('/nearby/activities', {
    params: cleanParams,
    signal,
  });
  return res.data || [];
};
