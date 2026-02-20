// src/components/layout/Header.tsx - FIXED TYPESCRIPT ERROR

import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LogOut, User, Users, Settings } from 'lucide-react';
import { useState, useRef, useEffect } from 'react';

export function Header() {
  const navigate = useNavigate();
  const { user, logout } = useAuthStore();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <header className="bg-card border-b border-border px-6 py-4">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold">
            Welcome back, {user?.full_name}
          </h2>
          <p className="text-sm text-muted-foreground">
            {user?.role && (
              <span className="capitalize">
                {user.role.replace('_', ' ')}
              </span>
            )}
          </p>
        </div>

        {/* User Menu */}
        <div className="relative" ref={dropdownRef}>
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="flex items-center gap-3 px-4 py-2 rounded-lg hover:bg-muted transition-colors"
          >
            <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
              <span className="text-sm font-semibold text-primary">
                {user?.full_name?.charAt(0).toUpperCase()}
              </span>
            </div>
            <div className="text-left">
              <div className="text-sm font-medium">{user?.full_name}</div>
              <div className="text-xs text-muted-foreground">{user?.email}</div>
            </div>
          </button>

          {/* Dropdown Menu */}
          {isDropdownOpen && (
            <div className="absolute right-0 mt-2 w-56 bg-card border border-border rounded-lg shadow-lg py-2 z-50">
              {/* Profile */}
              <button
                onClick={() => {
                  navigate('/profile');
                  setIsDropdownOpen(false);
                }}
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                My Profile
              </button>

              {/* Team Members (Admin Only) */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    navigate('/admin/team');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Users className="h-4 w-4" />
                  Team Members
                </button>
              )}

              {/* Client Users (Admin Only) */}
              {user?.role === 'admin' && (
                <button
                  onClick={() => {
                    navigate('/admin/client-users');
                    setIsDropdownOpen(false);
                  }}
                  className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Client Portal Users
                </button>
              )}

              <div className="my-2 border-t border-border"></div>

              {/* Logout */}
              <button
                onClick={handleLogout}
                className="w-full px-4 py-2 text-left hover:bg-muted transition-colors flex items-center gap-2 text-red-600"
              >
                <LogOut className="h-4 w-4" />
                Logout
              </button>
            </div>
          )}
        </div>
      </div>
    </header>
  );
}