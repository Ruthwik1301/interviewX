import express from "express";
import cors from "cors";
import passport from "passport";
import { rateLimit } from "express-rate-limit";
import { env } from "./config/env.js";
import { configurePassport } from "./config/passport.js";
import authRoutes from "./routes/authRoutes.js";
import profileRoutes from "./routes/profileRoutes.js";
import interviewRoutes from "./routes/interviewRoutes.js";
import runRoutes from "./routes/runRoutes.js";
import paymentRoutes from "./routes/paymentRoutes.js";
import teamRoutes from "./routes/teamRoutes.js";
import { notFound, errorHandler } from "./middleware/errorHandler.js";

configurePassport();

function jsonRateLimitHandler(message) {
  return (req, res) => {
    return res.status(429).json({ error: message });
  };
}

function normalizeOrigin(value) {
  return String(value || "").replace(/\/$/, "");
}

function createCorsOptions() {
  const allowedOrigins = new Set(
    (Array.isArray(env.corsOrigins) ? env.corsOrigins : [env.corsOrigin]).map(
      normalizeOrigin,
    ),
  );

  return {
    credentials: true,
    origin(origin, callback) {
      // Allow non-browser requests such as health checks, server-to-server calls,
      // and Stripe webhook delivery which typically omit an Origin header.
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = normalizeOrigin(origin);
      if (allowedOrigins.has(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error(`CORS blocked for origin: ${origin}`));
    },
  };
}

const isPaymentsWebhook = (req) =>
  req.originalUrl.startsWith("/api/payments/webhook");

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 120,
  standardHeaders: true,
  legacyHeaders: false,
  skip: isPaymentsWebhook,
  handler: jsonRateLimitHandler(
    "Too many API requests from this IP. Please slow down and try again shortly.",
  ),
});

const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler(
    "Too many authentication attempts from this IP. Please try again in a few minutes.",
  ),
});

const passwordResetLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler(
    "Too many password reset requests from this IP. Please wait before trying again.",
  ),
});

const interviewLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler(
    "Too many interview requests from this IP. Please wait a bit and try again.",
  ),
});

const runLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  handler: jsonRateLimitHandler(
    "Too many code execution requests from this IP. Please wait a bit before running more code.",
  ),
});

export function createApp() {
  const app = express();

  // Required in production behind Railway / proxies so rate limiting uses the
  // real client IP instead of the proxy IP.
  app.set("trust proxy", 1);

  app.use(cors(createCorsOptions()));

  // General API limiter. Stripe webhook is explicitly skipped so raw-body
  // delivery and webhook retries are not interfered with.
  app.use("/api", apiLimiter);

  // Sensible auth and password-reset limits.
  app.use("/api/auth/register", authLimiter);
  app.use("/api/auth/login", authLimiter);
  app.use("/api/auth/verify-email", authLimiter);
  app.use("/api/auth/resend-verification", authLimiter);
  app.use("/api/auth/forgot-password", passwordResetLimiter);
  app.use("/api/auth/reset-password", passwordResetLimiter);

  // Stricter high-value / expensive endpoints.
  app.use("/api/interviews", interviewLimiter);
  app.use("/api/run", runLimiter);

  // Mount payments before the global JSON parser so the Razorpay webhook route
  // can preserve the raw request body needed for signature verification.
  app.use("/api/payments", paymentRoutes);

  app.use(express.json({ limit: "1mb" }));
  app.use(passport.initialize());

  app.get("/health", (req, res) => res.json({ status: "ok" }));

  app.use("/api/auth", authRoutes);
  app.use("/api/profile", profileRoutes);
  app.use("/api/team", teamRoutes);
  app.use("/api/interviews", interviewRoutes);
  app.use("/api/run", runRoutes);

  app.use(notFound);
  app.use(errorHandler);

  return app;
}
