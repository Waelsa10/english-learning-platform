import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut as firebaseSignOut,
  sendPasswordResetEmail,
  sendEmailVerification,
  updatePassword,
  updateProfile,
  User as FirebaseUser,
  GoogleAuthProvider,
  signInWithPopup,
  FacebookAuthProvider,
} from 'firebase/auth';
import { doc, setDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from './config';
import type { UserRole, Student, Teacher, UserProfile } from '@/types';

const googleProvider = new GoogleAuthProvider();
const facebookProvider = new FacebookAuthProvider();

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
    // Create Firebase Auth user
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      data.email,
      data.password
    );

    const user = userCredential.user;

    // Update profile
    await updateProfile(user, {
      displayName: data.fullName,
    });

    // Send verification email
    await sendEmailVerification(user);

    // Create student document
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
        endDate: serverTimestamp() as any, // Set proper end date in production
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

    // Update last login
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

export const signInWithGoogle = async () => {
  try {
    const result = await signInWithPopup(auth, googleProvider);
    const user = result.user;

    // Check if user document exists
    const userDoc = await getDoc(doc(db, 'users', user.uid));

    if (!userDoc.exists()) {
      // Create new student account for Google sign-in
      const studentData: Omit<Student, 'uid'> = {
        email: user.email!,
        role: 'student',
        profile: {
          fullName: user.displayName || 'Student',
          profilePicture: user.photoURL || undefined,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          preferredLanguage: 'en',
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
          isEmailVerified: user.emailVerified,
        },
        assignedTeacher: null,
        englishLevel: 'beginner',
        learningGoals: [],
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
      };

      await setDoc(doc(db, 'users', user.uid), studentData);
      await setDoc(doc(db, 'students', user.uid), {
        userId: user.uid,
        ...studentData,
      });
    } else {
      // Update last login
      await setDoc(
        doc(db, 'users', user.uid),
        {
          metadata: {
            lastLogin: serverTimestamp(),
          },
        },
        { merge: true }
      );
    }

    return user;
  } catch (error: any) {
    console.error('Google sign in error:', error);
    throw new Error(error.message || 'Failed to sign in with Google');
  }
};

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