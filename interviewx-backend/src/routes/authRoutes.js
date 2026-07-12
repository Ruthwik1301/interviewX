import { Router } from "express";
import passport from "passport";
import {
  register,
  login,
  me,
  forgotPassword,
  resetPassword,
  verifyEmail,
  resendVerification,
} from "../controllers/authController.js";
import { requireAuth } from "../middleware/auth.js";
import { env } from "../config/env.js";

const router = Router();

router.post("/register", register);
router.post("/login", login);
router.get("/me", requireAuth, me);

// Password reset
router.post("/forgot-password", forgotPassword);
router.post("/reset-password", resetPassword);

// Email verification
router.post("/verify-email", verifyEmail);
router.post("/resend-verification", requireAuth, resendVerification);

// ── Google OAuth ────────────────────────────────────────────────────────────

// Step 1: redirect user to Google consent screen
router.get(
  "/google",
  passport.authenticate("google", {
    scope: ["profile", "email"],
    session: false,
  }),
);

// Step 2: Google redirects back here with a code
router.get(
  "/google/callback",
  passport.authenticate("google", {
    session: false,
    failureRedirect: `${env.appUrl}/login?error=google_failed`,
  }),
  (req, res) => {
    // passport puts { token, user } on req.user via the strategy done() call
    const { token } = req.user;

    // Redirect to frontend with the JWT as a query param.
    // The frontend reads it, stores it in localStorage, then cleans the URL.
    res.redirect(`${env.appUrl}/auth/google/success?token=${token}`);
  },
);

export default router;
