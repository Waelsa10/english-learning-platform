import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  startAfter,
  Timestamp,
  QueryConstraint,
  DocumentSnapshot,
  serverTimestamp,
  increment,
  arrayUnion,
  arrayRemove,
} from 'firebase/firestore';
import { db } from './config';
import type {
  User,
  Student,
  Teacher,
  Assignment,
  Submission,
  Message,
  Conversation,
  Notification,
} from '@/types';

// Generic CRUD operations
export const createDocument = async <T>(
  collectionName: string,
  id: string,
  data: T
) => {
  try {
    await setDoc(doc(db, collectionName, id), {
      ...data,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return id;
  } catch (error) {
    console.error(`Error creating document in ${collectionName}:`, error);
    throw error;
  }
};

export const getDocument = async <T>(
  collectionName: string,
  id: string
): Promise<T | null> => {
  try {
    const docRef = doc(db, collectionName, id);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      return { id: docSnap.id, ...docSnap.data() } as T;
    }
    return null;
  } catch (error) {
    console.error(`Error getting document from ${collectionName}:`, error);
    throw error;
  }
};

export const updateDocument = async <T>(
  collectionName: string,
  id: string,
  data: Partial<T>
) => {
  try {
    const docRef = doc(db, collectionName, id);
    await updateDoc(docRef, {
      ...data,
      updatedAt: serverTimestamp(),
    });
  } catch (error) {
    console.error(`Error updating document in ${collectionName}:`, error);
    throw error;
  }
};

export const deleteDocument = async (collectionName: string, id: string) => {
  try {
    await deleteDoc(doc(db, collectionName, id));
  } catch (error) {
    console.error(`Error deleting document from ${collectionName}:`, error);
    throw error;
  }
};

export const queryDocuments = async <T>(
  collectionName: string,
  constraints: QueryConstraint[]
): Promise<T[]> => {
  try {
    const q = query(collection(db, collectionName), ...constraints);
    const querySnapshot = await getDocs(q);

    return querySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
    })) as T[];
  } catch (error) {
    console.error(`Error querying ${collectionName}:`, error);
    throw error;
  }
};

// User operations
export const getUserByUid = async (uid: string): Promise<User | null> => {
  return getDocument<User>('users', uid);
};

export const getStudentByUid = async (uid: string): Promise<Student | null> => {
  return getDocument<Student>('students', uid);
};

export const getTeacherByUid = async (uid: string): Promise<Teacher | null> => {
  return getDocument<Teacher>('teachers', uid);
};

export const getAllStudents = async (): Promise<Student[]> => {
  return queryDocuments<Student>('students', [
    where('metadata.isActive', '==', true),
    orderBy('metadata.createdAt', 'desc'),
  ]);
};

export const getAllTeachers = async (): Promise<Teacher[]> => {
  return queryDocuments<Teacher>('teachers', [
    where('metadata.isActive', '==', true),
    orderBy('metadata.createdAt', 'desc'),
  ]);
};

export const getTeacherStudents = async (teacherId: string): Promise<Student[]> => {
  return queryDocuments<Student>('students', [
    where('assignedTeacher', '==', teacherId),
    where('metadata.isActive', '==', true),
  ]);
};

export const assignStudentToTeacher = async (
  studentId: string,
  teacherId: string
) => {
  try {
    // Update student
    await updateDoc(doc(db, 'students', studentId), {
      assignedTeacher: teacherId,
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', studentId), {
      'metadata.updatedAt': serverTimestamp(),
    });

    // Update teacher's assigned students
    await updateDoc(doc(db, 'teachers', teacherId), {
      assignedStudents: arrayUnion(studentId),
      updatedAt: serverTimestamp(),
    });

    await updateDoc(doc(db, 'users', teacherId), {
      'metadata.updatedAt': serverTimestamp(),
    });
  } catch (error) {
    console.error('Error assigning student to teacher:', error);
    throw error;
  }
};

