// src/pages/auth/LoginPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, AlertCircle } from 'lucide-react';

import { authApi } from '../../api/auth';
import { useAuthStore } from '../../store/authStore';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';

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
      // Login API call
      const response = await authApi.login(data);

      // VERY IMPORTANT — store token first
      localStorage.setItem('access_token', response.access_token);

      // Get user details
      const user = await authApi.getCurrentUser();

      // Save auth state
      setAuth(user, response.access_token, response.refresh_token);

      // Success notification
      toast.success(`Welcome back, ${user.full_name}!`);

      // Navigate to dashboard
      navigate('/dashboard');
    } catch (error: any) {
      console.error('Login error:', error);

      // Handle error response
      let errorMessage = 'Invalid email or password. Please try again.';

      if (error.response?.data?.detail) {
        // If detail is an array (422 validation errors)
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
    <Card>
      <CardHeader>
        <CardTitle>Welcome Back</CardTitle>
        <CardDescription>Sign in to your account to continue</CardDescription>
      </CardHeader>

      <form onSubmit={handleSubmit(onSubmit)}>
        <CardContent className="space-y-4">
          {/* API Error Alert */}
          {apiError && (
            <div className="flex items-center gap-2 rounded-lg bg-destructive/10 p-3 text-sm text-destructive">
              <AlertCircle className="h-4 w-4" />
              <span>{apiError}</span>
            </div>
          )}

          {/* Email Field */}
          <div className="relative">
            <Mail className="absolute left-3 top-10 h-5 w-5 text-muted-foreground" />
            <Input
              label="Email"
              type="email"
              placeholder="you@example.com"
              className="pl-10"
              error={errors.email?.message}
              {...register('email')}
            />
          </div>

          {/* Password Field */}
          <div className="relative">
            <Lock className="absolute left-3 top-10 h-5 w-5 text-muted-foreground" />
            <Input
              label="Password"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              error={errors.password?.message}
              {...register('password')}
            />
          </div>

          {/* Forgot Password Link */}
          <div className="text-right">
            <button
              type="button"
              className="text-sm text-primary hover:underline"
              onClick={() => toast.info('Password reset coming soon!')}
            >
              Forgot password?
            </button>
          </div>
        </CardContent>

        <CardFooter className="flex flex-col gap-4">
          {/* Submit Button */}
          <Button
            type="submit"
            className="w-full"
            isLoading={isLoading}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign In'}
          </Button>

          {/* Register Link */}
          <p className="text-center text-sm text-muted-foreground">
            Don't have an account?{' '}
            <Link to="/register" className="text-primary hover:underline font-medium">
              Sign up
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}