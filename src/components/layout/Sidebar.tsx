import React from 'react';
import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  BookOpen,
  Users,
  MessageSquare,
  BarChart3,
  Settings,
  FileText,
  DollarSign,
  UserCog,
} from 'lucide-react';
import { useAuthStore } from '@/store/authStore';
import { useUIStore } from '@/store/uiStore';
import { cn } from '@/utils/cn';
import type { UserRole } from '@/types';

interface NavItem {
  label: string;
  icon: React.ReactNode;
  href: string;
  roles: UserRole[];
}

const navItems: NavItem[] = [
  {
    label: 'Dashboard',
    icon: <LayoutDashboard className="h-5 w-5" />,
    href: '/dashboard',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    label: 'Assignments',
    icon: <BookOpen className="h-5 w-5" />,
    href: '/assignments',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    label: 'Students',
    icon: <Users className="h-5 w-5" />,
    href: '/students',
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Teachers',
    icon: <UserCog className="h-5 w-5" />,
    href: '/teachers',
    roles: ['admin'],
  },
  {
    label: 'Messages',
    icon: <MessageSquare className="h-5 w-5" />,
    href: '/messages',
    roles: ['admin', 'teacher', 'student'],
  },
  {
    label: 'Progress',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/progress',
    roles: ['student'],
  },
  {
    label: 'Analytics',
    icon: <BarChart3 className="h-5 w-5" />,
    href: '/analytics',
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Financials',
    icon: <DollarSign className="h-5 w-5" />,
    href: '/financials',
    roles: ['admin'],
  },
  {
    label: 'Library',
    icon: <FileText className="h-5 w-5" />,
    href: '/library',
    roles: ['admin', 'teacher'],
  },
  {
    label: 'Settings',
    icon: <Settings className="h-5 w-5" />,
    href: '/settings',
    roles: ['admin', 'teacher', 'student'],
  },
];

export const Sidebar: React.FC = () => {
  const { user } = useAuthStore();
  const { sidebarOpen, setSidebarOpen } = useUIStore();

  const filteredNavItems = navItems.filter((item) =>
    user?.role ? item.roles.includes(user.role) : false
  );

  return (
    <>
      {/* Mobile Overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/50 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={cn(
          'fixed left-0 top-16 z-40 h-[calc(100vh-4rem)] w-64 border-r bg-background transition-transform lg:translate-x-0',
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        )}
      >
        <nav className="flex flex-col gap-1 p-4">
          {filteredNavItems.map((item) => (
            <NavLink
              key={item.href}
              to={item.href}
              onClick={() => setSidebarOpen(false)}
              className={({ isActive }) =>
                cn(
                  'flex items-center gap-3 px-3 py-2 rounded-lg transition-colors',
                  isActive
                    ? 'bg-primary text-primary-foreground'
                    : 'hover:bg-accent'
                )
              }
            >
              {item.icon}
              <span className="font-medium">{item.label}</span>
            </NavLink>
          ))}
        </nav>
      </aside>

      {/* Spacer for desktop */}
      <div className="hidden lg:block w-64 flex-shrink-0" />
    </>
  );
};