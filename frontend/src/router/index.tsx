import { lazy, Suspense } from 'react';
import { createBrowserRouter, Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/authStore';
import { UserRole } from '../types';

// Layouts
import PublicLayout from '../components/layout/PublicLayout';
import DashboardLayout from '../components/layout/DashboardLayout';
import PageLoader from '../components/ui/PageLoader';

// Public pages
const HomePage = lazy(() => import('../pages/public/HomePage'));
const NewsPage = lazy(() => import('../pages/public/NewsPage'));
const NewsDetailPage = lazy(() => import('../pages/public/NewsDetailPage'));
const AchievementsPage = lazy(() => import('../pages/public/AchievementsPage'));
const TestsPage = lazy(() => import('../pages/public/TestsPage'));
const BlockTestsPage = lazy(() => import('../pages/public/BlockTestsPage'));
const ControlWorksPage = lazy(() => import('../pages/public/ControlWorksPage'));
const AboutPage = lazy(() => import('../pages/public/AboutPage'));
const TeachersPage = lazy(() => import('../pages/public/TeachersPage'));
const GalleryPage = lazy(() => import('../pages/public/GalleryPage'));
const DocumentsPage = lazy(() => import('../pages/public/DocumentsPage'));
const ContactPage = lazy(() => import('../pages/public/ContactPage'));
const SchedulePage = lazy(() => import('../pages/public/SchedulePage'));

// Auth
const LoginPage = lazy(() => import('../pages/auth/LoginPage'));

// Admin pages
const AdminDashboard = lazy(() => import('../pages/admin/AdminDashboard'));
const UsersPage = lazy(() => import('../pages/admin/UsersPage'));
const NewsManagePage = lazy(() => import('../pages/admin/NewsManagePage'));
const AchievementsManagePage = lazy(() => import('../pages/admin/AchievementsManagePage'));
const AnalyticsPage = lazy(() => import('../pages/admin/AnalyticsPage'));
const SubjectsManagePage = lazy(() => import('../pages/admin/SubjectsManagePage'));
const SchoolInfoManagePage = lazy(() => import('../pages/admin/SchoolInfoManagePage'));
const ScheduleManagePage = lazy(() => import('../pages/admin/ScheduleManagePage'));

// Teacher pages
const TeacherDashboard = lazy(() => import('../pages/teacher/TeacherDashboard'));
const TeacherProfilePage = lazy(() => import('../pages/teacher/TeacherProfilePage'));
const TeacherExamsPage = lazy(() => import('../pages/teacher/TeacherExamsPage'));
const TeacherBlockTestsPage = lazy(() => import('../pages/teacher/TeacherBlockTestsPage'));

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
      { path: 'block-tests', element: <BlockTestsPage /> },
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
  {
    path: '/login',
    element: (
      <Suspense fallback={<PageLoader />}>
        <LoginPage />
      </Suspense>
    ),
  },

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
          { path: 'school-info',   element: <SchoolInfoManagePage /> },
          { path: 'schedule',      element: <ScheduleManagePage /> },
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
          { path: 'profile',           element: <TeacherProfilePage /> },
          { path: 'exams',             element: <TeacherExamsPage /> },
          { path: 'block-tests',       element: <TeacherBlockTestsPage /> },
        ],
      },
    ],
  },

  // 404
  { path: '*', element: <Navigate to="/" replace /> },
]);
