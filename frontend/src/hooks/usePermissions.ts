// src/hooks/usePermissions.ts - Permission Hook

import { useAuthStore } from '../store/authStore';
import { hasPermission, PERMISSIONS } from '../config/roleConfig';
import type { UserRole } from '../types';

export function usePermissions() {
  const { user } = useAuthStore();
  const userRole = user?.role as UserRole;

  return {
    /**
     * Check if current user has a specific permission
     */
    can: (permission: keyof typeof PERMISSIONS): boolean => {
      if (!userRole) return false;
      return hasPermission(userRole, permission);
    },

    /**
     * Check if current user has ANY of the specified permissions
     */
    canAny: (permissions: Array<keyof typeof PERMISSIONS>): boolean => {
      if (!userRole) return false;
      return permissions.some((p) => hasPermission(userRole, p));
    },

    /**
     * Check if current user has ALL of the specified permissions
     */
    canAll: (permissions: Array<keyof typeof PERMISSIONS>): boolean => {
      if (!userRole) return false;
      return permissions.every((p) => hasPermission(userRole, p));
    },

    /**
     * Check if current user is an admin
     */
    isAdmin: (): boolean => {
      return userRole === 'admin';
    },

    /**
     * Check if current user is a client
     */
    isClient: (): boolean => {
      return userRole === 'client';
    },

    /**
     * Get current user role
     */
    role: userRole,

    /**
     * Get current user
     */
    user,
  };
}
