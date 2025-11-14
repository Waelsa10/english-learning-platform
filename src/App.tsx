import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { Toast } from '@/components/common/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageSpinner } from '@/components/common/Spinner';

// Public Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { TeacherLogin } from '@/pages/teacher/TeacherLogin';
import { TeacherRegister } from '@/pages/teacher/TeacherRegister';

// Dashboards
import { StudentDashboard } from '@/features/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/features/dashboard/TeacherDashboard';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';

// Features
import { AssignmentList } from '@/features/assignments/AssignmentList';
import { AssignmentCreate } from '@/features/assignments/AssignmentCreate';
import { MessagesList } from '@/features/messages/MessagesList';

// Pages
import { SettingsPage } from '@/pages/SettingsPage';
import { TeachersPage } from '@/pages/TeachersPage';
import { StudentsPage } from '@/pages/StudentsPage';
import { ProgressPage } from '@/pages/ProgressPage';
import { AnalyticsPage } from '@/pages/AnalyticsPage';
import { FinancialsPage } from '@/pages/FinancialsPage';
import { LibraryPage } from '@/pages/LibraryPage';
import { NotificationsPage } from '@/pages/NotificationsPage';
import { ProfilePage } from '@/pages/ProfilePage';
import { PromoCodesPage } from '@/pages/PromoCodesPage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

function App() {
  const { theme } = useUIStore();

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AppContent />
        <Toast />
      </BrowserRouter>
    </QueryClientProvider>
  );
}

function AppContent() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <PageSpinner />;
  }

  return (
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      
      {/* Student Login */}
      <Route 
        path="/login" 
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user.role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <LoginPage />
          )
        } 
      />

      {/* Student Register */}
      <Route 
        path="/register" 
        element={
          user ? (
            user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : user.role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <RegisterPage />
          )
        } 
      />
      
      {/* Teacher Login */}
      <Route 
        path="/teacher/login" 
        element={
          user ? (
            user.role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <TeacherLogin />
          )
        } 
      />

      {/* Teacher Register */}
      <Route 
        path="/teacher/register" 
        element={
          user ? (
            user.role === 'teacher' ? (
              <Navigate to="/teacher/dashboard" replace />
            ) : user.role === 'admin' ? (
              <Navigate to="/admin/dashboard" replace />
            ) : (
              <Navigate to="/dashboard" replace />
            )
          ) : (
            <TeacherRegister />
          )
        } 
      />
      
      {/* Admin Login */}
      <Route 
        path="/admin/login" 
        element={
          user?.role === 'admin' ? (
            <Navigate to="/admin/dashboard" replace />
          ) : user?.role === 'teacher' ? (
            <Navigate to="/teacher/dashboard" replace />
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <AdminLogin />
          )
        } 
      />
          <Route
      path="/promo-codes"
      element={
        <ProtectedRoute allowedRoles={['admin']}>
          <PromoCodesPage />
        </ProtectedRoute>
      }
    />

      {/* Protected Routes with MainLayout */}
      <Route element={<MainLayout />}>
        {/* ========== DASHBOARDS ========== */}
        
        {/* Admin Dashboard */}
        <Route
          path="/admin/dashboard"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />

        {/* Teacher Dashboard */}
        <Route
          path="/teacher/dashboard"
          element={
            <ProtectedRoute allowedRoles={['teacher']}>
              <TeacherDashboard />
            </ProtectedRoute>
          }
        />

        {/* Student Dashboard */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <StudentDashboard />
            </ProtectedRoute>
          }
        />

        {/* ========== ASSIGNMENTS ========== */}
        
        <Route
          path="/assignments"
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
              <AssignmentList />
            </ProtectedRoute>
          }
        />

        <Route
          path="/assignments/create"
          element={
            <ProtectedRoute allowedRoles={['teacher', 'admin']}>
              <AssignmentCreate />
            </ProtectedRoute>
          }
        />

        {/* ========== STUDENTS ========== */}
        
        <Route
          path="/students"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <StudentsPage />
            </ProtectedRoute>
          }
        />

        {/* ========== TEACHERS ========== */}
        
        <Route
          path="/teachers"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <TeachersPage />
            </ProtectedRoute>
          }
        />

        {/* ========== MESSAGES ========== */}
        
        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
              <MessagesList />
            </ProtectedRoute>
          }
        />

        {/* ========== PROGRESS ========== */}
        
        <Route
          path="/progress"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <ProgressPage />
            </ProtectedRoute>
          }
        />

        {/* ========== ANALYTICS ========== */}
        
        <Route
          path="/analytics"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <AnalyticsPage />
            </ProtectedRoute>
          }
        />

        {/* ========== FINANCIALS ========== */}
        
        <Route
          path="/financials"
          element={
            <ProtectedRoute allowedRoles={['admin']}>
              <FinancialsPage />
            </ProtectedRoute>
          }
        />

        {/* ========== LIBRARY ========== */}
        
        <Route
          path="/library"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher']}>
              <LibraryPage />
            </ProtectedRoute>
          }
        />

        {/* ========== SETTINGS ========== */}
        
        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
              <SettingsPage />
            </ProtectedRoute>
          }
        />

        {/* ========== NOTIFICATIONS ========== */}
        
        <Route
          path="/notifications"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
              <NotificationsPage />
            </ProtectedRoute>
          }
        />

        {/* ========== PROFILE ========== */}
        
        <Route
          path="/profile"
          element={
            <ProtectedRoute allowedRoles={['admin', 'teacher', 'student']}>
              <ProfilePage />
            </ProtectedRoute>
          }
        />
      </Route>

      {/* 404 - Redirect based on user */}
      <Route 
        path="*" 
        element={
          user?.role === 'admin' ? (
            <Navigate to="/admin/dashboard" replace />
          ) : user?.role === 'teacher' ? (
            <Navigate to="/teacher/dashboard" replace />
          ) : user ? (
            <Navigate to="/dashboard" replace />
          ) : (
            <Navigate to="/" replace />
          )
        } 
      />
    </Routes>
  );
}

export default App;