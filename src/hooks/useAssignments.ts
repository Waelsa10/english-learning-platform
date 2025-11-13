import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/store/authStore';
import {
  getAssignmentsForStudent,
  getAssignmentsByTeacher,
  queryDocuments,
} from '@/lib/firebase/firestore';
import { where } from 'firebase/firestore';
import type { Assignment } from '@/types';

export const useAssignments = () => {
  const { user } = useAuthStore();

  return useQuery({
    queryKey: ['assignments', user?.uid, user?.role],
    queryFn: async () => {
      if (!user) return [];

      if (user.role === 'student') {
        return getAssignmentsForStudent(user.uid);
      } else if (user.role === 'teacher') {
        return getAssignmentsByTeacher(user.uid);
      } else if (user.role === 'admin') {
        return queryDocuments<Assignment>('assignments', [
          where('isActive', '==', true),
        ]);
      }

      return [];
    },
    enabled: !!user,
    staleTime: 5 * 60 * 1000, // 5 minutes
  });
};