const nodemailer = require('nodemailer');
const logger = require('../middleware/logger');
const prisma = require('../lib/prisma');

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

const wrap = (innerHtml) => `
  <div style="font-family:system-ui,sans-serif;max-width:600px;margin:24px auto;background:#fff;border:1px solid #e5e7eb;border-radius:12px;padding:32px">
    <div style="font-weight:700;font-size:18px;color:#0ea5e9;margin-bottom:16px">HEALTH AI</div>
    ${innerHtml}
    <p style="color:#94a3b8;font-size:12px;margin-top:32px">
      This is an automated notification from HEALTH AI. You can manage email preferences in your profile.
    </p>
  </div>
`;

const sendMail = async ({ to, subject, html }) => {
  if (process.env.NODE_ENV === 'test') return { skipped: true };

  if (!process.env.SMTP_USER) {
    logger.warn(`[Email skipped — no SMTP_USER] To: ${to} | Subject: ${subject}`);
    return { skipped: true };
  }

  try {
    await getTransporter().sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'HEALTH AI'}" <${process.env.EMAIL_FROM || process.env.SMTP_USER}>`,
      to,
      subject,
      html,
    });
    logger.info(`Email sent to ${to}: ${subject}`);
    return { sent: true };
  } catch (err) {
    logger.error(`Email send failed to ${to}: ${err.message}`);
    return { error: err.message };
  }
};

const userWantsEmail = async (userId) => {
  if (!userId) return false;
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { notifyEmail: true, status: true, deletedAt: true },
  });
  return !!u && !u.deletedAt && u.status === 'active' && u.notifyEmail;
};

const sendVerificationEmail = (email, firstName, token) => {
  const verifyUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/verify-email?token=${token}`;
  return sendMail({
    to: email,
    subject: 'Verify your HEALTH AI account',
    html: wrap(`
      <h2 style="color:#0f172a">Welcome to HEALTH AI, ${firstName}!</h2>
      <p>Click the button below to verify your email address.</p>
      <p><a href="${verifyUrl}" style="display:inline-block;padding:12px 24px;background:#0ea5e9;color:#fff;border-radius:8px;text-decoration:none;font-weight:bold">Verify Email</a></p>
      <p style="color:#94a3b8;font-size:12px">This link expires in 24 hours.</p>
    `),
  });
};

const sendMeetingRequestEmail = async (recipientId, requesterName, postTitle) => {
  if (!(await userWantsEmail(recipientId))) return { skipped: true };
  const u = await prisma.user.findUnique({ where: { id: recipientId }, select: { email: true, firstName: true } });
  return sendMail({
    to: u.email,
    subject: 'New collaboration request — HEALTH AI',
    html: wrap(`
      <h2 style="color:#0f172a">New collaboration request</h2>
      <p>Hi ${u.firstName || ''},</p>
      <p><strong>${requesterName}</strong> sent you a first-contact request about <em>${postTitle}</em>.</p>
      <p>Log in to HEALTH AI to review the request, accept the NDA, and propose meeting slots.</p>
    `),
  });
};

const sendMeetingAcceptedEmail = async (requesterId, ownerName, postTitle, slot) => {
  if (!(await userWantsEmail(requesterId))) return { skipped: true };
  const u = await prisma.user.findUnique({ where: { id: requesterId }, select: { email: true, firstName: true } });
  const slotText = slot ? new Date(slot).toLocaleString() : 'no slot selected yet';
  return sendMail({
    to: u.email,
    subject: 'Meeting accepted — HEALTH AI',
    html: wrap(`
      <h2 style="color:#0f172a">Meeting accepted</h2>
      <p>Hi ${u.firstName || ''},</p>
      <p><strong>${ownerName}</strong> accepted your collaboration request for <em>${postTitle}</em>.</p>
      <p>Selected slot: <strong>${slotText}</strong>.</p>
      <p>Coordinate the external meeting link via the in-app message box.</p>
    `),
  });
};

const sendMeetingDeclinedEmail = async (requesterId, ownerName, postTitle, reason) => {
  if (!(await userWantsEmail(requesterId))) return { skipped: true };
  const u = await prisma.user.findUnique({ where: { id: requesterId }, select: { email: true, firstName: true } });
  return sendMail({
    to: u.email,
    subject: 'Meeting request declined — HEALTH AI',
    html: wrap(`
      <h2 style="color:#0f172a">Request declined</h2>
      <p>Hi ${u.firstName || ''},</p>
      <p><strong>${ownerName}</strong> declined your request for <em>${postTitle}</em>.</p>
      ${reason ? `<p>Note: ${reason}</p>` : ''}
      <p>You can still browse other posts and find a different partner.</p>
    `),
  });
};

const sendAccountDeletionScheduledEmail = async (userId) => {
  const u = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, firstName: true, notifyEmail: true },
  });
  if (!u || !u.notifyEmail) return { skipped: true };
  const ttl = parseInt(process.env.DELETION_TTL_MS, 10) || 72 * 60 * 60 * 1000;
  const purgeDate = new Date(Date.now() + ttl).toLocaleString();
  return sendMail({
    to: u.email,
    subject: 'Account deletion scheduled — HEALTH AI',
    html: wrap(`
      <h2 style="color:#0f172a">Account deletion scheduled</h2>
      <p>Hi ${u.firstName || ''},</p>
      <p>We received your account deletion request. Your account and personal data will be permanently removed on:</p>
      <p><strong>${purgeDate}</strong></p>
      <p>If this was a mistake, log in within the grace period to cancel deletion.</p>
    `),
  });
};

const sendNdaAcceptedEmail = async (ownerId, requesterName, postTitle) => {
  if (!(await userWantsEmail(ownerId))) return { skipped: true };
  const u = await prisma.user.findUnique({ where: { id: ownerId }, select: { email: true, firstName: true } });
  return sendMail({
    to: u.email,
    subject: 'NDA accepted — HEALTH AI',
    html: wrap(`
      <h2 style="color:#0f172a">NDA accepted</h2>
      <p>Hi ${u.firstName || ''},</p>
      <p><strong>${requesterName}</strong> accepted the confidentiality acknowledgement for your post <em>${postTitle}</em>. The first-contact request is now active.</p>
    `),
  });
};

module.exports = {
  sendVerificationEmail,
  sendMeetingRequestEmail,
  sendMeetingAcceptedEmail,
  sendMeetingDeclinedEmail,
  sendAccountDeletionScheduledEmail,
  sendNdaAcceptedEmail,
};
