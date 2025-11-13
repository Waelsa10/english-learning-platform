import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Mail, Lock, Eye, EyeOff, GraduationCap } from 'lucide-react';
import { signIn } from '@/lib/firebase/auth';
import { getUserByUid } from '@/lib/firebase/firestore';
import { useAuthStore } from '@/store/authStore';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import toast from 'react-hot-toast';

const teacherLoginSchema = z.object({
  email: z.string().email('Invalid email address'),
  password: z.string().min(6, 'Password must be at least 6 characters'),
});

type TeacherLoginFormData = z.infer<typeof teacherLoginSchema>;

export const TeacherLogin: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherLoginFormData>({
    resolver: zodResolver(teacherLoginSchema),
  });

  const onSubmit = async (data: TeacherLoginFormData) => {
    setIsLoading(true);
    try {
      const firebaseUser = await signIn(data.email, data.password);
      const userData = await getUserByUid(firebaseUser.uid);

      if (!userData) {
        toast.error('User data not found');
        return;
      }

      // Check if user is a teacher
      if (userData.role !== 'teacher') {
        toast.error('Access denied. Teacher credentials required.');
        return;
      }

      setUser(userData);
      toast.success('Welcome back, Teacher!');
      navigate('/teacher/dashboard');
    } catch (error: any) {
      console.error('Teacher login error:', error);
      toast.error(error.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-md">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Teacher Portal</h1>
          <p className="text-gray-600">Sign in to manage your students</p>
        </div>

        {/* Login Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <Input
              {...register('email')}
              type="email"
              label="Teacher Email"
              placeholder="teacher@yourschool.com"
              error={errors.email?.message}
              leftIcon={<Mail className="h-4 w-4" />}
              autoComplete="username"
            />

            <Input
              {...register('password')}
              type={showPassword ? 'text' : 'password'}
              label="Password"
              placeholder="••••••••"
              error={errors.password?.message}
              leftIcon={<Lock className="h-4 w-4" />}
              autoComplete="current-password"
              rightIcon={
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="focus:outline-none"
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-gray-400" />
                  ) : (
                    <Eye className="h-4 w-4 text-gray-400" />
                  )}
                </button>
              }
            />

            <div className="flex items-center justify-end">
              <Link
                to="/teacher/forgot-password"
                className="text-sm text-indigo-600 hover:text-indigo-700"
              >
                Forgot password?
              </Link>
            </div>

            <Button 
              type="submit" 
              className="w-full bg-indigo-600 hover:bg-indigo-700" 
              isLoading={isLoading}
            >
              {isLoading ? 'Signing in...' : 'Sign In as Teacher'}
            </Button>
          </form>

          {/* Register Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              New teacher?{' '}
              <Link 
                to="/teacher/register" 
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Apply to join
              </Link>
            </p>
          </div>
        </div>

        {/* Footer Links */}
        <div className="text-center mt-6 space-y-2">
          <p className="text-sm text-gray-600">
            Are you a student?{' '}
            <Link 
              to="/login" 
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Student login
            </Link>
          </p>
          <p className="text-xs text-gray-500">
            <Link 
              to="/admin/login" 
              className="hover:text-gray-700"
            >
              Admin
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};