import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import { getTeacherStudents, getAllStudents } from '@/lib/firebase/firestore';
import type { Student } from '@/types';

export const useStudents = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['students', user?.uid, user?.role],
    queryFn: async (): Promise<Student[]> => {
      if (!user) return [];

      if (user.role === 'teacher') {
        return getTeacherStudents(user.uid);
      } else if (user.role === 'admin') {
        return getAllStudents();
      }

      return [];
    },
    enabled: !!user && (user.role === 'teacher' || user.role === 'admin'),
    staleTime: 5 * 60 * 1000,
  });
};