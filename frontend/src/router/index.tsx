import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';

// Public pages
import HomePage from '../pages/public/HomePage';
import NewsPage from '../pages/public/NewsPage';
import NewsDetailPage from '../pages/public/NewsDetailPage';
import AchievementsPage from '../pages/public/AchievementsPage';
import TestsPage from '../pages/public/TestsPage';
import ControlWorksPage from '../pages/public/ControlWorksPage';
import AboutPage from '../pages/public/AboutPage';
import TeachersPage from '../pages/public/TeachersPage';
import GalleryPage from '../pages/public/GalleryPage';
import DocumentsPage from '../pages/public/DocumentsPage';
import ContactPage from '../pages/public/ContactPage';
import SchedulePage from '../pages/public/SchedulePage';

// Auth
import LoginPage from '../pages/auth/LoginPage';

// Admin pages
import AdminDashboard from '../pages/admin/AdminDashboard';
import UsersPage from '../pages/admin/UsersPage';
import NewsManagePage from '../pages/admin/NewsManagePage';
import AchievementsManagePage from '../pages/admin/AchievementsManagePage';
import AnalyticsPage from '../pages/admin/AnalyticsPage';
import SubjectsManagePage from '../pages/admin/SubjectsManagePage';

// Teacher pages
import TeacherDashboard from '../pages/teacher/TeacherDashboard';
import QuestionsPage from '../pages/teacher/QuestionsPage';
import TeacherControlWorks from '../pages/teacher/TeacherControlWorks';

// ===== PROTECTED ROUTE =====
function ProtectedRoute({ roles }: { roles: UserRole[] }) {
  const { isAuthenticated, hasRole } = useAuthStore();

  if (!isAuthenticated) return <Navigate to="/login" replace />;
  if (!hasRole(...roles)) return <Navigate to="/" replace />;

  return <Outlet />;
}

// ===== ROUTER =====
export const router = createBrowserRouter([
  // Public sahifalar
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true,        element: <HomePage /> },
      { path: 'news',       element: <NewsPage /> },
      { path: 'news/:slug', element: <NewsDetailPage /> },
      { path: 'achievements', element: <AchievementsPage /> },
      { path: 'tests',      element: <TestsPage /> },
      { path: 'control-works', element: <ControlWorksPage /> },
      { path: 'about',      element: <AboutPage /> },
      { path: 'teachers',   element: <TeachersPage /> },
      { path: 'gallery',    element: <GalleryPage /> },
      { path: 'documents',  element: <DocumentsPage /> },
      { path: 'contact',    element: <ContactPage /> },
      { path: 'schedule',   element: <SchedulePage /> },
    ],
  },

  // Login
  { path: '/login', element: <LoginPage /> },

  // Admin Panel (super_admin + content_manager)
  {
    path: '/admin',
    element: <ProtectedRoute roles={['super_admin', 'content_manager']} />,
    children: [
      {
        element: <DashboardLayout role="admin" />,
        children: [
          { index: true,           element: <AdminDashboard /> },
          { path: 'users',         element: <UsersPage /> },
          { path: 'news',          element: <NewsManagePage /> },
          { path: 'achievements',  element: <AchievementsManagePage /> },
          { path: 'subjects',      element: <SubjectsManagePage /> },
          { path: 'analytics',     element: <AnalyticsPage /> },
        ],
      },
    ],
  },

  // Teacher Kabineti
  {
    path: '/teacher',
    element: <ProtectedRoute roles={['teacher', 'super_admin']} />,
    children: [
      {
        element: <DashboardLayout role="teacher" />,
        children: [
          { index: true,               element: <TeacherDashboard /> },
          { path: 'questions',         element: <QuestionsPage /> },
          { path: 'control-works',     element: <TeacherControlWorks /> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <Navigate to="/" replace /> },
]);
