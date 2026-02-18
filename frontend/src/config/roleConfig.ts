// src/config/roleConfig.ts - Role-Based UI Configuration - FINAL FIX

import type { UserRole } from '../types';
import {
  LayoutDashboard,
  Building2,
  Briefcase,
  FileText,
  Users,
  Calendar,
  FileCheck,
  UserCheck,
  Presentation,
  UserCog,
} from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

// ============================================================================
// NAVIGATION ITEM TYPE
// ============================================================================

export interface NavItem {
  name: string;
  href: string;
  icon: LucideIcon;
  roles: UserRole[];  // Which roles can see this
}

// ============================================================================
// NAVIGATION MENU - ROLE-BASED
// ============================================================================

export const NAVIGATION: NavItem[] = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
    roles: ['admin', 'recruiter', 'account_manager', 'bd_sales', 'finance'],
  },
  {
    name: 'Clients',
    href: '/clients',
    icon: Building2,
    roles: ['admin', 'account_manager', 'bd_sales', 'finance'],
  },
  {
    name: 'Pitches',
    href: '/pitches',
    icon: Presentation,
    roles: ['admin', 'account_manager', 'bd_sales'],
  },
  {
    name: 'Job Descriptions',
    href: '/jds',
    icon: FileText,
    roles: ['admin', 'recruiter', 'account_manager', 'bd_sales', 'finance'],
  },
  {
    name: 'Candidates',
    href: '/candidates',
    icon: Users,
    roles: ['admin', 'recruiter', 'account_manager'],
  },
  {
    name: 'Applications',
    href: '/applications',
    icon: Briefcase,
    roles: ['admin', 'recruiter', 'account_manager', 'finance'],
  },
  {
    name: 'Interviews',
    href: '/interviews',
    icon: Calendar,
    roles: ['admin', 'recruiter', 'account_manager', 'finance'],
  },
  {
    name: 'Offers',
    href: '/offers',
    icon: FileCheck,
    roles: ['admin', 'recruiter', 'account_manager', 'finance'],
  },
  {
    name: 'Joinings',
    href: '/joinings',
    icon: UserCheck,
    roles: ['admin', 'recruiter', 'account_manager', 'finance'],
  },
  {
    name: 'Client Logins',
    href: '/admin/client-users',
    icon: UserCog,
    roles: ['admin'], // Only admins
  },
];

// ============================================================================
// PERMISSION HELPERS
// ============================================================================

// ✅ FIXED - Explicitly type as Record<string, readonly UserRole[]>
export const PERMISSIONS: Record<string, readonly UserRole[]> = {
  // User Management
  MANAGE_USERS: ['admin'],
  CREATE_USER: ['admin'],
  
  // Client Management
  CREATE_CLIENT: ['admin', 'account_manager', 'bd_sales'],
  UPDATE_CLIENT: ['admin', 'account_manager', 'bd_sales'],
  DELETE_CLIENT: ['admin'],
  
  // Pitch Management
  CREATE_PITCH: ['admin', 'account_manager', 'bd_sales'],
  UPDATE_PITCH: ['admin', 'account_manager', 'bd_sales'],
  SEND_PITCH: ['admin', 'account_manager', 'bd_sales'],
  APPROVE_PITCH: ['admin', 'account_manager'],
  DELETE_PITCH: ['admin'],
  
  // JD Management
  CREATE_JD: ['admin', 'account_manager'],
  UPDATE_JD: ['admin', 'recruiter', 'account_manager'],
  ASSIGN_JD: ['admin', 'account_manager'],
  DELETE_JD: ['admin'],
  
  // Candidate Management
  CREATE_CANDIDATE: ['admin', 'recruiter', 'account_manager'],
  UPDATE_CANDIDATE: ['admin', 'recruiter', 'account_manager'],
  DELETE_CANDIDATE: ['admin'],
  
  // Application Management
  CREATE_APPLICATION: ['admin', 'recruiter', 'account_manager'],
  UPDATE_APPLICATION: ['admin', 'recruiter', 'account_manager'],
  SUBMIT_APPLICATION: ['admin', 'recruiter', 'account_manager'],
  DELETE_APPLICATION: ['admin'],
  
  // Interview Management
  CREATE_INTERVIEW: ['admin', 'recruiter', 'account_manager'],
  UPDATE_INTERVIEW: ['admin', 'recruiter', 'account_manager'],
  DELETE_INTERVIEW: ['admin'],
  
  // Offer Management
  CREATE_OFFER: ['admin', 'recruiter', 'account_manager'],
  UPDATE_OFFER: ['admin', 'recruiter', 'account_manager'],
  SEND_OFFER: ['admin', 'recruiter', 'account_manager'],
  DELETE_OFFER: ['admin'],
  
  // Joining Management
  CREATE_JOINING: ['admin', 'recruiter', 'account_manager'],
  UPDATE_JOINING: ['admin', 'recruiter', 'account_manager'],
  DELETE_JOINING: ['admin'],
  
  // Reports & Analytics
  VIEW_REPORTS: ['admin', 'recruiter', 'account_manager', 'bd_sales', 'finance'],
  EXPORT_DATA: ['admin', 'finance'],
};

// ============================================================================
// ROLE DISPLAY NAMES
// ============================================================================

export const ROLE_LABELS: Record<UserRole, string> = {
  admin: 'Administrator',
  recruiter: 'Recruiter',
  account_manager: 'Account Manager',
  bd_sales: 'BD / Sales',
  finance: 'Finance',
  client: 'Client',
};

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get navigation items filtered by user role
 */
export function getNavigationForRole(role: UserRole): NavItem[] {
  return NAVIGATION.filter((item) => item.roles.includes(role));
}

/**
 * Check if user has a specific permission
 */
export function hasPermission(
  userRole: UserRole,
  permission: keyof typeof PERMISSIONS
): boolean {
  const allowedRoles = PERMISSIONS[permission];
  return allowedRoles.includes(userRole);
}

/**
 * Check if user can access a route
 */
export function canAccessRoute(userRole: UserRole, path: string): boolean {
  // Client role has special routing
  if (userRole === 'client') {
    return path.startsWith('/client/');
  }
  
  // Find nav item for this path
  const navItem = NAVIGATION.find((item) => path.startsWith(item.href));
  
  // If no nav item found, allow (might be detail page)
  if (!navItem) return true;
  
  return navItem.roles.includes(userRole);
}