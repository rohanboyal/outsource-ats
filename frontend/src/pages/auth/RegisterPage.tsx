// src/pages/auth/RegisterPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, User, Briefcase, AlertCircle, ArrowRight, Eye, EyeOff } from 'lucide-react';

import { authApi } from '../../api/auth';
import type { UserRole } from '../../types';

const registerSchema = z.object({
  full_name: z.string().min(2, 'Name must be at least 2 characters'),
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
  confirmPassword: z.string(),
  role: z.enum(['admin', 'recruiter', 'account_manager', 'bd_sales', 'finance', 'client']),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ['confirmPassword'],
});

type RegisterFormData = z.infer<typeof registerSchema>;

const ROLES = [
  { value: 'recruiter',        label: 'Recruiter' },
  { value: 'account_manager',  label: 'Account Manager' },
  { value: 'bd_sales',         label: 'BD / Sales' },
  { value: 'finance',          label: 'Finance' },
  { value: 'admin',            label: 'Admin' },
];

const inputBase = `
  w-full bg-white/[0.05] border rounded-xl py-3 pl-11 pr-4
  text-sm text-white placeholder-slate-600
  outline-none transition-all
  focus:bg-white/[0.07] focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10
`;
const inputError = 'border-red-500/50 bg-red-500/5';
const inputNormal = 'border-white/10';

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: { role: 'recruiter' },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError('');
    try {
      await authApi.register({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role: data.role as UserRole,
      });
      toast.success('Account created! Please sign in.');
      navigate('/login');
    } catch (error: any) {
      const errorMessage =
        error.response?.data?.detail || 'Registration failed. Please try again.';
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Header */}
      <div className="mb-7">
        <div className="flex items-center gap-3 mb-3">
          <div className="h-px w-8 bg-amber-400/60" />
          <span className="text-amber-400 text-[11px] font-semibold tracking-[0.18em] uppercase">
            New Account
          </span>
        </div>
        <h2 className="text-[32px] font-black text-white tracking-tight leading-none">
          Create account<span className="text-amber-400">.</span>
        </h2>
        <div className="mt-3 flex items-center gap-2">
          <div className="h-[2px] w-10 rounded-full bg-amber-400" />
          <div className="h-[2px] w-4 rounded-full bg-amber-400/30" />
          <div className="h-[2px] w-2 rounded-full bg-amber-400/10" />
        </div>
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="mb-5 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300 leading-snug">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">

        {/* Full Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase">
            Full Name
          </label>
          <div className="relative group">
            <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="text"
              placeholder="John Doe"
              autoComplete="name"
              className={`${inputBase} ${errors.full_name ? inputError : inputNormal}`}
              {...register('full_name')}
            />
          </div>
          {errors.full_name && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />{errors.full_name.message}
            </p>
          )}
        </div>

        {/* Email */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase">
            Email
          </label>
          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
            <input
              type="email"
              placeholder="you@company.com"
              autoComplete="email"
              className={`${inputBase} ${errors.email ? inputError : inputNormal}`}
              {...register('email')}
            />
          </div>
          {errors.email && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />{errors.email.message}
            </p>
          )}
        </div>

        {/* Role */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase">
            Role
          </label>
          <div className="relative group">
            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors pointer-events-none" />
            <select
              className={`
                w-full bg-white/[0.05] border rounded-xl py-3 pl-11 pr-4
                text-sm text-white
                outline-none transition-all appearance-none cursor-pointer
                focus:bg-white/[0.07] focus:border-amber-400/50 focus:ring-2 focus:ring-amber-400/10
                ${errors.role ? inputError : inputNormal}
              `}
              {...register('role')}
            >
              {ROLES.map(r => (
                <option key={r.value} value={r.value} className="bg-slate-900 text-white">
                  {r.label}
                </option>
              ))}
            </select>
            {/* Custom chevron */}
            <div className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2">
              <svg className="h-4 w-4 text-slate-500" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.25 4.5a.75.75 0 01-1.08 0l-4.25-4.5a.75.75 0 01.02-1.06z" clipRule="evenodd" />
              </svg>
            </div>
          </div>
          {errors.role && (
            <p className="flex items-center gap-1.5 text-xs text-red-400">
              <AlertCircle className="h-3 w-3" />{errors.role.message}
            </p>
          )}
        </div>

        {/* Password row — side by side on wider cards */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">

          {/* Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase">
              Password
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`${inputBase} pr-12 ${errors.password ? inputError : inputNormal}`}
                {...register('password')}
              />
              <button
                type="button"
                onClick={() => setShowPassword(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.password && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" />{errors.password.message}
              </p>
            )}
          </div>

          {/* Confirm Password */}
          <div className="space-y-1.5">
            <label className="block text-xs font-semibold text-slate-400 tracking-widest uppercase">
              Confirm
            </label>
            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-500 group-focus-within:text-amber-400 transition-colors" />
              <input
                type={showConfirm ? 'text' : 'password'}
                placeholder="••••••••"
                autoComplete="new-password"
                className={`${inputBase} pr-12 ${errors.confirmPassword ? inputError : inputNormal}`}
                {...register('confirmPassword')}
              />
              <button
                type="button"
                onClick={() => setShowConfirm(v => !v)}
                className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showConfirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
            {errors.confirmPassword && (
              <p className="flex items-center gap-1.5 text-xs text-red-400">
                <AlertCircle className="h-3 w-3" />{errors.confirmPassword.message}
              </p>
            )}
          </div>

        </div>

        {/* Password strength hint */}
        <p className="text-[11px] text-slate-600 -mt-1">
          Use at least 6 characters with a mix of letters and numbers.
        </p>

        {/* Submit */}
        <div className="pt-1">
          <button
            type="submit"
            disabled={isLoading}
            className="
              relative w-full overflow-hidden rounded-xl py-3 px-6
              font-bold text-sm tracking-wide
              bg-gradient-to-r from-amber-400 to-amber-500
              text-slate-900
              shadow-lg shadow-amber-500/25
              hover:shadow-amber-500/40 hover:from-amber-300 hover:to-amber-400
              active:scale-[0.99]
              disabled:opacity-60 disabled:cursor-not-allowed
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
                Creating account…
              </>
            ) : (
              <>
                Create Account
                <ArrowRight className="h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
              </>
            )}
          </button>
        </div>

        {/* Login Link */}
        <p className="text-center text-sm text-slate-500 pt-1">
          Already have an account?{' '}
          <Link
            to="/login"
            className="text-amber-400 font-semibold hover:text-amber-300 transition-colors"
          >
            Sign in
          </Link>
        </p>

      </form>
    </div>
  );
}