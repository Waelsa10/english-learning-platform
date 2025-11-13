import emailjs from '@emailjs/browser';

// Initialize EmailJS
emailjs.init(import.meta.env.VITE_EMAILJS_PUBLIC_KEY);

interface SendEmailParams {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export const sendEmail = async (params: SendEmailParams): Promise<void> => {
  try {
    const templateParams = {
      to_email: params.to,
      subject: params.subject,
      ...params.data,
    };

    await emailjs.send(
      import.meta.env.VITE_EMAILJS_SERVICE_ID,
      import.meta.env.VITE_EMAILJS_TEMPLATE_ID,
      templateParams
    );

    console.log('Email sent successfully');
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
};

// Specific email functions
export const sendWelcomeEmail = async (email: string, name: string) => {
  await sendEmail({
    to: email,
    subject: 'Welcome to English Learning Platform!',
    template: 'welcome',
    data: {
      name,
      dashboardUrl: import.meta.env.VITE_APP_URL + '/dashboard',
    },
  });
};

export const sendAssignmentNotification = async (
  email: string,
  studentName: string,
  assignmentTitle: string,
  assignmentId: string
) => {
  await sendEmail({
    to: email,
    subject: `New Assignment: ${assignmentTitle}`,
    template: 'assignment',
    data: {
      studentName,
      assignmentTitle,
      assignmentUrl: `${import.meta.env.VITE_APP_URL}/assignments/${assignmentId}`,
    },
  });
};

export const sendGradeNotification = async (
  email: string,
  studentName: string,
  assignmentTitle: string,
  score: number,
  feedback: string
) => {
  await sendEmail({
    to: email,
    subject: `Assignment Graded: ${assignmentTitle}`,
    template: 'grade',
    data: {
      studentName,
      assignmentTitle,
      score,
      feedback,
    },
  });
};