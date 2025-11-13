import type { UserRole, User } from '@/types';

export const hasRole = (user: User | null, role: UserRole): boolean => {
  return user?.role === role;
};

export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin');
};

export const isTeacher = (user: User | null): boolean => {
  return hasRole(user, 'teacher');
};

export const isStudent = (user: User | null): boolean => {
  return hasRole(user, 'student');
};

export const canAccessRoute = (user: User | null, allowedRoles: UserRole[]): boolean => {
  return !!user && allowedRoles.includes(user.role);
};

export const canEditAssignment = (user: User | null, createdBy: string): boolean => {
  if (!user) return false;
  return isAdmin(user) || (isTeacher(user) && user.uid === createdBy);
};

export const canGradeSubmission = (user: User | null, teacherId?: string): boolean => {
  if (!user) return false;
  return isAdmin(user) || (isTeacher(user) && (!teacherId || user.uid === teacherId));
};

export const canViewStudent = (
  user: User | null,
  studentId: string,
  assignedTeacher?: string | null
): boolean => {
  if (!user) return false;
  if (isAdmin(user)) return true;
  if (isStudent(user)) return user.uid === studentId;
  if (isTeacher(user)) return assignedTeacher === user.uid;
  return false;
};