// src/components/auth/AuthButton.tsx

import type { ReactNode } from 'react';
import { ArrowRight } from 'lucide-react';

interface AuthButtonProps {
  children: ReactNode;
  isLoading?: boolean;
  loadingText?: string;
  type?: 'button' | 'submit';
  disabled?: boolean;
  onClick?: () => void;
}

export function AuthButton({
  children,
  isLoading,
  loadingText = 'Loading…',
  type = 'submit',
  disabled,
  onClick,
}: AuthButtonProps) {
  return (
    <button
      type={type}
      disabled={disabled || isLoading}
      onClick={onClick}
      className="
        relative w-full overflow-hidden rounded-xl py-3 px-6
        font-bold text-sm tracking-wide
        bg-gradient-to-r from-amber-400 to-amber-500
        text-slate-900
        shadow-lg shadow-amber-500/25
        hover:shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400
        active:scale-[0.99]
        disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-amber-500/25
        transition-all duration-200
        flex items-center justify-center gap-2
        group
      "
    >
      {isLoading ? (
        <>
          <svg className="h-4 w-4 animate-spin" viewBox="0 0 24 24" fill="none">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          {loadingText}
        </>
      ) : (
        <>
          {children}
          <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
        </>
      )}
    </button>
  );
}
