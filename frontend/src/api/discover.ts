import { api } from '@/lib/api';
import type { UserCardData } from '@/types';

export interface DiscoverParams {
  search?: string;
  category?: string;
  goal?: string;
  activity_mode?: string;
  min_score?: number;
  page?: number;
  limit?: number;
}

export const getDiscoverUsers = async (
  params?: DiscoverParams,
  signal?: AbortSignal
): Promise<UserCardData[]> => {
  const cleanParams: Record<string, any> = {};
  if (params) {
    if (params.search) cleanParams.search = params.search;
    if (params.category && params.category !== 'All') cleanParams.category = params.category;
    if (params.goal && params.goal !== 'All') cleanParams.goal = params.goal;
    if (params.activity_mode && params.activity_mode !== 'All') cleanParams.activity_mode = params.activity_mode;
    if (params.min_score && params.min_score > 0) cleanParams.min_score = params.min_score;
    if (params.page) cleanParams.page = params.page;
    if (params.limit) cleanParams.limit = params.limit;
  }
  const res = await api.get<UserCardData[]>('/discover', {
    params: cleanParams,
    signal,
  });
  return res.data || [];
};
