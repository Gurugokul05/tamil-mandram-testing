import nodemailer from 'nodemailer';
import { env } from '../config/env.js';
import { Notification } from '../models/index.js';

let transporter = null;

const getTransporter = () => {
  if (!env.smtp.host || !env.smtp.user) return null;
  if (!transporter) {
    transporter = nodemailer.createTransport({
      host: env.smtp.host,
      port: env.smtp.port,
      secure: env.smtp.secure,
      auth: { user: env.smtp.user, pass: env.smtp.pass },
    });
  }
  return transporter;
};

export async function sendMail({ to, subject, text, html }) {
  const mailer = getTransporter();

  if (!mailer) {
    console.log('[mail:dev]', { to, subject, text });
    return { delivered: false, preview: true };
  }

  try {
    await mailer.sendMail({ from: env.smtp.from, to, subject, text, html });
    return { delivered: true };
  } catch (error) {
    console.error('[mail] failed:', error.message);
    return { delivered: false };
  }
}

export async function notifyUser({ user, type, title, message = {}, link = '', email = null }) {
  const notification = await Notification.create({
    user: user._id || user,
    type,
    title,
    message,
    link,
  });

  if (email && user.email) {
    await sendMail({
      to: user.email,
      subject: `Tamil Mandram — ${email.subject}`,
      text: `${email.body}\n\n${env.siteUrl}${link || ''}`,
    });
  }

  return notification;
}