// Assignment operations
export const createAssignment = async (
  assignment: Omit<Assignment, 'id' | 'createdAt' | 'updatedAt'>
): Promise<string> => {
  try {
    const assignmentRef = doc(collection(db, 'assignments'));
    await setDoc(assignmentRef, {
      ...assignment,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    });
    return assignmentRef.id;
  } catch (error) {
    console.error('Error creating assignment:', error);
    throw error;
  }
};

export const getAssignmentById = async (id: string): Promise<Assignment | null> => {
  return getDocument<Assignment>('assignments', id);
};

export const getAssignmentsForStudent = async (
  studentId: string
): Promise<Assignment[]> => {
  return queryDocuments<Assignment>('assignments', [
    where('assignedTo', 'array-contains', studentId),
    where('isActive', '==', true),
    orderBy('dueDate', 'asc'),
  ]);
};

export const getAssignmentsByTeacher = async (
  teacherId: string
): Promise<Assignment[]> => {
  return queryDocuments<Assignment>('assignments', [
    where('createdBy', '==', teacherId),
    where('isActive', '==', true),
    orderBy('createdAt', 'desc'),
  ]);
};

export const updateAssignment = async (
  id: string,
  updates: Partial<Assignment>
) => {
  return updateDocument<Assignment>('assignments', id, updates);
};

export const deleteAssignment = async (id: string) => {
  return updateDocument<Assignment>('assignments', id, { isActive: false });
};

// Submission operations
export const createSubmission = async (
  submission: Omit<Submission, 'id'>
): Promise<string> => {
  try {
    const submissionRef = doc(collection(db, 'submissions'));
    await setDoc(submissionRef, {
      ...submission,
      submittedAt: serverTimestamp(),
    });
    return submissionRef.id;
  } catch (error) {
    console.error('Error creating submission:', error);
    throw error;
  }
};

export const getSubmissionById = async (id: string): Promise<Submission | null> => {
  return getDocument<Submission>('submissions', id);
};

export const getSubmissionsForAssignment = async (
  assignmentId: string
): Promise<Submission[]> => {
  return queryDocuments<Submission>('submissions', [
    where('assignmentId', '==', assignmentId),
    orderBy('submittedAt', 'desc'),
  ]);
};

export const getStudentSubmissions = async (
  studentId: string
): Promise<Submission[]> => {
  return queryDocuments<Submission>('submissions', [
    where('studentId', '==', studentId),
    orderBy('submittedAt', 'desc'),
  ]);
};

export const updateSubmission = async (
  id: string,
  updates: Partial<Submission>
) => {
  return updateDocument<Submission>('submissions', id, updates);
};

export const gradeSubmission = async (
  submissionId: string,
  grading: Submission['grading']
) => {
  try {
    await updateDoc(doc(db, 'submissions', submissionId), {
      grading,
      status: 'graded',
      updatedAt: serverTimestamp(),
    });

    // Update student progress
    const submission = await getSubmissionById(submissionId);
    if (submission && grading) {
      const student = await getStudentByUid(submission.studentId);
      if (student) {
        const newCompletedCount = student.progress.completedAssignments + 1;
        const newAverageScore =
          (student.progress.averageScore * student.progress.completedAssignments +
            grading.percentage) /
          newCompletedCount;

        await updateDoc(doc(db, 'students', submission.studentId), {
          'progress.completedAssignments': increment(1),
          'progress.averageScore': newAverageScore,
          updatedAt: serverTimestamp(),
        });

        await updateDoc(doc(db, 'users', submission.studentId), {
          'metadata.updatedAt': serverTimestamp(),
        });
      }
    }
  } catch (error) {
    console.error('Error grading submission:', error);
    throw error;
  }
};

// Message and Conversation operations
export const createConversation = async (
  participants: string[],
  participantDetails: Conversation['participantDetails']
): Promise<string> => {
  try {
    const conversationRef = doc(collection(db, 'conversations'));
    const conversationData: Omit<Conversation, 'id'> = {
      participants,
      participantDetails,
      lastMessage: '',
      lastMessageAt: serverTimestamp() as any,
      unreadCount: participants.reduce((acc, p) => ({ ...acc, [p]: 0 }), {}),
      createdAt: serverTimestamp() as any,
    };

    await setDoc(conversationRef, conversationData);
    return conversationRef.id;
  } catch (error) {
    console.error('Error creating conversation:', error);
    throw error;
  }
};

