import React from 'react';
import { Link } from 'react-router-dom';
import { Shield, GraduationCap, ArrowLeft } from 'lucide-react';
import { LoginForm } from '@/features/auth/LoginForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';

export const LoginPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <div className="w-full max-w-md">
        {/* ✅ Back Button */}
        <Link 
          to="/" 
          className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors mb-4"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to home</span>
        </Link>

        <Card className="w-full">
          <CardHeader className="text-center">
            <div className="flex justify-center mb-4">
              <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold text-2xl">E</span>
              </div>
            </div>
            <CardTitle className="text-2xl">Welcome Back</CardTitle>
            <p className="text-muted-foreground">Sign in to continue learning</p>
          </CardHeader>
          <CardContent>
            <LoginForm />
            
            {/* Other Login Options */}
            <div className="mt-8 pt-6 border-t border-border">
              <div className="text-center space-y-3">
                {/* Teacher Login Link */}
                <Link 
                  to="/teacher/login" 
                  className="flex items-center justify-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
                >
                  <GraduationCap className="w-4 h-4" />
                  <span>Teacher Login</span>
                </Link>
                
                {/* Admin Portal Link */}
                <Link 
                  to="/admin/login" 
                  className="flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
                >
                  <Shield className="w-3 h-3" />
                  <span>Admin Portal</span>
                </Link>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};