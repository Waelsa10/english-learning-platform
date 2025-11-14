import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Menu, Bell, User, Settings, LogOut, Moon, Sun } from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { useNotificationStore } from '@/store/notificationStore';
import { signOut } from '@/lib/firebase/auth';
import { Avatar } from '@/components/common/Avatar';
import { Badge } from '@/components/common/Badge';
import toast from 'react-hot-toast';

export const Header: React.FC = () => {
  const navigate = useNavigate();
  const { user } = useAuthStore();
  const { theme, setTheme, toggleSidebar } = useUIStore();
  const { unreadCount } = useNotificationStore();
  const [showUserMenu, setShowUserMenu] = useState(false);

  const handleSignOut = async () => {
    try {
      await signOut();
      toast.success('Signed out successfully');
      navigate('/login');
    } catch (error) {
      toast.error('Failed to sign out');
    }
  };

  const toggleTheme = () => {
    setTheme(theme === 'light' ? 'dark' : 'light');
  };

  const getInitials = (name: string) => {
    return name
      .split(' ')
      .map((n) => n[0])
      .join('')
      .toUpperCase()
      .slice(0, 2);
  };

  if (!user) {
    return null;
  }

  // ✅ Get the correct dashboard route based on role
  const getDashboardRoute = () => {
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'teacher') return '/teacher/dashboard';
    return '/dashboard';
  };

  return (
    <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container flex h-16 items-center justify-between px-4">
        <div className="flex items-center gap-4">
          <button
            onClick={toggleSidebar}
            className="p-2 rounded-lg hover:bg-accent transition-colors lg:hidden"
          >
            <Menu className="h-5 w-5" />
          </button>

          {/* ✅ Updated logo link to go to role-specific dashboard */}
          <Link to={getDashboardRoute()} className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">E</span>
            </div>
            <span className="font-bold text-xl hidden sm:inline">
              English Learning
            </span>
          </Link>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={toggleTheme}
            className="p-2 rounded-lg hover:bg-accent transition-colors"
          >
            {theme === 'light' ? (
              <Moon className="h-5 w-5" />
            ) : (
              <Sun className="h-5 w-5" />
            )}
          </button>

          <Link
            to="/notifications"
            className="p-2 rounded-lg hover:bg-accent transition-colors relative"
          >
            <Bell className="h-5 w-5" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 h-2 w-2 bg-destructive rounded-full" />
            )}
          </Link>

          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center gap-2 p-1 rounded-lg hover:bg-accent transition-colors"
            >
              <Avatar
                src={user?.profile?.profilePicture}
                fallback={getInitials(user?.profile?.fullName || 'User')}
                size="sm"
              />
              <span className="hidden md:inline font-medium">
                {user?.profile?.fullName || user?.email || 'User'}
              </span>
            </button>

            {showUserMenu && (
              <>
                <div
                  className="fixed inset-0 z-40"
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-56 bg-background border rounded-lg shadow-lg z-50">
                  <div className="p-3 border-b">
                    <p className="font-medium">{user?.profile?.fullName || 'User'}</p>
                    <p className="text-sm text-muted-foreground">{user?.email}</p>
                    <Badge variant="info" className="mt-1">
                      {user?.role || 'user'}
                    </Badge>
                  </div>
                  <div className="p-1">
                    <Link
                      to="/profile"
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <User className="h-4 w-4" />
                      Profile
                    </Link>
                    <Link
                      to="/settings"
                      className="flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors"
                      onClick={() => setShowUserMenu(false)}
                    >
                      <Settings className="h-4 w-4" />
                      Settings
                    </Link>
                    <button
                      onClick={handleSignOut}
                      className="w-full flex items-center gap-2 px-3 py-2 rounded-md hover:bg-accent transition-colors text-destructive"
                    >
                      <LogOut className="h-4 w-4" />
                      Sign Out
                    </button>
                  </div>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};