import * as nodemailer from 'nodemailer';
import * as handlebars from 'handlebars';
import * as fs from 'fs';
import * as path from 'path';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD,
  },
});

interface EmailOptions {
  to: string;
  subject: string;
  template: string;
  data: Record<string, any>;
}

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    const templatePath = path.join(__dirname, '../templates', `${options.template}.html`);
    const templateSource = fs.readFileSync(templatePath, 'utf-8');
    const template = handlebars.compile(templateSource);
    const html = template(options.data);

    await transporter.sendMail({
      from: '"English Learning Platform" <noreply@englishlearning.com>',
      to: options.to,
      subject: options.subject,
      html,
    });

    console.log(`Email sent to ${options.to}`);
  } catch (error) {
    console.error('Error sending email:', error);
    throw error;
  }
}