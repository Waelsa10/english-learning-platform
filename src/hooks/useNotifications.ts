import { useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { useNotificationStore } from '@/store/notificationStore';
import { getUserNotifications } from '@/lib/firebase/firestore';

export const useNotifications = () => {
  const { user } = useAuthStore();
  const { setNotifications } = useNotificationStore();

  const { data: notifications = [], isLoading } = useQuery({
    queryKey: ['notifications', user?.uid],
    queryFn: async () => {
      if (!user) return [];
      return getUserNotifications(user.uid);
    },
    enabled: !!user,
    refetchInterval: 30000,
  });

  useEffect(() => {
    setNotifications(notifications);
  }, [notifications]); // ✅ REMOVED setNotifications from dependencies

  return { notifications, isLoading };
};