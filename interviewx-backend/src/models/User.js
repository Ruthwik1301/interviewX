import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import {
  PLAN_KEYS,
  SUBSCRIPTION_STATUS,
  USER_PLAN_VALUES,
  STRIPE_SUBSCRIPTION_STATUS_VALUES,
} from "../config/billing.js";

const TRACK_KEYS = [
  "Technical",
  "Coding",
  "Cybersecurity",
  "System Design",
  "HR & Behavioural",
];

const NOTIF_KEYS = [
  "Daily practice reminder",
  "Weekly progress report",
  "New question packs",
  "Session completion summary",
];

const TEAM_ROLE_VALUES = ["owner", "admin", "member"];

function defaultMap(keys, value) {
  return keys.reduce((acc, k) => ({ ...acc, [k]: value }), {});
}

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
      index: true,
    },
    // Not required — Google OAuth users have no password
    passwordHash: { type: String, default: null },
    role: { type: String, default: "", maxlength: 120 },
    target: { type: String, default: "", maxlength: 160 },
    tracks: {
      type: Map,
      of: Boolean,
      default: () => defaultMap(TRACK_KEYS, false),
    },
    notifications: {
      type: Map,
      of: Boolean,
      default: () => defaultMap(NOTIF_KEYS, true),
    },

    // ── Billing / subscriptions ─────────────────────────────────────────────
    plan: {
      type: String,
      enum: USER_PLAN_VALUES,
      default: PLAN_KEYS.FREE,
      index: true,
    },
    stripeCustomerId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    stripeSubscriptionId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    subscriptionStatus: {
      type: String,
      enum: STRIPE_SUBSCRIPTION_STATUS_VALUES,
      default: SUBSCRIPTION_STATUS.NOT_STARTED,
      index: true,
    },
    subscriptionCurrentPeriodEnd: { type: Date, default: null },

    // ── Team membership foundation ─────────────────────────────────────────
    activeTeam: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Team",
      default: null,
      index: true,
    },
    teamRole: {
      type: String,
      enum: TEAM_ROLE_VALUES,
      default: null,
    },

    // ── Email verification ──────────────────────────────────────────────────
    emailVerified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null, index: true },
    verifyTokenExpiry: { type: Date, default: null },

    // ── Password reset ──────────────────────────────────────────────────────
    resetToken: { type: String, default: null, index: true },
    resetTokenExpiry: { type: Date, default: null },

    // ── OAuth ───────────────────────────────────────────────────────────────
    googleId: { type: String, default: null, index: true, sparse: true },
    authProvider: {
      type: String,
      default: "local",
      enum: ["local", "google"],
    },
  },
  { timestamps: true },
);

userSchema.methods.setPassword = async function setPassword(plain) {
  const salt = await bcrypt.genSalt(10);
  this.passwordHash = await bcrypt.hash(plain, salt);
};

userSchema.methods.comparePassword = function comparePassword(plain) {
  if (!this.passwordHash) return Promise.resolve(false);
  return bcrypt.compare(plain, this.passwordHash);
};

userSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    email: this.email,
    role: this.role,
    target: this.target,
    tracks: Object.fromEntries(this.tracks ?? []),
    notifications: Object.fromEntries(this.notifications ?? []),
    emailVerified: this.emailVerified,
    authProvider: this.authProvider,
    plan: this.plan,
    subscriptionStatus: this.subscriptionStatus,
    subscriptionCurrentPeriodEnd: this.subscriptionCurrentPeriodEnd,
    activeTeam: this.activeTeam?.toString?.() ?? this.activeTeam ?? null,
    teamRole: this.teamRole,
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
export { TRACK_KEYS, NOTIF_KEYS, TEAM_ROLE_VALUES };
