// src/pages/client/ClientLayout.tsx - FIXED WITH CORRECT LOGOUT METHOD

import { Outlet, useNavigate, useLocation } from 'react-router-dom';
import { useAuthStore } from '../../store/authStore';
import { LayoutDashboard, Users, FileText, Calendar, LogOut } from 'lucide-react';

const navItems = [
  { path: '/client/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { path: '/client/jds', label: 'Job Openings', icon: FileText },
  { path: '/client/candidates', label: 'Candidates', icon: Users },
  { path: '/client/interviews', label: 'Interviews', icon: Calendar },
];

export function ClientLayout() {
  const { user, logout } = useAuthStore(); // ✅ CHANGED FROM clearAuth TO logout
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout(); // ✅ CHANGED FROM clearAuth() TO logout()
    navigate('/login');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <aside className="w-64 bg-white border-r border-gray-200 flex flex-col">
        {/* Logo - KGF HireX */}
        <div className="px-6 py-5 border-b border-gray-200">
          <div className="text-xl font-bold text-[#1e3a5f]">
            KGF <span className="text-blue-500">HireX</span>
          </div>
          <div className="text-xs text-gray-500 mt-0.5">Client Portal</div>
        </div>

        {/* User info */}
        <div className="px-6 py-4 border-b border-gray-100 bg-blue-50">
          <p className="text-sm font-semibold text-gray-800 truncate">{user?.full_name}</p>
          <p className="text-xs text-gray-500 truncate">{user?.email}</p>
        </div>

        {/* Nav */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.path;
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                  isActive
                    ? 'bg-blue-600 text-white'
                    : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
                }`}
              >
                <Icon className="h-4 w-4" />
                {item.label}
              </button>
            );
          })}
        </nav>

        {/* Logout */}
        <div className="px-3 py-4 border-t border-gray-200">
          <button
            onClick={handleLogout}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-red-600 hover:bg-red-50 transition-all"
          >
            <LogOut className="h-4 w-4" />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 overflow-auto">
        <div className="max-w-6xl mx-auto px-8 py-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}