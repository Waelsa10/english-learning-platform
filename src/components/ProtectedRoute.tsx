import React from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '@/hooks/useAuth';
import { PageSpinner } from '@/components/common/Spinner';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles: string[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  allowedRoles,
}) => {
  const { user, isLoading } = useAuth();

  // Show loading spinner while checking auth
  if (isLoading) {
    return <PageSpinner />;
  }

  // Not authenticated - redirect to login
  if (!user) {
    return <Navigate to="/login" replace />;
  }

  // Check if user has required role
  if (!allowedRoles.includes(user.role)) {
    // Redirect based on actual role
    if (user.role === 'admin') {
      return <Navigate to="/admin/dashboard" replace />;
    }
    if (user.role === 'teacher') {
      return <Navigate to="/teacher/dashboard" replace />;
    }
    if (user.role === 'student') {
      return <Navigate to="/dashboard" replace />;
    }
    
    // Fallback - redirect to login
    return <Navigate to="/login" replace />;
  }

  // User is authorized
  return <>{children}</>;
};