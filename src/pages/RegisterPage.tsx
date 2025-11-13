import React from 'react';
import { RegisterForm } from '@/features/auth/RegisterForm';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';

export const RegisterPage: React.FC = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/50 p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-4">
            <div className="h-12 w-12 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-2xl">E</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Create Your Account</CardTitle>
          <p className="text-muted-foreground">Start your learning journey today</p>
        </CardHeader>
        <CardContent>
          <RegisterForm />
        </CardContent>
      </Card>
    </div>
  );
};