export const getOrCreateConversation = async (
  user1Id: string,
  user2Id: string,
  user1Details: Conversation['participantDetails'][string],
  user2Details: Conversation['participantDetails'][string]
): Promise<string> => {
  try {
    // Check if conversation exists
    const conversations = await queryDocuments<Conversation>('conversations', [
      where('participants', 'array-contains', user1Id),
    ]);

    const existingConversation = conversations.find((conv) =>
      conv.participants.includes(user2Id)
    );

    if (existingConversation) {
      return existingConversation.id;
    }

    // Create new conversation
    return await createConversation(
      [user1Id, user2Id],
      {
        [user1Id]: user1Details,
        [user2Id]: user2Details,
      }
    );
  } catch (error) {
    console.error('Error getting or creating conversation:', error);
    throw error;
  }
};

export const getUserConversations = async (userId: string): Promise<Conversation[]> => {
  return queryDocuments<Conversation>('conversations', [
    where('participants', 'array-contains', userId),
    orderBy('lastMessageAt', 'desc'),
  ]);
};

export const sendMessage = async (
  message: Omit<Message, 'id' | 'timestamp'>
): Promise<string> => {
  try {
    const messageRef = doc(collection(db, 'messages'));
    await setDoc(messageRef, {
      ...message,
      timestamp: serverTimestamp(),
    });

    // Update conversation
    await updateDoc(doc(db, 'conversations', message.conversationId), {
      lastMessage: message.content,
      lastMessageAt: serverTimestamp(),
      [`unreadCount.${message.receiverId}`]: increment(1),
    });

    return messageRef.id;
  } catch (error) {
    console.error('Error sending message:', error);
    throw error;
  }
};

export const getConversationMessages = async (
  conversationId: string
): Promise<Message[]> => {
  return queryDocuments<Message>('messages', [
    where('conversationId', '==', conversationId),
    where('isDeleted', '==', false),
    orderBy('timestamp', 'asc'),
  ]);
};

export const markMessageAsRead = async (messageId: string, userId: string) => {
  try {
    const message = await getDocument<Message>('messages', messageId);
    if (message && message.receiverId === userId) {
      await updateDoc(doc(db, 'messages', messageId), {
        status: 'read',
        readAt: serverTimestamp(),
      });

      // Decrement unread count
      await updateDoc(doc(db, 'conversations', message.conversationId), {
        [`unreadCount.${userId}`]: increment(-1),
      });
    }
  } catch (error) {
    console.error('Error marking message as read:', error);
    throw error;
  }
};

// Notification operations
export const createNotification = async (
  notification: Omit<Notification, 'id' | 'createdAt'>
): Promise<string> => {
  try {
    const notificationRef = doc(collection(db, 'notifications'));
    await setDoc(notificationRef, {
      ...notification,
      createdAt: serverTimestamp(),
    });
    return notificationRef.id;
  } catch (error) {
    console.error('Error creating notification:', error);
    throw error;
  }
};

export const getUserNotifications = async (
  userId: string,
  limitCount = 50
): Promise<Notification[]> => {
  return queryDocuments<Notification>('notifications', [
    where('recipientId', '==', userId),
    orderBy('createdAt', 'desc'),
    limit(limitCount),
  ]);
};

export const markNotificationAsRead = async (notificationId: string) => {
  return updateDocument<Notification>('notifications', notificationId, {
    read: true,
  });
};

export const markAllNotificationsAsRead = async (userId: string) => {
  try {
    const notifications = await queryDocuments<Notification>('notifications', [
      where('recipientId', '==', userId),
      where('read', '==', false),
    ]);

    const updates = notifications.map((notif) =>
      updateDoc(doc(db, 'notifications', notif.id), { read: true })
    );

    await Promise.all(updates);
  } catch (error) {
    console.error('Error marking all notifications as read:', error);
    throw error;
  }
};