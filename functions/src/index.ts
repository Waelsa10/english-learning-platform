import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';
import { sendEmail } from './email';
import { 
  createTapCustomer, 
  handleTapWebhook, 
  cancelSubscription 
} from './tap'; // UPDATED: Changed from stripe

admin.initializeApp();

// Email notifications (UNCHANGED)
export const sendWelcomeEmail = functions.firestore
  .document('users/{userId}')
  .onCreate(async (snap, context) => {
    const user = snap.data();
    
    if (user.role === 'student') {
      await sendEmail({
        to: user.email,
        subject: 'Welcome to English Learning Platform!',
        template: 'welcome',
        data: {
          name: user.profile.fullName,
          dashboardUrl: `${process.env.APP_URL}/dashboard`,
        },
      });
    }
  });

export const sendAssignmentNotification = functions.firestore
  .document('assignments/{assignmentId}')
  .onCreate(async (snap, context) => {
    const assignment = snap.data();
    
    const notifications = assignment.assignedTo.map(async (studentId: string) => {
      const studentDoc = await admin.firestore().collection('students').doc(studentId).get();
      const student = studentDoc.data();
      
      if (!student) return;

      await admin.firestore().collection('notifications').add({
        recipientId: studentId,
        type: 'assignment',
        title: 'New Assignment',
        body: `You have a new assignment: ${assignment.title}`,
        data: { assignmentId: snap.id },
        read: false,
        actionUrl: `/assignments/${snap.id}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (student.settings?.notifications?.email) {
        await sendEmail({
          to: student.email,
          subject: `New Assignment: ${assignment.title}`,
          template: 'newAssignment',
          data: {
            studentName: student.profile.fullName,
            assignmentTitle: assignment.title,
            dueDate: assignment.dueDate.toDate().toLocaleDateString(),
            assignmentUrl: `${process.env.APP_URL}/assignments/${snap.id}`,
          },
        });
      }
    });

    await Promise.all(notifications);
  });

export const sendGradeNotification = functions.firestore
  .document('submissions/{submissionId}')
  .onUpdate(async (change, context) => {
    const before = change.before.data();
    const after = change.after.data();

    if (before.status !== 'graded' && after.status === 'graded') {
      const studentDoc = await admin.firestore().collection('students').doc(after.studentId).get();
      const student = studentDoc.data();
      
      if (!student) return;

      const assignmentDoc = await admin.firestore().collection('assignments').doc(after.assignmentId).get();
      const assignment = assignmentDoc.data();

      await admin.firestore().collection('notifications').add({
        recipientId: after.studentId,
        type: 'grade',
        title: 'Assignment Graded',
        body: `Your assignment "${assignment?.title}" has been graded: ${after.grading.percentage}%`,
        data: { submissionId: context.params.submissionId },
        read: false,
        actionUrl: `/submissions/${context.params.submissionId}`,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });

      if (student.settings?.notifications?.email) {
        await sendEmail({
          to: student.email,
          subject: `Assignment Graded: ${assignment?.title}`,
          template: 'assignmentGraded',
          data: {
            studentName: student.profile.fullName,
            assignmentTitle: assignment?.title,
            score: after.grading.percentage,
            feedback: after.grading.feedback,
            submissionUrl: `${process.env.APP_URL}/submissions/${context.params.submissionId}`,
          },
        });
      }
    }
  });

// Teacher invitation
export const createTeacherInvitation = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be authenticated');
  }

  const callerDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  const caller = callerDoc.data();

  if (caller?.role !== 'admin') {
    throw new functions.https.HttpsError('permission-denied', 'Must be admin');
  }

  const teacherUser = await admin.auth().createUser({
    email: data.email,
    password: generateRandomPassword(),
    displayName: data.fullName,
  });

  const teacherData = {
    email: data.email,
    role: 'teacher',
    profile: {
      fullName: data.fullName,
      phoneNumber: data.phoneNumber,
      timezone: data.timezone,
      preferredLanguage: 'en',
      bio: data.bio,
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
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLogin: admin.firestore.FieldValue.serverTimestamp(),
      isActive: true,
      isEmailVerified: false,
    },
    assignedStudents: [],
    qualifications: data.qualifications,
    availability: data.availability,
    rating: 0,
    totalStudentsTaught: 0,
    isApproved: false,
  };

  await admin.firestore().collection('users').doc(teacherUser.uid).set(teacherData);
  await admin.firestore().collection('teachers').doc(teacherUser.uid).set({
    userId: teacherUser.uid,
    ...teacherData,
  });

  const resetLink = await admin.auth().generatePasswordResetLink(data.email);
  
  await sendEmail({
    to: data.email,
    subject: 'Welcome to English Learning Platform - Teacher Invitation',
    template: 'teacherInvitation',
    data: {
      name: data.fullName,
      email: data.email,
      resetLink,
    },
  });

  return { success: true, teacherId: teacherUser.uid };
});

// UPDATED: Tap Payments integration
export const createTapCustomerOnSignup = functions.firestore
  .document('students/{studentId}')
  .onCreate(async (snap, context) => {
    const student = snap.data();
    
    try {
      const nameParts = student.profile.fullName.split(' ');
      const firstName = nameParts[0] || 'Student';
      const lastName = nameParts.slice(1).join(' ') || '';

      const customerId = await createTapCustomer({
        email: student.email,
        first_name: firstName,
        last_name: lastName,
        phone: {
          country_code: '966', // Saudi Arabia
          number: student.profile.phoneNumber || '500000000',
        },
        metadata: {
          studentId: context.params.studentId,
        },
      });

      await snap.ref.update({
        'subscription.tapCustomerId': customerId,
      });
    } catch (error) {
      console.error('Error creating Tap customer:', error);
    }
  });

// UPDATED: Tap webhook handler
export const tapWebhook = functions.https.onRequest(async (req, res) => {
  try {
    await handleTapWebhook(req, res);
  } catch (error) {
    console.error('Webhook error:', error);
    res.status(400).send('Webhook error');
  }
});

// Scheduled functions
export const sendDailyDigest = functions.pubsub
  .schedule('0 9 * * *')
  .timeZone('Asia/Riyadh') // UPDATED: Saudi Arabia timezone
  .onRun(async (context) => {
    const students = await admin.firestore().collection('students')
      .where('metadata.isActive', '==', true)
      .get();

    const emails = students.docs.map(async (doc) => {
      const student = doc.data();
      
      const assignments = await admin.firestore().collection('assignments')
        .where('assignedTo', 'array-contains', doc.id)
        .where('isActive', '==', true)
        .get();

      const pendingCount = assignments.docs.filter(a => {
        const dueDate = a.data().dueDate.toDate();
        return dueDate > new Date();
      }).length;

      if (pendingCount > 0 && student.settings?.notifications?.email) {
        await sendEmail({
          to: student.email,
          subject: 'Daily Learning Digest',
          template: 'dailyDigest',
          data: {
            name: student.profile.fullName,
            pendingAssignments: pendingCount,
            progress: student.progress.overallProgress,
            dashboardUrl: `${process.env.APP_URL}/dashboard`,
          },
        });
      }
    });

    await Promise.all(emails);
    return null;
  });

export const checkSubscriptionExpiry = functions.pubsub
  .schedule('0 0 * * *')
  .onRun(async (context) => {
    const now = admin.firestore.Timestamp.now();
    const sevenDaysFromNow = admin.firestore.Timestamp.fromDate(
      new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
    );

    const expiringStudents = await admin.firestore().collection('students')
      .where('subscription.endDate', '<=', sevenDaysFromNow)
      .where('subscription.endDate', '>', now)
      .where('subscription.status', '==', 'active')
      .get();

    const notifications = expiringStudents.docs.map(async (doc) => {
      const student = doc.data();
      
      await sendEmail({
        to: student.email,
        subject: 'Your subscription is expiring soon',
        template: 'subscriptionExpiring',
        data: {
          name: student.profile.fullName,
          expiryDate: student.subscription.endDate.toDate().toLocaleDateString(),
          renewUrl: `${process.env.APP_URL}/settings/subscription`,
        },
      });
    });

    await Promise.all(notifications);
    return null;
  });

// Promo code tracking
export const trackPromoCodeApplication = functions.firestore
  .document('promo_code_usage/{usageId}')
  .onCreate(async (snap, context) => {
    const usage = snap.data();
    
    const adminsQuery = await admin.firestore()
      .collection('users')
      .where('role', '==', 'admin')
      .get();

    const notifications = adminsQuery.docs.map(async (adminDoc) => {
      await admin.firestore().collection('notifications').add({
        recipientId: adminDoc.id,
        type: 'system',
        title: 'Promo Code Used',
        body: `${usage.userName} used promo code ${usage.promoCode} (${usage.discountPercentage}% discount)`,
        data: {
          promoCode: usage.promoCode,
          userId: usage.userId,
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await Promise.all(notifications);
  });

export const updateStudentProgress = functions.firestore
  .document('submissions/{submissionId}')
  .onWrite(async (change, context) => {
    if (!change.after.exists) return;

    const submission = change.after.data();
    if (submission.status !== 'graded') return;

    const studentRef = admin.firestore().collection('students').doc(submission.studentId);
    const studentDoc = await studentRef.get();
    const student = studentDoc.data();

    if (!student) return;

    const assignmentDoc = await admin.firestore()
      .collection('assignments')
      .doc(submission.assignmentId)
      .get();
    const assignment = assignmentDoc.data();

    if (!assignment) return;

    const skillType = assignment.type;
    const currentSkillProgress = student.progress.skillsBreakdown[skillType] || 0;
    const newSkillProgress = (currentSkillProgress + submission.grading.percentage) / 2;

    await studentRef.update({
      [`progress.skillsBreakdown.${skillType}`]: newSkillProgress,
      'progress.lastActivityDate': admin.firestore.FieldValue.serverTimestamp(),
    });
  });

// UPDATED: Process recurring payments
export const processRecurringPayments = functions.pubsub
  .schedule('0 0 * * *') // Daily at midnight
  .onRun(async (context) => {
    const now = new Date();
    
    const recurringPayments = await admin.firestore()
      .collection('recurring_payments')
      .where('status', '==', 'active')
      .where('nextPaymentDate', '<=', admin.firestore.Timestamp.fromDate(now))
      .get();

    const processPayments = recurringPayments.docs.map(async (doc) => {
      const payment = doc.data();
      
      try {
        // Process payment using saved card
        // This would need to be implemented with Tap's recurring API
        console.log(`Processing recurring payment for customer: ${payment.customerId}`);
        
        // Update next payment date
        const nextDate = new Date();
        if (payment.interval === 'MONTHLY') {
          nextDate.setMonth(nextDate.getMonth() + 1);
        } else {
          nextDate.setFullYear(nextDate.getFullYear() + 1);
        }
        
        await doc.ref.update({
          nextPaymentDate: admin.firestore.Timestamp.fromDate(nextDate),
          lastProcessedAt: admin.firestore.FieldValue.serverTimestamp(),
        });
      } catch (error) {
        console.error('Error processing recurring payment:', error);
        
        // Mark as failed and notify student
        await doc.ref.update({
          status: 'failed',
          lastError: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    });

    await Promise.all(processPayments);
    return null;
  });

function generateRandomPassword(): string {
  const length = 12;
  const charset = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}