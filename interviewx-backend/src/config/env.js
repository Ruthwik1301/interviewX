import dotenv from "dotenv";

dotenv.config();

const nodeEnv = process.env.NODE_ENV || "development";
const isProduction = nodeEnv === "production";

const requiredInAllEnvironments = ["MONGODB_URI", "JWT_SECRET", "GROQ_API_KEY"];
const requiredInProduction = [
  "CORS_ORIGIN",
  "APP_URL",
  "RESEND_API_KEY",
  "EMAIL_FROM",
  "GOOGLE_CLIENT_ID",
  "GOOGLE_CLIENT_SECRET",
  "GOOGLE_CALLBACK_URL",
  "JDOODLE_CLIENT_ID",
  "JDOODLE_CLIENT_SECRET",
  
];

function collectMissing(keys) {
  return keys.filter((key) => !process.env[key]);
}

function failForMissing(keys, context) {
  if (keys.length === 0) return;

  console.error(
    `Missing ${context} environment variables: ${keys.join(", ")}\n` +
      "Copy .env.example to .env and fill in real values before starting the server.",
  );
  process.exit(1);
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

function validatePairedEnv(a, b, label) {
  const hasA = Boolean(process.env[a]);
  const hasB = Boolean(process.env[b]);
  if (hasA !== hasB) {
    fail(
      `${label} must be configured together. Set both ${a} and ${b}, or neither.`,
    );
  }
}

function normalizeOriginUrl(raw, envName) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail(`${envName} must be a valid absolute URL. Received: ${raw}`);
  }

  if (url.pathname !== "/" || url.search || url.hash) {
    fail(
      `${envName} must contain origins only (scheme + host + optional port) with no path, query, or hash. Received: ${raw}`,
    );
  }

  return url.origin;
}

function normalizeAbsoluteUrl(raw, envName) {
  let url;
  try {
    url = new URL(raw);
  } catch {
    fail(`${envName} must be a valid absolute URL. Received: ${raw}`);
  }

  const normalized =
    `${url.origin}${url.pathname}`.replace(/\/$/, "") || url.origin;
  const suffix = `${url.search}${url.hash}`;
  return `${normalized}${suffix}`;
}

function parseCorsOrigins(value) {
  const fallback = "http://localhost:5173";
  const parts = (value || fallback)
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean)
    .map((part) => normalizeOriginUrl(part, "CORS_ORIGIN"));

  return Array.from(new Set(parts));
}

validatePairedEnv("GOOGLE_CLIENT_ID", "GOOGLE_CLIENT_SECRET", "Google OAuth");
validatePairedEnv("JDOODLE_CLIENT_ID", "JDOODLE_CLIENT_SECRET", "JDoodle");

failForMissing(collectMissing(requiredInAllEnvironments), "required");

if (isProduction) {
  failForMissing(collectMissing(requiredInProduction), "production-required");
}

function parseEmailList(value) {
  return new Set(
    (value || "")
      .split(",")
      .map((part) => part.trim().toLowerCase())
      .filter(Boolean),
  );
}

const corsOrigins = parseCorsOrigins(process.env.CORS_ORIGIN);
const appUrl = normalizeAbsoluteUrl(
  process.env.APP_URL || "http://localhost:5173",
  "APP_URL",
);
const googleCallbackUrl = normalizeAbsoluteUrl(
  process.env.GOOGLE_CALLBACK_URL ||
    "http://localhost:5000/api/auth/google/callback",
  "GOOGLE_CALLBACK_URL",
);
const paymentReturnUrl = process.env.PAYMENT_RETURN_URL
  ? normalizeAbsoluteUrl(process.env.PAYMENT_RETURN_URL, "PAYMENT_RETURN_URL")
  : null;

export const env = {
  port: process.env.PORT || 5000,
  mongoUri: process.env.MONGODB_URI,
  jwtSecret: process.env.JWT_SECRET,
  jwtExpiresIn: process.env.JWT_EXPIRES_IN || "7d",
  groqApiKey: process.env.GROQ_API_KEY,
  groqModel: process.env.GROQ_MODEL || "llama-3.3-70b-versatile",
  corsOrigin: corsOrigins.length === 1 ? corsOrigins[0] : corsOrigins,
  corsOrigins,
  nodeEnv,

  // Email (Resend)
  resendApiKey: process.env.RESEND_API_KEY || null,
  emailFrom: process.env.EMAIL_FROM || "InterviewX <noreply@interviewx.app>",
  appUrl,

  // Google OAuth
  googleClientId: process.env.GOOGLE_CLIENT_ID || null,
  googleClientSecret: process.env.GOOGLE_CLIENT_SECRET || null,
  googleCallbackUrl,

  // JDoodle code execution
  jdoodleClientId: process.env.JDOODLE_CLIENT_ID || null,
  jdoodleClientSecret: process.env.JDOODLE_CLIENT_SECRET || null,

  // Razorpay billing
  razorpayKeyId: process.env.RAZORPAY_KEY_ID || null,
  razorpayKeySecret: process.env.RAZORPAY_KEY_SECRET || null,
  razorpayWebhookSecret: process.env.RAZORPAY_WEBHOOK_SECRET || null,
  razorpayPlanIdPro: process.env.RAZORPAY_PLAN_ID_PRO || null,
  razorpayPlanIdTeam: process.env.RAZORPAY_PLAN_ID_TEAM || null,
  paymentReturnUrl,

  // Internal QA/testing allowlist. Purely a runtime override read from an
  // untracked .env value - it is never persisted on the user record, never
  // exposed via any API response, and never rendered in the frontend.
  qaUnlimitedEmails: parseEmailList(process.env.QA_UNLIMITED_EMAILS),
};
