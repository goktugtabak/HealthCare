const nodemailer = require('nodemailer');
const logger = require('../middleware/logger');

let transporter;

const getTransporter = () => {
  if (transporter) return transporter;

  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT) || 587,
    secure: false,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return transporter;
};

const sendMail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'test') return;

  if (!process.env.SMTP_USER) {
    logger.warn(`[Email skipped - no SMTP config] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    await getTransporter().sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'HEALTH AI'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
  } catch (err) {
    logger.error(`Email send failed to ${to}: ${err.message}`);
    throw err;
  }
};

const sendVerificationEmail = (email, firstName, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/verify-email?token=${token}`;
  return sendMail({
    to: email,
    subject: 'Verify your HEALTH AI account',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2>Welcome to HEALTH AI, ${firstName}!</h2>
        <p>Click the button below to verify your email address:</p>
        <a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;border-radius:6px;text-decoration:none;font-weight:bold">
          Verify Email
        </a>
        <p style="color:#888;font-size:12px;margin-top:24px">
          This link expires in 24 hours. If you did not register, you can safely ignore this email.
        </p>
      </div>
    `,
  });
};

const sendNdaNotification = (email, firstName, postTitle) =>
  sendMail({
    to: email,
    subject: 'NDA Required — HEALTH AI',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2>NDA Required</h2>
        <p>Hi ${firstName},</p>
        <p>To access sensitive details about "<strong>${postTitle}</strong>", you must accept the NDA.</p>
        <p>Log in to HEALTH AI to review and accept the agreement.</p>
      </div>
    `,
  });

const sendMeetingConfirmation = (email, firstName, meetingTime, externalUrl) =>
  sendMail({
    to: email,
    subject: 'Meeting Confirmed — HEALTH AI',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:auto">
        <h2>Meeting Confirmed!</h2>
        <p>Hi ${firstName}, your meeting is scheduled for <strong>${new Date(meetingTime).toLocaleString()}</strong>.</p>
        ${externalUrl ? `<p><a href="${externalUrl}">Join meeting</a></p>` : ''}
      </div>
    `,
  });

module.exports = { sendVerificationEmail, sendNdaNotification, sendMeetingConfirmation };
