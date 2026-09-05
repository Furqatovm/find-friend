import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';

import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { OnboardingPage } from '@/pages/OnboardingPage';
import { DashboardPage } from '@/pages/DashboardPage';
import { DiscoverPage } from '@/pages/DiscoverPage';
import { NearbyPage } from '@/pages/NearbyPage';
import { UserProfilePage } from '@/pages/UserProfilePage';
import { ActivitiesPage } from '@/pages/ActivitiesPage';
import { ActivityDetailPage } from '@/pages/ActivityDetailPage';
import { CreateActivityPage } from '@/pages/CreateActivityPage';
import { ProjectsPage } from '@/pages/ProjectsPage';
import { ProjectDetailPage } from '@/pages/ProjectDetailPage';
import { CreateProjectPage } from '@/pages/CreateProjectPage';
import { GroupsPage } from '@/pages/GroupsPage';
import { GroupDetailPage } from '@/pages/GroupDetailPage';
import { MessagesPage } from '@/pages/MessagesPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { SettingsPage } from '@/pages/SettingsPage';
import { SearchPage } from '@/pages/SearchPage';
import { AdminDashboardPage } from '@/pages/AdminDashboardPage';
import { NotFoundPage } from '@/pages/NotFoundPage';

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowPreOnboarding?: boolean }> = ({
  children,
  allowPreOnboarding
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#8A8A8A]">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.is_onboarded && !allowPreOnboarding) {
    return <Navigate to="/onboarding" replace />;
  }
  return <>{children}</>;
};

const AdminRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <div className="min-h-screen bg-[#080808] flex items-center justify-center text-[#8A8A8A]">Loading...</div>;
  }
  if (!user) {
    return <Navigate to="/login" replace />;
  }
  if (!user.is_admin) {
    return <Navigate to="/dashboard" replace />;
  }
  return <>{children}</>;
};

export const AppRoutes: React.FC = () => {
  const { user } = useAuth();

  const getAuthenticatedRedirect = () => {
    if (!user) return null;
    return user.is_onboarded ? <Navigate to="/dashboard" replace /> : <Navigate to="/onboarding" replace />;
  };

  return (
    <Routes>
      <Route element={<AppLayout />}>
        {/* Public & Landing */}
        <Route path="/" element={user ? getAuthenticatedRedirect() : <LandingPage />} />
        <Route path="/login" element={user ? getAuthenticatedRedirect() : <LoginPage />} />
        <Route path="/register" element={user ? getAuthenticatedRedirect() : <RegisterPage />} />

        {/* Protected Onboarding */}
        <Route path="/onboarding" element={<ProtectedRoute allowPreOnboarding><OnboardingPage /></ProtectedRoute>} />

        {/* Core Discovery & Search */}
        <Route path="/dashboard" element={<ProtectedRoute><DashboardPage /></ProtectedRoute>} />
        <Route path="/discover" element={<DiscoverPage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/nearby" element={<ProtectedRoute><NearbyPage /></ProtectedRoute>} />

        {/* Profiles */}
        <Route path="/users/:id" element={<UserProfilePage />} />
        <Route path="/profile" element={<ProtectedRoute><UserProfilePage /></ProtectedRoute>} />

        {/* Activities */}
        <Route path="/activities" element={<ActivitiesPage />} />
        <Route path="/activities/create" element={<ProtectedRoute><CreateActivityPage /></ProtectedRoute>} />
        <Route path="/activities/:id" element={<ActivityDetailPage />} />

        {/* Projects */}
        <Route path="/projects" element={<ProjectsPage />} />
        <Route path="/projects/create" element={<ProtectedRoute><CreateProjectPage /></ProtectedRoute>} />
        <Route path="/projects/:id" element={<ProjectDetailPage />} />

        {/* Groups */}
        <Route path="/groups" element={<GroupsPage />} />
        <Route path="/groups/:id" element={<GroupDetailPage />} />

        {/* Social & Messaging */}
        <Route path="/messages" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/messages/:id" element={<ProtectedRoute><MessagesPage /></ProtectedRoute>} />
        <Route path="/notifications" element={<ProtectedRoute><NotificationsPage /></ProtectedRoute>} />

        {/* Settings & Admin */}
        <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
        <Route path="/admin" element={<AdminRoute><AdminDashboardPage /></AdminRoute>} />

        {/* 404 */}
        <Route path="*" element={<NotFoundPage />} />
      </Route>
    </Routes>
  );
};
