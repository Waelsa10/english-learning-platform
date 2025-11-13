import { Timestamp } from 'firebase/firestore';

export type UserRole = 'admin' | 'teacher' | 'student';

export type EnglishLevel = 'beginner' | 'intermediate' | 'advanced';

export type AssignmentType = 'reading' | 'writing' | 'listening' | 'speaking' | 'grammar' | 'vocabulary';

export type AssignmentDifficulty = 'easy' | 'medium' | 'hard';

export type SubscriptionStatus = 'active' | 'past_due' | 'canceled' | 'trialing' | 'expired';

export type SubscriptionPlan = 'basic' | 'premium' | 'enterprise';

export type MessageType = 'text' | 'voice' | 'file' | 'image';

export type MessageStatus = 'sent' | 'delivered' | 'read';

export type NotificationType = 'assignment' | 'grade' | 'message' | 'system' | 'subscription';

export type SubmissionStatus = 'draft' | 'submitted' | 'graded' | 'returned';

export type ThemeMode = 'light' | 'dark' | 'auto';

export interface UserProfile {
  fullName: string;
  phoneNumber?: string;
  profilePicture?: string;
  timezone: string;
  preferredLanguage: string;
  bio?: string;
  country?: string;
}

export interface UserSettings {
  theme: ThemeMode;
  notifications: {
    email: boolean;
    push: boolean;
    sms: boolean;
  };
}

export interface UserMetadata {
  createdAt: Timestamp;
  lastLogin: Timestamp;
  isActive: boolean;
  isEmailVerified: boolean;
}

export interface BaseUser {
  uid: string;
  email: string;
  role: UserRole;
  profile: UserProfile;
  settings: UserSettings;
  metadata: UserMetadata;
}

export interface StudentProgress {
  overallProgress: number;
  skillsBreakdown: {
    reading: number;
    writing: number;
    listening: number;
    speaking: number;
    grammar: number;
  };
  totalAssignments: number;
  completedAssignments: number;
  averageScore: number;
  timeSpent: number; // in minutes
  streak: number;
  lastActivityDate?: Timestamp;
}

export interface Subscription {
  plan: SubscriptionPlan;
  startDate: Timestamp;
  endDate: Timestamp;
  status: SubscriptionStatus;
  stripeSubscriptionId?: string;
  stripeCustomerId?: string;
  cancelAtPeriodEnd?: boolean;
}

export interface Student extends BaseUser {
  role: 'student';
  assignedTeacher: string | null;
  englishLevel: EnglishLevel;
  learningGoals: string[];
  subscription: Subscription;
  progress: StudentProgress;
  onboarding?: {
    steps: Array<{
      id: string;
      completed: boolean;
    }>;
    progress: number;
  };
}

export interface TeacherQualifications {
  experience: number; // years
  certifications: string[];
  specializations: string[];
  education?: string;
}

export interface TeacherAvailability {
  schedule: {
    [day: string]: { start: string; end: string }[];
  };
  maxStudents: number;
  timezone: string;
}

export interface Teacher extends BaseUser {
  role: 'teacher';
  assignedStudents: string[];
  qualifications: TeacherQualifications;
  availability: TeacherAvailability;
  rating: number;
  totalStudentsTaught: number;
  hourlyRate?: number;
  isApproved: boolean;
  approvedAt?: Timestamp;
  approvedBy?: string;
}

export interface Admin extends BaseUser {
  role: 'admin';
  permissions: string[];
}

export type User = Student | Teacher | Admin;

export interface QuestionOption {
  id: string;
  text: string;
  isCorrect?: boolean;
}

export interface AssignmentQuestion {
  id: string;
  type: 'multiple_choice' | 'fill_blank' | 'essay' | 'audio' | 'video' | 'file_upload';
  question: string;
  options?: QuestionOption[];
  correctAnswer?: string | string[];
  points: number;
  explanation?: string;
}

export interface AssignmentContent {
  instructions: string;
  questions: AssignmentQuestion[];
  resources?: {
    title: string;
    url: string;
    type: 'pdf' | 'video' | 'audio' | 'link';
  }[];
}

