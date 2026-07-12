import crypto from "crypto";
import { User } from "../models/User.js";
import { signToken } from "../middleware/auth.js";
import {
  sendPasswordResetEmail,
  sendVerificationEmail,
} from "../services/emailService.js";

// ── helpers ──────────────────────────────────────────────────────────────────

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hoursFromNow(h) {
  return new Date(Date.now() + h * 60 * 60 * 1000);
}

// ── register ─────────────────────────────────────────────────────────────────

export async function register(req, res, next) {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res
        .status(400)
        .json({ error: "Name, email, and password are required." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) {
      return res
        .status(409)
        .json({ error: "An account with this email already exists." });
    }

    const verifyToken = makeToken();

    const user = new User({
      name: name.trim(),
      email: email.toLowerCase().trim(),
      verifyToken,
      verifyTokenExpiry: hoursFromNow(24),
    });
    await user.setPassword(password);
    await user.save();

    // Fire-and-forget — don't block registration if email fails
    sendVerificationEmail(user.email, verifyToken).catch((err) =>
      console.error("[register] failed to send verification email:", err),
    );

    const token = signToken(user._id.toString());
    res.status(201).json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ── login ─────────────────────────────────────────────────────────────────────

export async function login(req, res, next) {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res
        .status(400)
        .json({ error: "Email and password are required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const valid = await user.comparePassword(password);
    if (!valid) {
      return res.status(401).json({ error: "Invalid email or password." });
    }

    const token = signToken(user._id.toString());
    res.json({ token, user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ── me ────────────────────────────────────────────────────────────────────────

export async function me(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    res.json({ user: user.toPublicJSON() });
  } catch (err) {
    next(err);
  }
}

// ── forgotPassword ────────────────────────────────────────────────────────────

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ error: "Email is required." });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always return 200 — don't reveal whether the email exists
    if (!user) {
      return res.json({
        message:
          "If an account with that email exists, a reset link has been sent.",
      });
    }

    const token = makeToken();
    user.resetToken = token;
    user.resetTokenExpiry = hoursFromNow(1);
    await user.save();

    sendPasswordResetEmail(user.email, token).catch((err) =>
      console.error("[forgotPassword] failed to send reset email:", err),
    );

    res.json({
      message:
        "If an account with that email exists, a reset link has been sent.",
    });
  } catch (err) {
    next(err);
  }
}

// ── resetPassword ─────────────────────────────────────────────────────────────

export async function resetPassword(req, res, next) {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      return res
        .status(400)
        .json({ error: "Token and new password are required." });
    }
    if (password.length < 8) {
      return res
        .status(400)
        .json({ error: "Password must be at least 8 characters." });
    }

    const user = await User.findOne({
      resetToken: token,
      resetTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error:
          "This reset link is invalid or has expired. Please request a new one.",
      });
    }

    await user.setPassword(password);
    user.resetToken = null;
    user.resetTokenExpiry = null;
    await user.save();

    res.json({ message: "Password updated successfully. You can now log in." });
  } catch (err) {
    next(err);
  }
}

// ── verifyEmail ───────────────────────────────────────────────────────────────

export async function verifyEmail(req, res, next) {
  try {
    const { token } = req.body;

    if (!token) {
      return res.status(400).json({ error: "Verification token is required." });
    }

    const user = await User.findOne({
      verifyToken: token,
      verifyTokenExpiry: { $gt: new Date() },
    });

    if (!user) {
      return res.status(400).json({
        error:
          "This verification link is invalid or has expired. Please request a new one.",
      });
    }

    user.emailVerified = true;
    user.verifyToken = null;
    user.verifyTokenExpiry = null;
    await user.save();

    res.json({
      message: "Email verified successfully.",
      user: user.toPublicJSON(),
    });
  } catch (err) {
    next(err);
  }
}

// ── resendVerification ────────────────────────────────────────────────────────

export async function resendVerification(req, res, next) {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }
    if (user.emailVerified) {
      return res.json({ message: "Your email is already verified." });
    }

    const token = makeToken();
    user.verifyToken = token;
    user.verifyTokenExpiry = hoursFromNow(24);
    await user.save();

    sendVerificationEmail(user.email, token).catch((err) =>
      console.error("[resendVerification] failed to send email:", err),
    );

    res.json({ message: "Verification email sent." });
  } catch (err) {
    next(err);
  }
}
