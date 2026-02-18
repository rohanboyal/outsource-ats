// src/components/layout/Sidebar.tsx - REBRANDED TO KGF HireX
import { Link, useLocation } from 'react-router-dom';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';
import { useAuthStore } from '../../store/authStore';
import { getNavigationForRole, ROLE_LABELS } from '../../config/roleConfig';
import type { UserRole } from '../../types';

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export function Sidebar({ isOpen, onClose }: SidebarProps) {
  const location = useLocation();
  const { user } = useAuthStore();
  
  // Get navigation items filtered by user role
  const navigation = user?.role 
    ? getNavigationForRole(user.role as UserRole)
    : [];

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-50 w-64 bg-card border-r border-border transform transition-transform duration-200 ease-in-out lg:translate-x-0 lg:static lg:z-0',
          isOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <div className="flex h-full flex-col">
          {/* Logo - ✅ UPDATED TO KGF HireX */}
          <div className="flex h-16 items-center justify-between px-6 border-b border-border">
            <Link to="/dashboard" className="flex items-center space-x-2">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-lg">K</span>
              </div>
              <span className="text-xl font-bold">
                KGF <span className="text-primary">HireX</span>
              </span>
            </Link>
            <button
              onClick={onClose}
              className="lg:hidden p-1 hover:bg-accent rounded-md"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* User Role Badge */}
          {user?.role && (
            <div className="px-6 py-3 border-b border-border bg-muted/30">
              <p className="text-xs text-muted-foreground">Logged in as</p>
              <p className="text-sm font-semibold text-foreground">
                {ROLE_LABELS[user.role as UserRole]}
              </p>
            </div>
          )}

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-3 py-4 overflow-y-auto">
            {navigation.map((item) => {
              const isActive = location.pathname.startsWith(item.href);
              const Icon = item.icon;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => onClose()}
                  className={cn(
                    'flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors',
                    isActive
                      ? 'bg-primary text-primary-foreground'
                      : 'text-muted-foreground hover:bg-accent hover:text-accent-foreground'
                  )}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              );
            })}

            {/* Show message if no navigation items */}
            {navigation.length === 0 && (
              <div className="px-3 py-4 text-sm text-muted-foreground text-center">
                No menu items available for your role.
              </div>
            )}
          </nav>

          {/* Footer */}
          <div className="border-t border-border p-4">
            <div className="flex items-center gap-3 px-3 py-2 text-sm text-muted-foreground">
              <div className="h-2 w-2 rounded-full bg-green-500" />
              <span>System Online</span>
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}