export interface Assignment {
  id: string;
  title: string;
  description: string;
  type: AssignmentType;
  difficulty: AssignmentDifficulty;
  createdBy: string;
  createdByName?: string;
  assignedTo: string[];
  content: AssignmentContent;
  dueDate: Timestamp;
  dueDateUTC: Timestamp;
  createdInTimezone: string;
  points: number;
  timeLimit?: number; // in minutes
  attemptsAllowed: number;
  isTemplate: boolean;
  assignmentSource: 'library' | 'teacher_created';
  libraryCategory?: string;
  customizations?: {
    [studentId: string]: {
      dueDate?: Timestamp;
      modifiedInstructions?: string;
    };
  };
  createdAt: Timestamp;
  updatedAt: Timestamp;
  isActive: boolean;
}

export interface Answer {
  questionId: string;
  answer: string | string[];
  fileUrl?: string;
  audioUrl?: string;
  videoUrl?: string;
}

export interface RubricScore {
  criterion: string;
  score: number;
  maxScore: number;
  feedback?: string;
}

export interface Grading {
  score: number;
  maxScore: number;
  percentage: number;
  feedback: string;
  rubricScores?: RubricScore[];
  gradedBy: string;
  gradedByName?: string;
  gradedAt: Timestamp;
  voiceFeedbackUrl?: string;
}

export interface Submission {
  id: string;
  assignmentId: string;
  studentId: string;
  studentName?: string;
  submittedAt: Timestamp;
  status: SubmissionStatus;
  content: {
    answers: Answer[];
    attachments?: string[];
    timeSpent: number;
  };
  grading?: Grading;
  attemptNumber: number;
  autoSave: {
    lastSaved: Timestamp;
    progress: number;
  };
}

export interface Conversation {
  id: string;
  participants: string[];
  participantDetails: {
    [userId: string]: {
      name: string;
      profilePicture?: string;
      role: UserRole;
    };
  };
  lastMessage: string;
  lastMessageAt: Timestamp;
  unreadCount: {
    [userId: string]: number;
  };
  createdAt: Timestamp;
}

export interface Message {
  id: string;
  conversationId: string;
  senderId: string;
  senderName: string;
  senderRole: UserRole;
  receiverId: string;
  type: MessageType;
  content: string;
  fileUrl?: string;
  fileName?: string;
  fileSize?: number;
  status: MessageStatus;
  timestamp: Timestamp;
  isDeleted: boolean;
  readAt?: Timestamp;
}

export interface Notification {
  id: string;
  recipientId: string;
  type: NotificationType;
  title: string;
  body: string;
  data?: Record<string, any>;
  read: boolean;
  actionUrl?: string;
  createdAt: Timestamp;
  expiresAt?: Timestamp;
}

export interface TeacherInvitation {
  id: string;
  email: string;
  invitedBy: string;
  invitedByName: string;
  invitedAt: Timestamp;
  status: 'sent' | 'accepted' | 'expired';
  activationToken: string;
  expiresAt: Timestamp;
  acceptedAt?: Timestamp;
  teacherData: Partial<Teacher>;
}

export interface TeacherApplication {
  id: string;
  applicantEmail: string;
  fullName: string;
  phoneNumber: string;
  qualifications: TeacherQualifications;
  bio: string;
  status: 'pending' | 'approved' | 'rejected';
  appliedAt: Timestamp;
  reviewedBy?: string;
  reviewedAt?: Timestamp;
  rejectionReason?: string;
}

export interface PaymentHistory {
  id: string;
  userId: string;
  stripePaymentIntentId: string;
  amount: number;
  currency: string;
  status: 'succeeded' | 'failed' | 'refunded';
  description: string;
  createdAt: Timestamp;
  invoiceUrl?: string;
}

export interface PlatformAnalytics {
  totalUsers: number;
  activeStudents: number;
  activeTeachers: number;
  totalAssignments: number;
  completedAssignments: number;
  averageCompletionRate: number;
  monthlyRecurringRevenue: number;
  newRegistrationsThisWeek: number;
  newRegistrationsThisMonth: number;
  averageEngagementRate: number;
}