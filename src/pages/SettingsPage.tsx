import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { User, Bell, Shield, CreditCard, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { updateUserProfile, changePassword } from '@/lib/firebase/auth';
import { updateDocument } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { Input } from '@/components/common/Input';
import { Avatar } from '@/components/common/Avatar';
import toast from 'react-hot-toast';

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

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<ProfileFormData>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      fullName: user?.profile.fullName,
      phoneNumber: user?.profile.phoneNumber,
      bio: user?.profile.bio,
    },
  });

  const onSubmit = async (data: ProfileFormData) => {
    if (!user) return;

    setIsLoading(true);
    try {
      await updateUserProfile(data);
      await updateDocument('users', user.uid, {
        profile: { ...user.profile, ...data },
      });

      setUser({ ...user, profile: { ...user.profile, ...data } });
      toast.success('Profile updated successfully');
    } catch (error) {
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
              src={user?.profile.profilePicture}
              fallback={user?.profile.fullName.charAt(0) || 'U'}
              size="xl"
            />
            <div>
              <Button variant="outline" size="sm">
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
  const [settings, setSettings] = useState(user?.settings.notifications);
  const [isLoading, setIsLoading] = useState(false);

  const handleSave = async () => {
    if (!user || !settings) return;

    setIsLoading(true);
    try {
      await updateDocument('users', user.uid, {
        settings: { ...user.settings, notifications: settings },
      });
      toast.success('Notification settings updated');
    } catch (error) {
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
              checked={settings?.email}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev!, email: e.target.checked }))
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
              checked={settings?.push}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev!, push: e.target.checked }))
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
              checked={settings?.sms}
              onChange={(e) =>
                setSettings((prev) => ({ ...prev!, sms: e.target.checked }))
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

  return (
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
                Status: <span className="font-medium capitalize">{subscription.status}</span>
              </p>
            </div>
          </div>

          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Started:</span>
              <span>{subscription.startDate.toDate().toLocaleDateString()}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Renews:</span>
              <span>{subscription.endDate.toDate().toLocaleDateString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button variant="outline">Change Plan</Button>
          <Button variant="destructive">Cancel Subscription</Button>
        </div>
      </CardContent>
    </Card>
  );
};