import nodemailer from 'nodemailer';
import { env } from '../config/env.js';

const createTransporter = () => {
  if (!env.emailHost || !env.emailUser || !env.emailPass) {
    return null;
  }

  return nodemailer.createTransport({
    host: env.emailHost,
    port: Number(env.emailPort || 587),
    secure: Boolean(Number(env.emailPort) === 465),
    auth: {
      user: env.emailUser,
      pass: env.emailPass,
    },
  });
};

export const sendInvitationEmail = async ({ to, workspaceName, inviterName, inviteCode, inviteLink, expiresAt }) => {
  const transporter = createTransporter();

  if (!transporter) {
    return {
      sent: false,
      reason: 'SMTP credentials are not configured. Set EMAIL_HOST, EMAIL_PORT, EMAIL_USER, EMAIL_PASS, and EMAIL_FROM in your environment.',
    };
  }

  const html = `
    <div style="font-family: Arial, sans-serif; color: #0f172a; background: #f8fafc; padding: 24px;">
      <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; box-shadow: 0 12px 30px rgba(15, 23, 42, 0.08);">
        <div style="background: linear-gradient(135deg, #4f46e5, #2563eb); padding: 24px 32px; color: white;">
          <h2 style="margin: 0 0 8px; font-size: 24px;">You’re invited to join ${workspaceName}</h2>
          <p style="margin: 0; font-size: 14px; opacity: 0.92;">${inviterName} invited you to collaborate in a shared workspace.</p>
        </div>
        <div style="padding: 32px;">
          <p style="margin: 0 0 12px; font-size: 16px;">Use the invite code below or open the secure join link to accept your invitation.</p>
          <div style="background: #eef2ff; border: 1px solid #c7d2fe; border-radius: 12px; padding: 16px; margin: 18px 0; text-align: center;">
            <div style="font-size: 12px; letter-spacing: 1px; text-transform: uppercase; color: #4f46e5; font-weight: 700;">Invite code</div>
            <div style="font-size: 24px; font-weight: 700; margin-top: 6px; color: #111827;">${inviteCode}</div>
          </div>
          <div style="margin: 20px 0;">
            <a href="${inviteLink}" style="display: inline-block; background: #2563eb; color: #ffffff; text-decoration: none; padding: 12px 18px; border-radius: 999px; font-weight: 700;">Join Workspace</a>
          </div>
          <p style="margin: 0; color: #475569; font-size: 14px;">This invitation expires on ${new Date(expiresAt).toLocaleString('en-US', { dateStyle: 'medium', timeStyle: 'short' })}.</p>
        </div>
      </div>
    </div>
  `;

  try {
    await transporter.sendMail({
      from: env.emailFrom,
      to,
      subject: `Invitation to join ${workspaceName}`,
      html,
    });

    return { sent: true };
  } catch (error) {
    console.error('Invitation email failed:', error?.message || error);
    return {
      sent: false,
      reason: error?.message || 'Unable to send invitation email via SMTP',
    };
  }
};
