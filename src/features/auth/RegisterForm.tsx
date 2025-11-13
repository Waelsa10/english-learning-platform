import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, User, Eye, EyeOff, Phone, Globe } from 'lucide-react';
import { registerStudent } from '@/lib/firebase/auth';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Select } from '@/components/common/Select';
import toast from 'react-hot-toast';

const registerSchema = z
  .object({
    fullName: z.string().min(2, 'Name must be at least 2 characters'),
    email: z.string().email('Invalid email address'),
    password: z
      .string()
      .min(8, 'Password must be at least 8 characters')
      .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
      .regex(/[0-9]/, 'Password must contain at least one number')
      .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
    confirmPassword: z.string(),
    phoneNumber: z.string().optional(),
    timezone: z.string(),
    preferredLanguage: z.string(),
    englishLevel: z.enum(['beginner', 'intermediate', 'advanced']),
    termsAccepted: z.boolean().refine((val) => val === true, {
      message: 'You must accept the terms and conditions',
    }),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const RegisterForm: React.FC = () => {
  const navigate = useNavigate();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      preferredLanguage: 'en',
      englishLevel: 'beginner',
    },
  });

  const onSubmit = async (data: RegisterFormData) => {
    setIsLoading(true);
    try {
      await registerStudent({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        timezone: data.timezone,
        preferredLanguage: data.preferredLanguage,
        englishLevel: data.englishLevel,
        learningGoals: [],
      });

      toast.success(
        'Account created! Please check your email to verify your account.'
      );
      navigate('/login');
    } catch (error: any) {
      toast.error(error.message || 'Failed to create account');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
        <Input
          {...register('fullName')}
          label="Full Name"
          placeholder="John Doe"
          error={errors.fullName?.message}
          leftIcon={<User className="h-4 w-4" />}
        />

        <Input
          {...register('email')}
          type="email"
          label="Email"
          placeholder="your.email@example.com"
          error={errors.email?.message}
          leftIcon={<Mail className="h-4 w-4" />}
        />

        <Input
          {...register('phoneNumber')}
          type="tel"
          label="Phone Number (Optional)"
          placeholder="+1234567890"
          error={errors.phoneNumber?.message}
          leftIcon={<Phone className="h-4 w-4" />}
        />

        <Input
          {...register('password')}
          type={showPassword ? 'text' : 'password'}
          label="Password"
          placeholder="••••••••"
          error={errors.password?.message}
          leftIcon={<Lock className="h-4 w-4" />}
          rightIcon={
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="focus:outline-none"
            >
              {showPassword ? (
                <EyeOff className="h-4 w-4" />
              ) : (
                <Eye className="h-4 w-4" />
              )}
            </button>
          }
        />

        <Input
          {...register('confirmPassword')}
          type={showPassword ? 'text' : 'password'}
          label="Confirm Password"
          placeholder="••••••••"
          error={errors.confirmPassword?.message}
          leftIcon={<Lock className="h-4 w-4" />}
        />

        <Select
          {...register('englishLevel')}
          label="English Level"
          error={errors.englishLevel?.message}
          options={[
            { value: 'beginner', label: 'Beginner' },
            { value: 'intermediate', label: 'Intermediate' },
            { value: 'advanced', label: 'Advanced' },
          ]}
        />

        <Select
          {...register('preferredLanguage')}
          label="Preferred Language"
          error={errors.preferredLanguage?.message}
          options={[
            { value: 'en', label: 'English' },
            { value: 'es', label: 'Spanish' },
            { value: 'fr', label: 'French' },
            { value: 'de', label: 'German' },
            { value: 'zh', label: 'Chinese' },
          ]}
        />

        <div>
          <label className="flex items-start gap-2">
            <input
              type="checkbox"
              {...register('termsAccepted')}
              className="mt-1 rounded border-input focus:ring-primary"
            />
            <span className="text-sm">
              I accept the{' '}
              <Link to="/terms" className="text-primary hover:underline">
                Terms of Service
              </Link>{' '}
              and{' '}
              <Link to="/privacy" className="text-primary hover:underline">
                Privacy Policy
              </Link>
            </span>
          </label>
          {errors.termsAccepted && (
            <p className="mt-1 text-sm text-destructive">
              {errors.termsAccepted.message}
            </p>
          )}
        </div>

        <Button type="submit" className="w-full" isLoading={isLoading}>
          Create Account
        </Button>
      </form>

      <p className="mt-6 text-center text-sm text-muted-foreground">
        Already have an account?{' '}
        <Link to="/login" className="text-primary hover:underline">
          Sign in
        </Link>
      </p>
    </div>
  );
};