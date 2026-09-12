import React, { Suspense } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppLayout } from '@/components/layout/AppLayout';
import { useAuth } from '@/context/AuthContext';
import { PageSpinner } from '@/components/ui/Spinner';

// Helper for dynamic code splitting with named exports
const lazyNamed = <T extends Record<string, any>, K extends keyof T>(
  loader: () => Promise<T>,
  name: K
) => React.lazy(() => loader().then((module) => ({ default: module[name] })));

// Lazy-loaded routes for performance & code-splitting
const LandingPage = lazyNamed(() => import('@/pages/LandingPage'), 'LandingPage');
const LoginPage = lazyNamed(() => import('@/pages/LoginPage'), 'LoginPage');
const RegisterPage = lazyNamed(() => import('@/pages/RegisterPage'), 'RegisterPage');
const OnboardingPage = lazyNamed(() => import('@/pages/OnboardingPage'), 'OnboardingPage');
const DashboardPage = lazyNamed(() => import('@/pages/DashboardPage'), 'DashboardPage');
const DiscoverPage = lazyNamed(() => import('@/pages/DiscoverPage'), 'DiscoverPage');
const NearbyPage = lazyNamed(() => import('@/pages/NearbyPage'), 'NearbyPage');
const UserProfilePage = lazyNamed(() => import('@/pages/UserProfilePage'), 'UserProfilePage');
const ActivitiesPage = lazyNamed(() => import('@/pages/ActivitiesPage'), 'ActivitiesPage');
const ActivityDetailPage = lazyNamed(() => import('@/pages/ActivityDetailPage'), 'ActivityDetailPage');
const CreateActivityPage = lazyNamed(() => import('@/pages/CreateActivityPage'), 'CreateActivityPage');
const ProjectsPage = lazyNamed(() => import('@/pages/ProjectsPage'), 'ProjectsPage');
const ProjectDetailPage = lazyNamed(() => import('@/pages/ProjectDetailPage'), 'ProjectDetailPage');
const CreateProjectPage = lazyNamed(() => import('@/pages/CreateProjectPage'), 'CreateProjectPage');
const GroupsPage = lazyNamed(() => import('@/pages/GroupsPage'), 'GroupsPage');
const GroupDetailPage = lazyNamed(() => import('@/pages/GroupDetailPage'), 'GroupDetailPage');
const MessagesPage = lazyNamed(() => import('@/pages/MessagesPage'), 'MessagesPage');
const NotificationsPage = lazyNamed(() => import('@/pages/NotificationsPage'), 'NotificationsPage');
const SettingsPage = lazyNamed(() => import('@/pages/SettingsPage'), 'SettingsPage');
const SearchPage = lazyNamed(() => import('@/pages/SearchPage'), 'SearchPage');
const AdminDashboardPage = lazyNamed(() => import('@/pages/AdminDashboardPage'), 'AdminDashboardPage');
const NotFoundPage = lazyNamed(() => import('@/pages/NotFoundPage'), 'NotFoundPage');

const ProtectedRoute: React.FC<{ children: React.ReactNode; allowPreOnboarding?: boolean }> = ({
  children,
  allowPreOnboarding
}) => {
  const { user, loading } = useAuth();
  if (loading) {
    return <PageSpinner />;
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
    return <PageSpinner />;
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
    <Suspense fallback={<PageSpinner />}>
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
    </Suspense>
  );
};
