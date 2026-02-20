// src/components/layout/AuthLayout.tsx - MODULARIZED VERSION

import { Outlet } from 'react-router-dom';
import { AuthBrandPanel } from '../auth/AuthBrandPanel';
import { AuthFormPanel } from '../auth/AuthFormPanel';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-[#080a0f] flex overflow-hidden relative">
      {/* Global ambient light effects */}
      <div className="pointer-events-none fixed inset-0 z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[700px] h-[700px] bg-violet-700/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-[-20%] right-[20%] w-[600px] h-[600px] bg-indigo-600/15 rounded-full blur-[100px]" />
        <div className="absolute top-[30%] right-[-5%] w-[400px] h-[400px] bg-amber-500/10 rounded-full blur-[90px]" />
      </div>

      {/* Left Panel - Brand */}
      <AuthBrandPanel />

      {/* Right Panel - Form */}
      <AuthFormPanel>
        <Outlet />
      </AuthFormPanel>
    </div>
  );
}
