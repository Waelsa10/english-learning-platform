import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
} from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import { sendWelcomeEmail } from '@/lib/emailjs';
import type { Student, UserProfile } from '@/types';

interface RegisterStudentData {
  email: string;
  password: string;
  fullName: string;
  phoneNumber?: string;
  country?: string;
  timezone: string;
  preferredLanguage: string;
  englishLevel: 'beginner' | 'intermediate' | 'advanced';
  learningGoals: string[];
}

export const registerStudent = async (data: RegisterStudentData) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const user = userCredential.user;

    await updateProfile(user, {
      displayName: data.fullName,
    });

    await sendEmailVerification(user);

    const studentData: Omit<Student, 'uid'> = {
      email: data.email,
      role: 'student',
      profile: {
        fullName: data.fullName,
        phoneNumber: data.phoneNumber,
        timezone: data.timezone,
        preferredLanguage: data.preferredLanguage,
        country: data.country,
      },
      settings: {
        theme: 'light',
        notifications: {
          email: true,
          push: true,
          sms: false,
        },
      },
      metadata: {
        createdAt: serverTimestamp() as any,
        lastLogin: serverTimestamp() as any,
        isActive: true,
        isEmailVerified: false,
      },
      assignedTeacher: null,
      englishLevel: data.englishLevel,
      learningGoals: data.learningGoals,
      subscription: {
        plan: 'basic',
        startDate: serverTimestamp() as any,
        endDate: serverTimestamp() as any,
        status: 'trialing',
      },
      progress: {
        overallProgress: 0,
        skillsBreakdown: {
          reading: 0,
          writing: 0,
          listening: 0,
          speaking: 0,
          grammar: 0,
        },
        totalAssignments: 0,
        completedAssignments: 0,
        averageScore: 0,
        timeSpent: 0,
        streak: 0,
      },
      onboarding: {
        steps: [
          { id: 'profile', completed: true },
          { id: 'level_test', completed: false },
          { id: 'first_assignment', completed: false },
          { id: 'chat_teacher', completed: false },
        ],
        progress: 25,
      },
    };

    await setDoc(doc(db, 'users', user.uid), studentData);
    await setDoc(doc(db, 'students', user.uid), {
      userId: user.uid,
      ...studentData,
    });

    // Send welcome email (async, don't wait)
    sendWelcomeEmail(data.email, data.fullName).catch(console.error);

    return { user, studentData };
  } catch (error: any) {
    console.error('Registration error:', error);
    throw new Error(error.message || 'Failed to register');
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    await setDoc(
      doc(db, 'users', user.uid),
      {
        metadata: {
          lastLogin: serverTimestamp(),
        },
      },
      { merge: true }
    );

    return user;
  } catch (error: any) {
    console.error('Sign in error:', error);
    throw new Error(error.message || 'Failed to sign in');
  }
};

// ❌ REMOVED: signInWithGoogle function

export const signOut = async () => {
  try {
    await firebaseSignOut(auth);
  } catch (error: any) {
    console.error('Sign out error:', error);
    throw new Error(error.message || 'Failed to sign out');
  }
};

export const resetPassword = async (email: string) => {
  try {
    await sendPasswordResetEmail(auth, email);
  } catch (error: any) {
    console.error('Password reset error:', error);
    throw new Error(error.message || 'Failed to send password reset email');
  }
};

export const changePassword = async (newPassword: string) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');
    await updatePassword(user, newPassword);
  } catch (error: any) {
    console.error('Change password error:', error);
    throw new Error(error.message || 'Failed to change password');
  }
};

export const updateUserProfile = async (updates: Partial<UserProfile>) => {
  try {
    const user = auth.currentUser;
    if (!user) throw new Error('No user logged in');

    await setDoc(
      doc(db, 'users', user.uid),
      {
        profile: updates,
      },
      { merge: true }
    );
  } catch (error: any) {
    console.error('Update profile error:', error);
    throw new Error(error.message || 'Failed to update profile');
  }
};