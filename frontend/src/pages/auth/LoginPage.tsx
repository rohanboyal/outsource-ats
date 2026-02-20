// src/pages/auth/LoginPage.tsx - REMOVED REGISTER LINK

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, AlertCircle } from 'lucide-react';

import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { AuthInput } from '../../components/auth/AuthInput';
import { AuthButton } from '../../components/auth/AuthButton';
import { FormHeader } from '../../components/auth/FormHeader';

// Validation schema
const loginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type LoginFormData = z.infer<typeof loginSchema>;

export function LoginPage() {
  const navigate = useNavigate();
  const { setAuth } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
  });

  const onSubmit = async (data: LoginFormData) => {
    setIsLoading(true);
    setApiError('');

    try {
      const response = await authApi.login(data);
      localStorage.setItem('access_token', response.access_token);
      const user = await authApi.getCurrentUser();
      setAuth(user, response.access_token, response.refresh_token);
      toast.success(`Welcome back, ${user.full_name}!`);

      // Role-based redirect
      if (user.role === 'client') {
        navigate('/client/dashboard', { replace: true });
      } else {
        navigate('/dashboard', { replace: true });
      }
    } catch (error: any) {
      let errorMessage = 'Invalid email or password. Please try again.';
      if (error.response?.data?.detail) {
        if (Array.isArray(error.response.data.detail)) {
          errorMessage = error.response.data.detail.map((err: any) => err.msg).join(', ');
        } else if (typeof error.response.data.detail === 'string') {
          errorMessage = error.response.data.detail;
        }
      }
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div>
      {/* Mobile header */}
      <div className="lg:hidden mb-8">
        <FormHeader />
      </div>

      {/* Error Alert */}
      {apiError && (
        <div className="mb-6 flex items-start gap-3 rounded-xl bg-red-500/10 border border-red-500/20 p-4">
          <AlertCircle className="h-4 w-4 text-red-400 mt-0.5 flex-shrink-0" />
          <p className="text-sm text-red-300 leading-snug">{apiError}</p>
        </div>
      )}

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
        {/* Email */}
        <AuthInput
          label="Email"
          type="email"
          placeholder="you@company.com"
          autoComplete="email"
          icon={Mail}
          error={errors.email?.message}
          {...register('email')}
        />

        {/* Password */}
        <div className="space-y-2">
          <AuthInput
            label="Password"
            type="password"
            placeholder="••••••••••••"
            autoComplete="current-password"
            icon={Lock}
            showPasswordToggle
            error={errors.password?.message}
            {...register('password')}
          />
          {/* Forgot password link */}
          <div className="text-right">
            <button
              type="button"
              className="text-xs text-slate-500 hover:text-amber-400 transition-colors"
              onClick={() => toast.info('Please contact your administrator to reset your password.')}
            >
              Forgot password?
            </button>
          </div>
        </div>

        {/* Submit Button */}
        <div className="pt-2">
          <AuthButton isLoading={isLoading} loadingText="Signing in…">
            Sign In
          </AuthButton>
        </div>

        {/* ❌ REMOVED: Register Link */}
        {/* Info message instead */}
        <p className="text-center text-sm text-slate-500 pt-1">
          Need an account?{' '}
          <span className="text-amber-400 font-semibold">
            Contact your administrator
          </span>
        </p>
      </form>
    </div>
  );
}