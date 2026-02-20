// src/components/auth/AuthInput.tsx

import { forwardRef, useState } from 'react';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';
import type { LucideIcon } from 'lucide-react';

interface AuthInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label: string;
  error?: string;
  icon?: LucideIcon;
  showPasswordToggle?: boolean;
}

export const AuthInput = forwardRef<HTMLInputElement, AuthInputProps>(
  ({ label, error, icon: Icon, showPasswordToggle, type, className, ...props }, ref) => {
    const [showPassword, setShowPassword] = useState(false);
    const inputType = showPasswordToggle && showPassword ? 'text' : type;

    return (
      <div className="space-y-1.5">
        <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase">
          {label}
        </label>

        <div className="relative group">
          {/* Icon */}
          {Icon && (
            <Icon className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
          )}

          {/* Input */}
          <input
            ref={ref}
            type={inputType}
            className={`
              w-full bg-white/[0.05] border rounded-xl py-3 pr-4
              text-sm text-white placeholder-slate-600
              outline-none transition-all
              focus:bg-white/[0.07] focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10
              ${Icon ? 'pl-11' : 'pl-4'}
              ${showPasswordToggle ? 'pr-12' : ''}
              ${error ? 'border-red-500/50 bg-red-500/5' : 'border-white/10'}
              ${className || ''}
            `}
            {...props}
          />

          {/* Password toggle */}
          {showPasswordToggle && (
            <button
              type="button"
              onClick={() => setShowPassword(v => !v)}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <p className="flex items-center gap-1.5 text-xs text-red-400 mt-1">
            <AlertCircle className="h-3 w-3" />
            {error}
          </p>
        )}
      </div>
    );
  }
);

AuthInput.displayName = 'AuthInput';
