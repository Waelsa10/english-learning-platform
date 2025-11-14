import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Bell, Shield, CreditCard } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { updateUserProfile, changePassword } from '@/lib/firebase/auth';
import { updateDocument } from '@/lib/firebase/firestore';
import { serverTimestamp } from 'firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import { PageSpinner } from '@/components/common/Spinner';
import toast from 'react-hot-toast';
import { SubscriptionPlans } from '@/components/subscription/SubscriptionPlans';

const profileSchema = z.object({
  fullName: z.string().min(2),
  phoneNumber: z.string().optional(),
  bio: z.string().max(500).optional(),
});

const passwordSchema = z
  .object({
    currentPassword: z.string().min(1),
    newPassword: z.string().min(8),
    confirmPassword: z.string(),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

type ProfileFormData = z.infer<typeof profileSchema>;
type PasswordFormData = z.infer<typeof passwordSchema>;

export const SettingsPage: React.FC = () => {
  const { user } = useAuthStore();
  const { theme, setTheme } = useUIStore();
  const [activeTab, setActiveTab] = useState<'profile' | 'notifications' | 'security' | 'subscription'>('profile');

  if (!user) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <PageSpinner />
      </div>
    );
  }

  const tabs = [
    { id: 'profile', label: 'Profile', icon: User },
    { id: 'notifications', label: 'Notifications', icon: Bell },
    { id: 'security', label: 'Security', icon: Shield },
    { id: 'subscription', label: 'Subscription', icon: CreditCard },
  ] as const;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Manage your account settings and preferences
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Sidebar */}
        <Card className="lg:col-span-1 h-fit">
          <CardContent className="p-4">
            <nav className="space-y-1">
              {tabs.map((tab) => {
                const Icon = tab.icon;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition-colors ${
                      activeTab === tab.id
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-accent'
                    }`}
                  >
                    <Icon className="h-5 w-5" />
                    <span className="font-medium">{tab.label}</span>
                  </button>
                );
              })}
            </nav>
          </CardContent>
        </Card>

        {/* Content */}
        <div className="lg:col-span-3 space-y-6">
          {activeTab === 'profile' && <ProfileSettings />}
          {activeTab === 'notifications' && <NotificationSettings />}
          {activeTab === 'security' && <SecuritySettings />}
          {activeTab === 'subscription' && <SubscriptionSettings />}
        </div>
      </div>
    </div>
  );
};

const ProfileSettings: React.FC = () => {
  const { user, setUser } = useAuthStore();
  const [isLoading, setIsLoading] = useState(false);

  if (!user) return null;

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.profile?.fullName || '',
      phoneNumber: user?.profile?.phoneNumber || '',
      bio: user?.profile?.bio || '',
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    // ✅ Get user ID with fallback
    const userId = user.id || user.uid;
    
    if (!userId) {
      toast.error('User ID not found');
      return;
    }

    setIsLoading(true);
    try {
      await updateUserProfile(data);
      await updateDocument('users', userId, {
        profile: { ...user.profile, ...data },
      });

      setUser({ ...user, profile: { ...user.profile, ...data } });
      toast.success('Profile updated successfully');
    } catch (error) {
      console.error('Profile update error:', error);
      toast.error('Failed to update profile');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profile Information</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div className="flex items-center gap-6">
            <Avatar
              src={user?.profile?.profilePicture}
              fallback={user?.profile?.fullName?.charAt(0) || user?.email?.charAt(0) || 'U'}
              size="xl"
            />
            <div>
              <Button variant="outline" size="sm" type="button">
                Change Photo
              </Button>
              <p className="text-sm text-muted-foreground mt-1">
                JPG, PNG. Max size 2MB
              </p>
            </div>
          </div>

          <Input
            {...register('fullName')}
            label="Full Name"
            error={errors.fullName?.message}
          />

          <Input
            {...register('phoneNumber')}
            label="Phone Number"
            error={errors.phoneNumber?.message}
          />

          <div>
            <label className="block text-sm font-medium mb-1.5">Bio</label>
            <textarea
              {...register('bio')}
              className="w-full min-h-[100px] rounded-lg border border-input bg-background px-3 py-2 text-sm"
              placeholder="Tell us about yourself..."
            />
            {errors.bio && (
              <p className="mt-1.5 text-sm text-destructive">{errors.bio.message}</p>
            )}
          </div>

          <Button type="submit" isLoading={isLoading}>
            Save Changes
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const NotificationSettings: React.FC = () => {
  const { user } = useAuthStore();
  
  const [settings, setSettings] = useState(
    user?.settings?.notifications || {
      email: true,
      push: true,
      sms: false,
    }
  );
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user) return;

    // ✅ Get user ID with fallback
    const userId = user.id || user.uid;
    
    if (!userId) {
      toast.error('User ID not found');
      return;
    }

    setIsLoading(true);
    try {
      await updateDocument('users', userId, {
        settings: { 
          ...user.settings, 
          notifications: settings 
        },
      });
      toast.success('Notification settings updated');
    } catch (error) {
      console.error('Notification settings error:', error);
      toast.error('Failed to update settings');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Notification Preferences</CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Email Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive notifications via email
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings?.email || false}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, email: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">Push Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive push notifications in your browser
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings?.push || false}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, push: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input"
            />
          </label>

          <label className="flex items-center justify-between">
            <div>
              <p className="font-medium">SMS Notifications</p>
              <p className="text-sm text-muted-foreground">
                Receive important updates via SMS
              </p>
            </div>
            <input
              type="checkbox"
              checked={settings?.sms || false}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev, sms: e.target.checked }))
              }
              className="h-4 w-4 rounded border-input"
            />
          </label>
        </div>

        <Button onClick={handleSave} isLoading={isLoading}>
          Save Preferences
        </Button>
      </CardContent>
    </Card>
  );
};

const SecuritySettings: React.FC = () => {
  const [isLoading, setIsLoading] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<PasswordFormData>({
    resolver: zodResolver(passwordSchema),
  });

  const onSubmit = async (data: PasswordFormData) => {
    setIsLoading(true);
    try {
      await changePassword(data.newPassword);
      toast.success('Password changed successfully');
      reset();
    } catch (error: any) {
      console.error('Password change error:', error);
      toast.error(error.message || 'Failed to change password');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Change Password</CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <Input
            {...register('currentPassword')}
            type="password"
            label="Current Password"
            error={errors.currentPassword?.message}
          />

          <Input
            {...register('newPassword')}
            type="password"
            label="New Password"
            error={errors.newPassword?.message}
          />

          <Input
            {...register('confirmPassword')}
            type="password"
            label="Confirm New Password"
            error={errors.confirmPassword?.message}
          />

          <Button type="submit" isLoading={isLoading}>
            Change Password
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

const SubscriptionSettings: React.FC = () => {
  const { user } = useAuthStore();
  const [isChangingPlan, setIsChangingPlan] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'basic' | 'premium' | 'enterprise'>('basic');
  const [showCancelDialog, setShowCancelDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  if (!user) {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <PageSpinner />
        </CardContent>
      </Card>
    );
  }

  if (!user.subscription || user.subscription.status === 'cancelled') {
    return <SubscriptionPlans onComplete={() => window.location.reload()} />;
  }

  if (user?.role !== 'student') {
    return (
      <Card>
        <CardContent className="p-12 text-center">
          <p className="text-muted-foreground">
            Subscription settings are only available for students
          </p>
        </CardContent>
      </Card>
    );
  }

  const subscription = user.subscription;

  const handleChangePlan = async () => {
    if (!user) return;
    
    // ✅ Get user ID with fallback
    const userId = user.id || user.uid;
    
    if (!userId) {
      toast.error('User ID not found');
      return;
    }
    
    setIsLoading(true);
    try {
      await updateDocument('users', userId, {
        'subscription.plan': selectedPlan,
        'subscription.status': 'active',
      });
      
      toast.success(`Plan changed to ${selectedPlan}!`);
      setIsChangingPlan(false);
      window.location.reload();
    } catch (error) {
      console.error('Error changing plan:', error);
      toast.error('Failed to change plan');
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelSubscription = async () => {
    if (!user) return;
    
    // ✅ Get user ID with fallback
    const userId = user.id || user.uid;
    
    if (!userId) {
      console.error('No user ID found:', user);
      toast.error('Unable to cancel subscription: User ID not found');
      return;
    }
    
    setIsLoading(true);
    try {
      await updateDocument('users', userId, {
        'subscription.status': 'cancelled',
        'subscription.cancelledAt': serverTimestamp(),
      });
      
      toast.success('Subscription cancelled successfully');
      setShowCancelDialog(false);
      window.location.reload();
    } catch (error) {
      console.error('Error cancelling subscription:', error);
      toast.error('Failed to cancel subscription');
    } finally {
      setIsLoading(false);
    }
  };

  const plans = [
    {
      id: 'basic',
      name: 'Basic',
      price: 29,
      features: [
        '10 assignments per month',
        'Email support',
        'Basic progress tracking',
        'Community access',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 49,
      features: [
        'Unlimited assignments',
        'Priority email support',
        'Advanced analytics',
        'One-on-one sessions (2/month)',
        'Personalized learning path',
      ],
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 99,
      features: [
        'Everything in Premium',
        'Dedicated teacher',
        'Weekly one-on-one sessions',
        'Custom curriculum',
        'Priority support 24/7',
      ],
    },
  ];

  const currentPlan = plans.find(p => p.id === subscription.plan) || plans[0];

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Subscription</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-2xl font-bold capitalize">{subscription.plan} Plan</p>
                <p className="text-muted-foreground">
                  Status: <span className={`font-medium capitalize ${
                    subscription.status === 'active' ? 'text-green-600' :
                    subscription.status === 'trialing' ? 'text-blue-600' :
                    subscription.status === 'cancelled' ? 'text-red-600' :
                    'text-yellow-600'
                  }`}>
                    {subscription.status}
                  </span>
                </p>
              </div>
              <div className="text-right">
                <p className="text-3xl font-bold">
                  ${currentPlan.price}
                  <span className="text-lg font-normal text-muted-foreground">/month</span>
                </p>
              </div>
            </div>

            {subscription.startDate && (
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Started:</span>
                  <span>
                    {subscription.startDate.toDate 
                      ? subscription.startDate.toDate().toLocaleDateString()
                      : new Date(subscription.startDate).toLocaleDateString()
                    }
                  </span>
                </div>
                {subscription.endDate && subscription.status !== 'cancelled' && (
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Renews:</span>
                    <span>
                      {subscription.endDate.toDate 
                        ? subscription.endDate.toDate().toLocaleDateString()
                        : new Date(subscription.endDate).toLocaleDateString()
                      }
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>

          {subscription.status !== 'cancelled' && (
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={() => setIsChangingPlan(true)}
              >
                Change Plan
              </Button>
              <Button 
                variant="destructive"
                onClick={() => setShowCancelDialog(true)}
              >
                Cancel Subscription
              </Button>
            </div>
          )}

          {subscription.status === 'cancelled' && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-800 dark:text-red-200 mb-3">
                Your subscription has been cancelled. You'll have access until the end of your billing period.
              </p>
              <Button 
                variant="default" 
                onClick={() => setIsChangingPlan(true)}
              >
                Reactivate Subscription
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Change Plan Dialog */}
      {isChangingPlan && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Choose Your Plan</CardTitle>
                <button 
                  onClick={() => setIsChangingPlan(false)}
                  className="text-muted-foreground hover:text-foreground text-2xl leading-none"
                >
                  ✕
                </button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {plans.map((plan) => (
                  <div
                    key={plan.id}
                    className={`p-6 border-2 rounded-lg cursor-pointer transition-all ${
                      selectedPlan === plan.id
                        ? 'border-primary bg-primary/5'
                        : 'border-border hover:border-primary/50'
                    }`}
                    onClick={() => setSelectedPlan(plan.id as any)}
                  >
                    <h3 className="text-xl font-bold mb-2">{plan.name}</h3>
                    <p className="text-3xl font-bold mb-4">
                      ${plan.price}
                      <span className="text-lg font-normal text-muted-foreground">/mo</span>
                    </p>
                    <ul className="space-y-2">
                      {plan.features.map((feature, index) => (
                        <li key={index} className="flex items-start gap-2 text-sm">
                          <span className="text-green-600 mt-0.5">✓</span>
                          <span>{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
              <div className="flex gap-3 mt-6">
                <Button 
                  onClick={handleChangePlan} 
                  className="flex-1"
                  isLoading={isLoading}
                >
                  Confirm Plan Change
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setIsChangingPlan(false)}
                  disabled={isLoading}
                >
                  Cancel
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Cancel Subscription Dialog */}
      {showCancelDialog && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <Card className="w-full max-w-md">
            <CardHeader>
              <CardTitle>Cancel Subscription?</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                Are you sure you want to cancel your subscription? You'll lose access to:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✗</span>
                  <span>Unlimited assignments</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✗</span>
                  <span>Progress tracking</span>
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-red-600">✗</span>
                  <span>Teacher support</span>
                </li>
              </ul>
              <div className="flex gap-3 mt-6">
                <Button 
                  variant="destructive" 
                  onClick={handleCancelSubscription}
                  className="flex-1"
                  isLoading={isLoading}
                >
                  Yes, Cancel
                </Button>
                <Button 
                  variant="outline" 
                  onClick={() => setShowCancelDialog(false)}
                  className="flex-1"
                  disabled={isLoading}
                >
                  Keep Subscription
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </>
  );
};