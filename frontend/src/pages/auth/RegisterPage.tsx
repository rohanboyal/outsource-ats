// src/pages/auth/RegisterPage.tsx
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { toast } from 'sonner';
import { Mail, Lock, User, Briefcase, AlertCircle } from 'lucide-react';

import { authApi } from '../../api/auth';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../../components/ui/Card';
import type { UserRole } from '../../types';

// Validation schema
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

export function RegisterPage() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [apiError, setApiError] = useState('');

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      role: 'recruiter',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    setApiError('');

    try {
      // Register API call
      await authApi.register({
        full_name: data.full_name,
        email: data.email,
        password: data.password,
        role: data.role as UserRole,
      });

      // Success notification
      toast.success('Account created successfully! Please sign in.');

      // Navigate to login
      navigate('/login');
    } catch (error: any) {
      console.error('Registration error:', error);
      
      const errorMessage = 
        error.response?.data?.detail || 
        'Registration failed. Please try again.';
      
      setApiError(errorMessage);
      toast.error(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Account</CardTitle>
        <CardDescription>Sign up to get started with OutsourceATS</CardDescription>
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

          {/* Full Name */}
          <div className="relative">
            <User className="absolute left-3 top-10 h-5 w-5 text-muted-foreground" />
            <Input
              label="Full Name"
              type="text"
              placeholder="John Doe"
              className="pl-10"
              error={errors.full_name?.message}
              {...register('full_name')}
            />
          </div>

          {/* Email */}
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

          {/* Role */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-1.5">
              Role
            </label>
            <div className="relative">
              <Briefcase className="absolute left-3 top-3 h-5 w-5 text-muted-foreground" />
              <select
                className="flex h-10 w-full rounded-lg border border-input bg-background px-3 py-2 text-sm pl-10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                {...register('role')}
              >
                <option value="recruiter">Recruiter</option>
                <option value="account_manager">Account Manager</option>
                <option value="bd_sales">BD/Sales</option>
                <option value="finance">Finance</option>
                <option value="admin">Admin</option>
              </select>
            </div>
            {errors.role && (
              <p className="mt-1.5 text-sm text-destructive">{errors.role.message}</p>
            )}
          </div>

          {/* Password */}
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

          {/* Confirm Password */}
          <div className="relative">
            <Lock className="absolute left-3 top-10 h-5 w-5 text-muted-foreground" />
            <Input
              label="Confirm Password"
              type="password"
              placeholder="••••••••"
              className="pl-10"
              error={errors.confirmPassword?.message}
              {...register('confirmPassword')}
            />
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
            {isLoading ? 'Creating account...' : 'Create Account'}
          </Button>

          {/* Login Link */}
          <p className="text-center text-sm text-muted-foreground">
            Already have an account?{' '}
            <Link to="/login" className="text-primary hover:underline font-medium">
              Sign in
            </Link>
          </p>
        </CardFooter>
      </form>
    </Card>
  );
}
