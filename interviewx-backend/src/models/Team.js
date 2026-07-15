import mongoose from "mongoose";
import {
  SUBSCRIPTION_STATUS,
  STRIPE_SUBSCRIPTION_STATUS_VALUES,
} from "../config/billing.js";

const TEAM_ROLE_VALUES = ["owner", "admin", "member"];
const TEAM_MEMBER_STATUS_VALUES = ["active", "invited", "removed"];
const TEAM_INVITE_STATUS_VALUES = ["pending", "accepted", "revoked", "expired"];

const teamMemberSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    role: {
      type: String,
      enum: TEAM_ROLE_VALUES,
      default: "member",
      required: true,
    },
    status: {
      type: String,
      enum: TEAM_MEMBER_STATUS_VALUES,
      default: "active",
      required: true,
    },
    joinedAt: { type: Date, default: Date.now },
  },
  { _id: false },
);

const teamInviteSchema = new mongoose.Schema(
  {
    email: {
      type: String,
      required: true,
      lowercase: true,
      trim: true,
    },
    role: {
      type: String,
      enum: ["admin", "member"],
      default: "member",
      required: true,
    },
    token: {
      type: String,
      required: true,
    },
    status: {
      type: String,
      enum: TEAM_INVITE_STATUS_VALUES,
      default: "pending",
      required: true,
    },
    invitedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    invitedAt: { type: Date, default: Date.now },
    expiresAt: { type: Date, required: true },
    acceptedAt: { type: Date, default: null },
  },
  { _id: false },
);

const teamSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 120,
    },
    owner: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    members: {
      type: [teamMemberSchema],
      default: [],
    },
    pendingInvites: {
      type: [teamInviteSchema],
      default: [],
    },

    // ── Future Team billing mapping ────────────────────────────────────────
    razorpayCustomerId: {
      type: String,
      default: null,
      index: true,
      sparse: true,
    },
    razorpaySubscriptionId: {
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
    seatsPurchased: { type: Number, min: 1, default: 5 },
  },
  { timestamps: true },
);

teamSchema.methods.toPublicJSON = function toPublicJSON() {
  return {
    id: this._id.toString(),
    name: this.name,
    owner: this.owner?.toString?.() ?? this.owner,
    members: (this.members ?? []).map((member) => ({
      user: member.user?.toString?.() ?? member.user,
      role: member.role,
      status: member.status,
      joinedAt: member.joinedAt,
    })),
    pendingInvites: (this.pendingInvites ?? []).map((invite) => ({
      email: invite.email,
      role: invite.role,
      status: invite.status,
      invitedBy: invite.invitedBy?.toString?.() ?? invite.invitedBy,
      invitedAt: invite.invitedAt,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
    })),
    subscriptionStatus: this.subscriptionStatus,
    subscriptionCurrentPeriodEnd: this.subscriptionCurrentPeriodEnd,
    seatsPurchased: this.seatsPurchased,
    createdAt: this.createdAt,
    updatedAt: this.updatedAt,
  };
};

export const Team = mongoose.model("Team", teamSchema);
export {
  TEAM_ROLE_VALUES,
  TEAM_MEMBER_STATUS_VALUES,
  TEAM_INVITE_STATUS_VALUES,
};
