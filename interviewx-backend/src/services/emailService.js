import { Resend } from "resend";
import { env } from "../config/env.js";

// Resend is only instantiated when RESEND_API_KEY is present.
// In dev without the key, emails are logged to stdout instead.
let resend = null;
if (env.resendApiKey) {
  resend = new Resend(env.resendApiKey);
}

const FROM = env.emailFrom ?? "InterviewX <noreply@interviewx.app>";
const APP_URL = env.appUrl ?? "http://localhost:5173";

/**
 * Send a password-reset email.
 * @param {string} to       Recipient email address
 * @param {string} token    The raw reset token (already URL-encoded where needed)
 */
export async function sendPasswordResetEmail(to, token) {
  const link = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <div style="margin-bottom:24px">
        <span style="display:inline-block;background:#7c3aed;color:#fff;font-weight:700;font-size:14px;padding:6px 14px;border-radius:8px;letter-spacing:.5px">
          InterviewX
        </span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#0f0e17;margin:0 0 8px">
        Reset your password
      </h1>
      <p style="font-size:15px;color:#6b7280;margin:0 0 24px;line-height:1.6">
        Someone (hopefully you) requested a password reset for your InterviewX account.
        Click the button below to choose a new password. This link expires in&nbsp;<strong>1 hour</strong>.
      </p>
      <a href="${link}"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:12px;text-decoration:none">
        Reset password
      </a>
      <p style="font-size:13px;color:#9ca3af;margin:24px 0 0;line-height:1.6">
        If you didn't request this, you can safely ignore this email — your password won't change.
      </p>
      <p style="font-size:13px;color:#9ca3af;margin:12px 0 0">
        Can't click the button? Copy and paste this URL:<br/>
        <span style="word-break:break-all;color:#7c3aed">${link}</span>
      </p>
    </div>
  `;

  if (!resend) {
    console.log(
      `[emailService] DEV — password reset link for ${to}:\n  ${link}`,
    );
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Reset your InterviewX password",
    html,
  });
}

/**
 * Send an email-verification email.
 * @param {string} to       Recipient email address
 * @param {string} token    The raw verify token
 */
export async function sendVerificationEmail(to, token) {
  const link = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:480px;margin:0 auto;padding:32px 24px">
      <div style="margin-bottom:24px">
        <span style="display:inline-block;background:#7c3aed;color:#fff;font-weight:700;font-size:14px;padding:6px 14px;border-radius:8px;letter-spacing:.5px">
          InterviewX
        </span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#0f0e17;margin:0 0 8px">
        Verify your email
      </h1>
      <p style="font-size:15px;color:#6b7280;margin:0 0 24px;line-height:1.6">
        Thanks for signing up! Click the button below to verify your email address and activate your account.
        This link expires in&nbsp;<strong>24 hours</strong>.
      </p>
      <a href="${link}"
         style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;font-weight:600;font-size:15px;padding:12px 28px;border-radius:12px;text-decoration:none">
        Verify email
      </a>
      <p style="font-size:13px;color:#9ca3af;margin:24px 0 0;line-height:1.6">
        If you didn't create an InterviewX account, you can safely ignore this email.
      </p>
      <p style="font-size:13px;color:#9ca3af;margin:12px 0 0">
        Can't click the button? Copy and paste this URL:<br/>
        <span style="word-break:break-all;color:#7c3aed">${link}</span>
      </p>
    </div>
  `;

  if (!resend) {
    console.log(`[emailService] DEV — verify email link for ${to}:\n  ${link}`);
    return;
  }

  await resend.emails.send({
    from: FROM,
    to,
    subject: "Verify your InterviewX email",
    html,
  });
}
