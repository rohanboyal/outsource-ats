// src/components/layout/AuthLayout.tsx
import { Outlet } from 'react-router-dom';

export function AuthLayout() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900">
      <div className="flex min-h-screen items-center justify-center p-4">
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="mb-8 text-center">
            <h1 className="text-4xl font-bold text-primary">OutsourceATS</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              Applicant Tracking System
            </p>
          </div>

          {/* Content */}
          <Outlet />

          {/* Footer */}
          <p className="mt-8 text-center text-xs text-muted-foreground">
            © 2026 OutsourceATS. All rights reserved.
          </p>
        </div>
      </div>
    </div>
  );
}
