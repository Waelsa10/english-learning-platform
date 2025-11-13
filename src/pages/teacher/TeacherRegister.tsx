import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Mail,
  Lock,
  Eye,
  EyeOff,
  User,
  Phone,
  GraduationCap,
  Briefcase,
  ArrowLeft,
} from "lucide-react";
import { registerTeacher } from "@/lib/firebase/auth";
import { useAuthStore } from "@/store/authStore";
import { Button } from "@/components/common/Button";
import { Input } from "@/components/common/Input";
import toast from "react-hot-toast";

const teacherRegisterSchema = z
  .object({
    fullName: z.string().min(2, "Full name is required"),
    email: z.string().email("Invalid email address"),
    phoneNumber: z.string().optional(),
    specialization: z.string().optional(),
    experience: z.string().optional(),
    password: z.string().min(6, "Password must be at least 6 characters"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ["confirmPassword"],
  });

type TeacherRegisterFormData = z.infer<typeof teacherRegisterSchema>;

export const TeacherRegister: React.FC = () => {
  const navigate = useNavigate();
  const { setUser } = useAuthStore();
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<TeacherRegisterFormData>({
    resolver: zodResolver(teacherRegisterSchema),
  });

  const onSubmit = async (data: TeacherRegisterFormData) => {
    setIsLoading(true);
    try {
      const { user, teacherData } = await registerTeacher({
        email: data.email,
        password: data.password,
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        specialization: data.specialization,
        experience: data.experience,
      });

      setUser(teacherData);
      toast.success("Registration successful! Welcome aboard!");
      navigate("/teacher/dashboard");
    } catch (error: any) {
      console.error("Teacher registration error:", error);
      toast.error(error.message || "Failed to register");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-4">
      <div className="w-full max-w-2xl">
        {/* ✅ Back Button */}
        <Link
          to="/"
          className="inline-flex items-center gap-2 text-sm text-gray-600 hover:text-gray-900 transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>

        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-indigo-600 rounded-full mb-4">
            <GraduationCap className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Join as a Teacher
          </h1>
          <p className="text-gray-600">
            Help students achieve their English learning goals
          </p>
        </div>

        {/* Registration Form Card */}
        <div className="bg-white rounded-lg shadow-xl p-8">
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              {/* Full Name */}
              <Input
                {...register("fullName")}
                label="Full Name"
                placeholder="John Doe"
                error={errors.fullName?.message}
                leftIcon={<User className="h-4 w-4" />}
              />

              {/* Email */}
              <Input
                {...register("email")}
                type="email"
                label="Email"
                placeholder="teacher@example.com"
                error={errors.email?.message}
                leftIcon={<Mail className="h-4 w-4" />}
              />

              {/* Phone Number */}
              <Input
                {...register("phoneNumber")}
                label="Phone Number (Optional)"
                placeholder="+1 234 567 8900"
                error={errors.phoneNumber?.message}
                leftIcon={<Phone className="h-4 w-4" />}
              />

              {/* Specialization */}
              <Input
                {...register("specialization")}
                label="Specialization (Optional)"
                placeholder="e.g., IELTS, Business English"
                error={errors.specialization?.message}
                leftIcon={<Briefcase className="h-4 w-4" />}
              />
            </div>

            {/* Experience */}
            <div>
              <label className="block text-sm font-medium mb-2">
                Years of Experience (Optional)
              </label>
              <textarea
                {...register("experience")}
                placeholder="Brief description of your teaching experience..."
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                rows={3}
              />
              {errors.experience && (
                <p className="mt-1 text-sm text-red-600">
                  {errors.experience.message}
                </p>
              )}
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              {/* Password */}
              <Input
                {...register("password")}
                type={showPassword ? "text" : "password"}
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
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                }
              />

              {/* Confirm Password */}
              <Input
                {...register("confirmPassword")}
                type={showConfirmPassword ? "text" : "password"}
                label="Confirm Password"
                placeholder="••••••••"
                error={errors.confirmPassword?.message}
                leftIcon={<Lock className="h-4 w-4" />}
                rightIcon={
                  <button
                    type="button"
                    onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                    className="focus:outline-none"
                  >
                    {showConfirmPassword ? (
                      <EyeOff className="h-4 w-4 text-gray-400" />
                    ) : (
                      <Eye className="h-4 w-4 text-gray-400" />
                    )}
                  </button>
                }
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700"
              isLoading={isLoading}
            >
              {isLoading ? "Creating Account..." : "Create Teacher Account"}
            </Button>
          </form>

          {/* Login Link */}
          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              Already have an account?{" "}
              <Link
                to="/teacher/login"
                className="text-indigo-600 hover:text-indigo-700 font-medium"
              >
                Sign in
              </Link>
            </p>
          </div>
        </div>

        {/* Footer */}
        <div className="text-center mt-6">
          <p className="text-sm text-gray-600">
            Are you a student?{" "}
            <Link
              to="/register"
              className="text-indigo-600 hover:text-indigo-700 font-medium"
            >
              Student registration
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};
