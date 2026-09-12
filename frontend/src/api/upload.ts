import { api } from '@/lib/api';

export interface UploadResponse {
  url: string;
  filename: string;
  size: number;
}

export const uploadFile = async (file: File): Promise<string> => {
  const formData = new FormData();
  formData.append('file', file);

  const res = await api.post<UploadResponse>('/upload', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });

  return res.data.url;
};
