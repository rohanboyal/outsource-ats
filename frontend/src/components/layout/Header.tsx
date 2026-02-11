// src/components/layout/Header.tsx
import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Menu, Bell, User, LogOut, Settings, ChevronDown } from 'lucide-react';
import { useAuthStore } from '../../store/authStore';
import { cn } from '../../lib/utils';
import { toast } from 'sonner';

interface HeaderProps {
  onMenuClick: () => void;
}

export function Header({ onMenuClick }: HeaderProps) {
  const navigate = useNavigate();
  const { user, clearAuth } = useAuthStore();
  const [showUserMenu, setShowUserMenu] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Close menu on outside click
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleLogout = () => {
    clearAuth();
    toast.success('Logged out successfully');
    navigate('/login');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  return (
    <header className="sticky top-0 z-30 h-16 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="flex h-full items-center justify-between px-4 sm:px-6">
        {/* Left side */}
        <div className="flex items-center gap-4">
          {/* Mobile menu button */}
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 hover:bg-accent rounded-md"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* Page title - can be dynamic based on route */}
          <div>
            <h1 className="text-lg font-semibold">Dashboard</h1>
          </div>
        </div>

        {/* Right side */}
        <div className="flex items-center gap-2">
          {/* Notifications */}
          <button
            className="relative p-2 hover:bg-accent rounded-md"
            onClick={() => toast.info('Notifications coming soon!')}
          >
            <Bell className="h-5 w-5" />
            <span className="absolute top-1 right-1 h-2 w-2 rounded-full bg-destructive" />
          </button>

          {/* User menu */}
          <div className="relative" ref={menuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-2 hover:bg-accent rounded-md"
            >
              <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground text-sm font-medium">
                {user ? getInitials(user.full_name) : 'U'}
              </div>
              <div className="hidden sm:block text-left">
                <p className="text-sm font-medium">{user?.full_name}</p>
                <p className="text-xs text-muted-foreground capitalize">
                  {user?.role.replace('_', ' ')}
                </p>
              </div>
              <ChevronDown className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* Dropdown menu */}
            {showUserMenu && (
              <div className="absolute right-0 mt-2 w-56 rounded-md border border-border bg-card shadow-lg">
                <div className="p-3 border-b border-border">
                  <p className="text-sm font-medium">{user?.full_name}</p>
                  <p className="text-xs text-muted-foreground">{user?.email}</p>
                </div>

                <div className="py-1">
                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      toast.info('Profile settings coming soon!');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                  >
                    <User className="h-4 w-4" />
                    <span>Profile</span>
                  </button>

                  <button
                    onClick={() => {
                      setShowUserMenu(false);
                      toast.info('Settings coming soon!');
                    }}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm hover:bg-accent"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                </div>

                <div className="border-t border-border py-1">
                  <button
                    onClick={handleLogout}
                    className="flex w-full items-center gap-2 px-3 py-2 text-sm text-destructive hover:bg-accent"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Logout</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}
