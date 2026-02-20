// src/components/auth/AuthFormPanel.tsx

import type { ReactNode } from 'react';
import { Logo } from './Logo';
import { FormHeader } from './FormHeader';

interface AuthFormPanelProps {
  children: ReactNode;
}

export function AuthFormPanel({ children }: AuthFormPanelProps) {
  return (
    <main className="relative z-10 flex flex-1 items-center justify-center px-6 py-12 lg:px-12">
      <div className="w-full max-w-[400px]">
        {/* Mobile-only logo */}
        <div className="flex lg:hidden items-center gap-3 mb-10">
          <Logo size="sm" showSubtext={false} />
        </div>

        {/* Welcome header (hidden on mobile, shown in form components) */}
        <div className="hidden lg:block">
          <FormHeader />
        </div>

        {/* Card container */}
        <div className="relative">
          {/* Glow border effects */}
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-white/10 via-white/5 to-white/[0.02] pointer-events-none" />
          <div className="absolute -inset-[1px] rounded-2xl bg-gradient-to-br from-amber-400/20 via-transparent to-violet-500/10 pointer-events-none opacity-60" />

          {/* Card content */}
          <div className="relative rounded-2xl bg-white/[0.04] backdrop-blur-xl border border-white/10 p-8 shadow-2xl">
            {/* Top shine effect */}
            <div className="absolute top-0 left-8 right-8 h-px bg-gradient-to-r from-transparent via-white/20 to-transparent" />

            {/* Form content */}
            {children}
          </div>
        </div>

        {/* Divider */}
        <div className="mt-6 flex items-center gap-3">
          <div className="flex-1 h-px bg-white/[0.06]" />
          <span className="text-slate-600 text-xs">secure login</span>
          <div className="flex-1 h-px bg-white/[0.06]" />
        </div>

        {/* Footer */}
        <p className="mt-6 text-center text-xs text-slate-600">
          © 2026 KGF HireX · All rights reserved
        </p>
      </div>
    </main>
  );
}
