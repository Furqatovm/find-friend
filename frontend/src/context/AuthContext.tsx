import React, { createContext, useContext, useState, useEffect } from 'react';
import { api } from '@/lib/api';
import type { User } from '@/types';

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (data: { email_or_username: string; password: string }) => Promise<void>;
  loginWithGoogle: (data: { email: string; name: string; avatar_url?: string }) => Promise<void>;
  register: (data: { username: string; email: string; password: string; display_name?: string; city?: string }) => Promise<void>;
  logout: () => void;
  updateUser: (updatedData: Partial<User>) => void;
  refreshUser: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const cached = localStorage.getItem('withme_user');
    return cached ? JSON.parse(cached) : null;
  });
  const [loading, setLoading] = useState(true);

  const refreshUser = async () => {
    const token = localStorage.getItem('withme_access_token');
    if (!token) {
      setUser(null);
      setLoading(false);
      return;
    }
    try {
      const res = await api.get('/users/me');
      setUser(res.data);
      localStorage.setItem('withme_user', JSON.stringify(res.data));
    } catch (err) {
      console.error('Failed to load current user', err);
      // If token expired and couldn't refresh
      setUser(null);
      localStorage.removeItem('withme_user');
      localStorage.removeItem('withme_access_token');
      localStorage.removeItem('withme_refresh_token');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (credentials: { email_or_username: string; password: string }) => {
    const res = await api.post('/auth/login', credentials);
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('withme_access_token', access_token);
    localStorage.setItem('withme_refresh_token', refresh_token);
    localStorage.setItem('withme_user', JSON.stringify(userData));
    setUser(userData);
  };

  const loginWithGoogle = async (googleData: { email: string; name: string; avatar_url?: string }) => {
    const res = await api.post('/auth/google', googleData);
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('withme_access_token', access_token);
    localStorage.setItem('withme_refresh_token', refresh_token);
    localStorage.setItem('withme_user', JSON.stringify(userData));
    setUser(userData);
  };

  const register = async (data: { username: string; email: string; password: string; display_name?: string; city?: string }) => {
    const res = await api.post('/auth/register', data);
    const { access_token, refresh_token, user: userData } = res.data;
    localStorage.setItem('withme_access_token', access_token);
    localStorage.setItem('withme_refresh_token', refresh_token);
    localStorage.setItem('withme_user', JSON.stringify(userData));
    setUser(userData);
  };

  const logout = () => {
    try {
      api.post('/auth/logout');
    } catch (e) {
      // ignore
    }
    localStorage.removeItem('withme_access_token');
    localStorage.removeItem('withme_refresh_token');
    localStorage.removeItem('withme_user');
    setUser(null);
  };

  const updateUser = (updated: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return null;
      const merged = { ...prev, ...updated };
      localStorage.setItem('withme_user', JSON.stringify(merged));
      return merged;
    });
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, register, logout, updateUser, refreshUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
