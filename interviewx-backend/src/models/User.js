import mongoose from "mongoose";
import bcrypt from "bcryptjs";

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

    // ── Email verification ──────────────────────────────────────────────────
    emailVerified: { type: Boolean, default: false },
    verifyToken: { type: String, default: null, index: true },
    verifyTokenExpiry: { type: Date, default: null },

    // ── Password reset ──────────────────────────────────────────────────────
    resetToken: { type: String, default: null, index: true },
    resetTokenExpiry: { type: Date, default: null },

    // ── OAuth ───────────────────────────────────────────────────────────────
    googleId: { type: String, default: null, index: true, sparse: true },
    authProvider: { type: String, default: "local", enum: ["local", "google"] },
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
    createdAt: this.createdAt,
  };
};

export const User = mongoose.model("User", userSchema);
export { TRACK_KEYS, NOTIF_KEYS };
