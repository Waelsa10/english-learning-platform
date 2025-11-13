import React, { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuth } from '@/hooks/useAuth';
import { useUIStore } from '@/store/uiStore';
import { Toast } from '@/components/common/Toast';
import { ProtectedRoute } from '@/components/ProtectedRoute';
import { MainLayout } from '@/components/layout/MainLayout';
import { PageSpinner } from '@/components/common/Spinner';

// Pages
import { LandingPage } from '@/pages/LandingPage';
import { LoginPage } from '@/pages/LoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { AdminLogin } from '@/pages/admin/AdminLogin';
import { TeacherLogin } from '@/pages/teacher/TeacherLogin';
import { TeacherRegister } from '@/pages/teacher/TeacherRegister';
import { StudentDashboard } from '@/features/dashboard/StudentDashboard';
import { TeacherDashboard } from '@/features/dashboard/TeacherDashboard';
import { AdminDashboard } from '@/features/dashboard/AdminDashboard';
import { AssignmentList } from '@/features/assignments/AssignmentList';
import { AssignmentCreate } from '@/features/assignments/AssignmentCreate';
import { MessagesList } from '@/features/messages/MessagesList';

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

      {/* Admin Dashboard */}
      <Route
        path="/admin/dashboard"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <MainLayout>
              <AdminDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Teacher Dashboard */}
      <Route
        path="/teacher/dashboard"
        element={
          <ProtectedRoute allowedRoles={['teacher']}>
            <MainLayout>
              <TeacherDashboard />
            </MainLayout>
          </ProtectedRoute>
        }
      />

      {/* Protected Routes - Students & Teachers */}
      <Route element={<MainLayout />}>
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={['student']}>
              <DashboardRouter />
            </ProtectedRoute>
          }
        />

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

        <Route
          path="/messages"
          element={
            <ProtectedRoute allowedRoles={['student', 'teacher', 'admin']}>
              <MessagesList />
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

function DashboardRouter() {
  const { user } = useAuth();

  if (!user) return null;

  switch (user.role) {
    case 'student':
      return <StudentDashboard />;
    case 'teacher':
      // Teacher should use /teacher/dashboard, redirect if somehow here
      return <Navigate to="/teacher/dashboard" replace />;
    case 'admin':
      // Admin should use /admin/dashboard, redirect if somehow here
      return <Navigate to="/admin/dashboard" replace />;
    default:
      return <Navigate to="/" replace />;
  }
}

export default App;