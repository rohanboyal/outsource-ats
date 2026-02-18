// src/components/auth/ProtectedRoute.tsx - Role-Based Route Protection

import { Navigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import type { UserRole } from '../../types';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: UserRole[];
  requireAuth?: boolean;
}

export function ProtectedRoute({ 
  children, 
  allowedRoles,
  requireAuth = true 
}: ProtectedRouteProps) {
  const { isAuthenticated, user } = useAuthStore();

  // Check authentication
  if (requireAuth && !isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  // If no role restrictions, allow access
  if (!allowedRoles || allowedRoles.length === 0) {
    return <>{children}</>;
  }

  // Check if user's role is allowed
  const userRole = user?.role as UserRole;
  if (!userRole || !allowedRoles.includes(userRole)) {
    // Redirect based on role
    if (userRole === 'client') {
      return <Navigate to="/client/dashboard" replace />;
    }
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
}

// Convenience wrapper for admin-only routes
export function AdminRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['admin']}>
      {children}
    </ProtectedRoute>
  );
}

// Convenience wrapper for client routes
export function ClientRoute({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['client']}>
      {children}
    </ProtectedRoute>
  );
}
