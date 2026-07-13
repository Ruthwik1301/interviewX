import crypto from "crypto";
import { Router } from "express";
import { Resend } from "resend";
import { requireAuth } from "../middleware/auth.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import { PLAN_KEYS, SUBSCRIPTION_STATUS } from "../config/billing.js";

const router = Router();
router.use(requireAuth);

const ENTITLED_SUBSCRIPTION_STATUSES = new Set([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.PAST_DUE,
]);
const TEAM_INVITE_EXPIRY_HOURS = 72;

let resend = null;
if (env.resendApiKey) {
  resend = new Resend(env.resendApiKey);
}

function isPrivilegedRole(role) {
  return role === "owner" || role === "admin";
}

function normalizeStandalonePlan(user) {
  return user.subscriptionStatus &&
    ENTITLED_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus)
    ? PLAN_KEYS.PRO
    : PLAN_KEYS.FREE;
}

function makeToken() {
  return crypto.randomBytes(32).toString("hex");
}

function hoursFromNow(hours) {
  return new Date(Date.now() + hours * 60 * 60 * 1000);
}

function getMemberRecord(team, userId) {
  return (team.members ?? []).find(
    (member) => String(member.user) === String(userId),
  );
}

export function countActiveMembers(team) {
  return (team?.members ?? []).filter((member) => member.status === "active")
    .length;
}

export function countPendingInvites(team) {
  const now = new Date();
  return (team?.pendingInvites ?? []).filter(
    (invite) => invite.status === "pending" && invite.expiresAt > now,
  ).length;
}

export function hasAvailableSeat(team) {
  return (
    countActiveMembers(team) + countPendingInvites(team) <
    (team?.seatsPurchased ?? 0)
  );
}

function getMinimumTeamSeatQuantity(team) {
  return Math.max(5, countActiveMembers(team) + countPendingInvites(team));
}

export function getInviteTargetDecision({
  requesterId,
  targetUserId = null,
  targetUserActiveTeam = false,
  existingMemberStatus = null,
  existingInviteStatus = null,
  seatAvailable = true,
}) {
  if (targetUserId && String(targetUserId) === String(requesterId)) {
    return { allowed: false, error: "You are already on this team." };
  }
  if (targetUserActiveTeam) {
    return {
      allowed: false,
      error: "That user already belongs to an active team.",
    };
  }
  if (existingMemberStatus && existingMemberStatus !== "removed") {
    return {
      allowed: false,
      error: "That user is already a member of this team.",
    };
  }
  if (!seatAvailable) {
    return {
      allowed: false,
      error:
        "No team seats are available. Increase seats before adding or inviting another member.",
    };
  }

  if (targetUserId) {
    return {
      allowed: true,
      action: existingMemberStatus === "removed" ? "reactivate-member" : "add-member",
    };
  }

  return {
    allowed: true,
    action: existingInviteStatus === "pending" ? "refresh-invite" : "create-invite",
  };
}

export function getInviteAcceptanceDecision({
  userActiveTeam = false,
  inviteStatus,
  inviteExpiresAt,
  invitedEmail,
  userEmail,
  existingMemberStatus = null,
  seatAvailable = true,
  now = new Date(),
}) {
  if (userActiveTeam) {
    return {
      allowed: false,
      error: "You already belong to an active team.",
    };
  }
  if (inviteStatus !== "pending") {
    return {
      allowed: false,
      error: `This invite is already ${inviteStatus}.`,
    };
  }
  if (inviteExpiresAt <= now) {
    return {
      allowed: false,
      error: "This team invite has expired.",
      marksExpired: true,
    };
  }
  if (String(userEmail).toLowerCase().trim() !== String(invitedEmail).toLowerCase().trim()) {
    return {
      allowed: false,
      error:
        "This invite was issued for a different email address. Log in or register with the invited email first.",
    };
  }
  if (existingMemberStatus === "active") {
    return { allowed: true, action: "already-active" };
  }
  if (!seatAvailable) {
    return {
      allowed: false,
      error:
        "No team seats are currently available. Ask the team owner to free up or purchase more seats.",
    };
  }
  return {
    allowed: true,
    action: existingMemberStatus === "removed" ? "reactivate-member" : "create-member",
  };
}

export function validateRequestedMemberRole(requesterRole, requestedRole) {
  if (!["member", "admin"].includes(requestedRole)) {
    return {
      allowed: false,
      error: "Member role must be either member or admin.",
    };
  }
  if (requestedRole === "admin" && requesterRole !== "owner") {
    return {
      allowed: false,
      error: "Only the team owner can assign the admin role.",
    };
  }
  return { allowed: true };
}

export function getRemoveMemberDecision({
  requesterId,
  requesterRole,
  targetId,
  targetRole,
  targetStatus,
}) {
  if (String(targetId) === String(requesterId)) {
    return {
      allowed: false,
      error:
        "Owners and admins cannot remove themselves yet. A dedicated leave/transfer flow should be used later.",
    };
  }
  if (targetStatus !== "active") {
    return { allowed: false, error: "Active team member not found." };
  }
  if (targetRole === "owner") {
    return { allowed: false, error: "The team owner cannot be removed." };
  }
  if (requesterRole === "admin" && targetRole !== "member") {
    return {
      allowed: false,
      error: "Admins can only remove regular members.",
    };
  }
  return { allowed: true };
}

export function getTransferOwnershipDecision({
  requesterId,
  requesterRole,
  targetId,
  targetRole,
  targetStatus,
}) {
  if (requesterRole !== "owner") {
    return {
      allowed: false,
      error: "Only the current team owner can transfer ownership.",
    };
  }
  if (String(targetId) === String(requesterId)) {
    return { allowed: false, error: "You are already the team owner." };
  }
  if (targetStatus !== "active") {
    return { allowed: false, error: "Active target member not found." };
  }
  if (targetRole === "owner") {
    return {
      allowed: false,
      error: "That user is already the team owner.",
    };
  }
  return { allowed: true };
}

export function getLeaveTeamDecision({ requesterRole, activeMembers }) {
  if (requesterRole === "owner") {
    if (activeMembers > 1) {
      return {
        allowed: false,
        error:
          "Transfer ownership to another active member before leaving the team.",
      };
    }
    return { allowed: true, deletesTeam: true };
  }

  return { allowed: true, deletesTeam: false };
}

async function sendTeamInviteEmail(to, { teamName, token, inviterName, role }) {
  const registerLink = `${env.appUrl}/register?teamInviteToken=${encodeURIComponent(token)}`;
  const loginLink = `${env.appUrl}/login?teamInviteToken=${encodeURIComponent(token)}`;
  const from = env.emailFrom ?? "InterviewX <noreply@interviewx.app>";

  const html = `
    <div style="font-family:system-ui,sans-serif;max-width:520px;margin:0 auto;padding:32px 24px">
      <div style="margin-bottom:24px">
        <span style="display:inline-block;background:#7c3aed;color:#fff;font-weight:700;font-size:14px;padding:6px 14px;border-radius:8px;letter-spacing:.5px">
          InterviewX
        </span>
      </div>
      <h1 style="font-size:22px;font-weight:700;color:#0f0e17;margin:0 0 8px">
        You're invited to join ${teamName}
      </h1>
      <p style="font-size:15px;color:#6b7280;margin:0 0 18px;line-height:1.6">
        ${inviterName} invited you to join the team <strong>${teamName}</strong> on InterviewX as a <strong>${role}</strong>.
      </p>
      <p style="font-size:15px;color:#6b7280;margin:0 0 24px;line-height:1.6">
        If you already have an account, log in first. If you don't, create one with this email address, then accept the invite from the team workflow.
        This invite expires in <strong>${TEAM_INVITE_EXPIRY_HOURS} hours</strong>.
      </p>
      <div style="display:flex;gap:12px;flex-wrap:wrap">
        <a href="${registerLink}"
           style="display:inline-block;background:linear-gradient(135deg,#7c3aed,#9333ea);color:#fff;font-weight:600;font-size:15px;padding:12px 24px;border-radius:12px;text-decoration:none">
          Create account
        </a>
        <a href="${loginLink}"
           style="display:inline-block;background:#f3f4f6;color:#111827;font-weight:600;font-size:15px;padding:12px 24px;border-radius:12px;text-decoration:none;border:1px solid #e5e7eb">
          Log in
        </a>
      </div>
      <p style="font-size:13px;color:#9ca3af;margin:24px 0 0;line-height:1.6">
        Invite token (for the next step of acceptance):<br />
        <span style="word-break:break-all;color:#7c3aed">${token}</span>
      </p>
    </div>
  `;

  if (!resend) {
    console.log(
      `[teamRoutes] DEV — team invite for ${to}:\n  register: ${registerLink}\n  login: ${loginLink}\n  token: ${token}`,
    );
    return;
  }

  await resend.emails.send({
    from,
    to,
    subject: `You're invited to join ${teamName} on InterviewX`,
    html,
  });
}

async function serializeTeam(team, myRole) {
  const memberIds = Array.from(
    new Set((team.members ?? []).map((member) => String(member.user))),
  );

  const users = memberIds.length
    ? await User.find({ _id: { $in: memberIds } }).select("name email")
    : [];
  const userMap = new Map(users.map((user) => [user._id.toString(), user]));

  return {
    ...team.toPublicJSON(),
    members: (team.members ?? []).map((member) => {
      const userId = member.user?.toString?.() ?? String(member.user);
      const user = userMap.get(userId);
      return {
        userId,
        name: user?.name ?? null,
        email: user?.email ?? null,
        role: member.role,
        status: member.status,
        joinedAt: member.joinedAt,
      };
    }),
    pendingInvites: (team.pendingInvites ?? []).map((invite) => ({
      email: invite.email,
      role: invite.role,
      status: invite.status,
      invitedAt: invite.invitedAt,
      expiresAt: invite.expiresAt,
      acceptedAt: invite.acceptedAt,
    })),
    myRole,
  };
}

async function getRequesterTeamContext(userId) {
  const user = await User.findById(userId);
  if (!user) {
    return { error: { status: 404, message: "User not found." } };
  }

  if (!user.activeTeam) {
    return {
      error: { status: 409, message: "You do not belong to an active team." },
    };
  }

  const team = await Team.findById(user.activeTeam);
  if (!team) {
    return { error: { status: 404, message: "Active team not found." } };
  }

  const requesterMember = getMemberRecord(team, user._id);
  if (!requesterMember || requesterMember.status !== "active") {
    return {
      error: {
        status: 403,
        message: "You are not an active member of this team.",
      },
    };
  }

  return { user, team, requesterMember };
}

router.get("/me", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId).select("activeTeam teamRole");
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (!user.activeTeam) {
      return res.json({ team: null });
    }

    const team = await Team.findById(user.activeTeam);
    if (!team) {
      return res.json({ team: null });
    }

    return res.json({
      team: await serializeTeam(team, user.teamRole),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (user.activeTeam) {
      return res.status(409).json({
        error: "You already belong to an active team.",
      });
    }

    const { name } = req.body ?? {};
    if (!name || !name.trim()) {
      return res.status(400).json({ error: "Team name is required." });
    }

    const trimmedName = name.trim();
    if (trimmedName.length < 2 || trimmedName.length > 120) {
      return res.status(400).json({
        error: "Team name must be between 2 and 120 characters.",
      });
    }

    const team = new Team({
      name: trimmedName,
      owner: user._id,
      members: [
        {
          user: user._id,
          role: "owner",
          status: "active",
        },
      ],
    });

    await team.save();

    user.activeTeam = team._id;
    user.teamRole = "owner";
    user.plan = normalizeStandalonePlan(user);
    await user.save();

    return res.status(201).json({
      team: await serializeTeam(team, "owner"),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/members", async (req, res, next) => {
  try {
    const context = await getRequesterTeamContext(req.userId);
    if (context.error) {
      return res
        .status(context.error.status)
        .json({ error: context.error.message });
    }

    const { user: requester, team, requesterMember } = context;
    if (!isPrivilegedRole(requesterMember.role)) {
      return res.status(403).json({
        error: "Only team owners or admins can add members.",
      });
    }

    const { email, role = "member" } = req.body ?? {};
    const normalizedEmail = String(email ?? "").toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(400).json({ error: "Member email is required." });
    }

    const roleDecision = validateRequestedMemberRole(
      requesterMember.role,
      role,
    );
    if (!roleDecision.allowed) {
      return res.status(403).json({ error: roleDecision.error });
    }

    if (!hasAvailableSeat(team)) {
      return res.status(409).json({
        error:
          "No team seats are available. Increase seats before adding or inviting another member.",
      });
    }

    const targetUser = await User.findOne({ email: normalizedEmail });

    if (targetUser) {
      if (String(targetUser._id) === String(requester._id)) {
        return res.status(409).json({ error: "You are already on this team." });
      }
      if (targetUser.activeTeam) {
        return res.status(409).json({
          error: "That user already belongs to an active team.",
        });
      }

      const existingMember = getMemberRecord(team, targetUser._id);
      if (existingMember && existingMember.status !== "removed") {
        return res.status(409).json({
          error: "That user is already a member of this team.",
        });
      }

      if (existingMember && existingMember.status === "removed") {
        existingMember.role = role;
        existingMember.status = "active";
        existingMember.joinedAt = new Date();
      } else {
        team.members.push({
          user: targetUser._id,
          role,
          status: "active",
        });
      }

      await team.save();

      targetUser.activeTeam = team._id;
      targetUser.teamRole = role;
      targetUser.plan = normalizeStandalonePlan(targetUser);
      await targetUser.save();

      return res.status(201).json({
        team: await serializeTeam(team, requesterMember.role),
        addedMember: {
          id: targetUser._id.toString(),
          email: targetUser.email,
          name: targetUser.name,
          role,
        },
      });
    }

    const existingInvite = (team.pendingInvites ?? []).find(
      (invite) => invite.email === normalizedEmail && invite.status === "pending",
    );
    const token = makeToken();
    const expiresAt = hoursFromNow(TEAM_INVITE_EXPIRY_HOURS);

    if (existingInvite) {
      existingInvite.role = role;
      existingInvite.token = token;
      existingInvite.expiresAt = expiresAt;
      existingInvite.invitedBy = requester._id;
      existingInvite.invitedAt = new Date();
    } else {
      team.pendingInvites.push({
        email: normalizedEmail,
        role,
        token,
        status: "pending",
        invitedBy: requester._id,
        invitedAt: new Date(),
        expiresAt,
      });
    }

    await team.save();

    await sendTeamInviteEmail(normalizedEmail, {
      teamName: team.name,
      token,
      inviterName: requester.name,
      role,
    });

    return res.status(201).json({
      team: await serializeTeam(team, requesterMember.role),
      invitedEmail: normalizedEmail,
      invitedRole: role,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/accept-invite", async (req, res, next) => {
  try {
    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const { token } = req.body ?? {};
    if (!token || !String(token).trim()) {
      return res.status(400).json({ error: "Invite token is required." });
    }

    const team = await Team.findOne({ "pendingInvites.token": String(token).trim() });
    if (!team) {
      return res.status(404).json({
        error: "Invite not found or already used.",
      });
    }

    const invite = (team.pendingInvites ?? []).find(
      (item) => item.token === String(token).trim(),
    );
    if (!invite) {
      return res.status(404).json({
        error: "Invite not found or already used.",
      });
    }

    const existingMember = getMemberRecord(team, user._id);
    const acceptanceDecision = getInviteAcceptanceDecision({
      userActiveTeam: Boolean(user.activeTeam),
      inviteStatus: invite.status,
      inviteExpiresAt: invite.expiresAt,
      invitedEmail: invite.email,
      userEmail: user.email,
      existingMemberStatus: existingMember?.status ?? null,
      seatAvailable: hasAvailableSeat(team),
      now: new Date(),
    });

    if (!acceptanceDecision.allowed) {
      if (acceptanceDecision.marksExpired) {
        invite.status = "expired";
        await team.save();
      }
      return res.status(
        acceptanceDecision.error.includes("not found") ? 404 : acceptanceDecision.error.includes("different email") ? 403 : acceptanceDecision.error.includes("already belong") ? 409 : acceptanceDecision.error.includes("expired") ? 400 : 409,
      ).json({ error: acceptanceDecision.error });
    }

    if (acceptanceDecision.action === "already-active") {
      invite.status = "accepted";
      invite.acceptedAt = new Date();
      await team.save();
      return res.json({
        team: await serializeTeam(team, existingMember.role),
      });
    }

    if (acceptanceDecision.action === "reactivate-member") {
      existingMember.role = invite.role;
      existingMember.status = "active";
      existingMember.joinedAt = new Date();
    } else {
      team.members.push({
        user: user._id,
        role: invite.role,
        status: "active",
      });
    }

    invite.status = "accepted";
    invite.acceptedAt = new Date();
    await team.save();

    user.activeTeam = team._id;
    user.teamRole = invite.role;
    user.plan = normalizeStandalonePlan(user);
    await user.save();

    return res.json({
      team: await serializeTeam(team, invite.role),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/invites/resend", async (req, res, next) => {
  try {
    const context = await getRequesterTeamContext(req.userId);
    if (context.error) {
      return res
        .status(context.error.status)
        .json({ error: context.error.message });
    }

    const { user: requester, team, requesterMember } = context;
    if (!isPrivilegedRole(requesterMember.role)) {
      return res.status(403).json({
        error: "Only team owners or admins can resend invites.",
      });
    }

    const { email } = req.body ?? {};
    const normalizedEmail = String(email ?? "").toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(400).json({ error: "Invite email is required." });
    }

    const invite = (team.pendingInvites ?? []).find(
      (item) => item.email === normalizedEmail && item.status === "pending",
    );
    if (!invite) {
      return res.status(404).json({ error: "Pending invite not found." });
    }

    invite.token = makeToken();
    invite.invitedAt = new Date();
    invite.expiresAt = hoursFromNow(TEAM_INVITE_EXPIRY_HOURS);
    invite.invitedBy = requester._id;
    await team.save();

    await sendTeamInviteEmail(normalizedEmail, {
      teamName: team.name,
      token: invite.token,
      inviterName: requester.name,
      role: invite.role,
    });

    return res.json({
      team: await serializeTeam(team, requesterMember.role),
      resentEmail: normalizedEmail,
    });
  } catch (err) {
    next(err);
  }
});

router.post("/invites/revoke", async (req, res, next) => {
  try {
    const context = await getRequesterTeamContext(req.userId);
    if (context.error) {
      return res
        .status(context.error.status)
        .json({ error: context.error.message });
    }

    const { team, requesterMember } = context;
    if (!isPrivilegedRole(requesterMember.role)) {
      return res.status(403).json({
        error: "Only team owners or admins can revoke invites.",
      });
    }

    const { email } = req.body ?? {};
    const normalizedEmail = String(email ?? "").toLowerCase().trim();
    if (!normalizedEmail) {
      return res.status(400).json({ error: "Invite email is required." });
    }

    const invite = (team.pendingInvites ?? []).find(
      (item) => item.email === normalizedEmail && item.status === "pending",
    );
    if (!invite) {
      return res.status(404).json({ error: "Pending invite not found." });
    }

    invite.status = "revoked";
    await team.save();

    return res.json({
      team: await serializeTeam(team, requesterMember.role),
      revokedEmail: normalizedEmail,
    });
  } catch (err) {
    next(err);
  }
});

router.delete("/members/:userId", async (req, res, next) => {
  try {
    const context = await getRequesterTeamContext(req.userId);
    if (context.error) {
      return res
        .status(context.error.status)
        .json({ error: context.error.message });
    }

    const { team, requesterMember } = context;
    if (!isPrivilegedRole(requesterMember.role)) {
      return res.status(403).json({
        error: "Only team owners or admins can remove members.",
      });
    }

    const { userId } = req.params;
    if (!userId) {
      return res.status(400).json({ error: "Member userId is required." });
    }

    const member = getMemberRecord(team, userId);
    const decision = getRemoveMemberDecision({
      requesterId: req.userId,
      requesterRole: requesterMember.role,
      targetId: userId,
      targetRole: member?.role,
      targetStatus: member?.status,
    });
    if (!decision.allowed) {
      return res.status(
        decision.error === "Active team member not found." ? 404 : 409,
      ).json({ error: decision.error });
    }

    member.status = "removed";
    await team.save();

    const targetUser = await User.findById(userId);
    if (targetUser && String(targetUser.activeTeam) === String(team._id)) {
      targetUser.activeTeam = null;
      targetUser.teamRole = null;
      targetUser.plan = normalizeStandalonePlan(targetUser);
      await targetUser.save();
    }

    return res.json({
      team: await serializeTeam(team, requesterMember.role),
      removedUserId: String(userId),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/transfer-ownership", async (req, res, next) => {
  try {
    const context = await getRequesterTeamContext(req.userId);
    if (context.error) {
      return res
        .status(context.error.status)
        .json({ error: context.error.message });
    }

    const { user: requester, team, requesterMember } = context;
    const { userId } = req.body ?? {};
    if (!userId) {
      return res.status(400).json({ error: "Target userId is required." });
    }

    const targetMember = getMemberRecord(team, userId);
    const decision = getTransferOwnershipDecision({
      requesterId: requester._id,
      requesterRole: requesterMember.role,
      targetId: userId,
      targetRole: targetMember?.role,
      targetStatus: targetMember?.status,
    });
    if (!decision.allowed) {
      return res.status(
        decision.error.includes("not found") ? 404 : 409,
      ).json({ error: decision.error });
    }

    requesterMember.role = "admin";
    targetMember.role = "owner";
    team.owner = targetMember.user;
    await team.save();

    requester.teamRole = "admin";
    await requester.save();

    const targetUser = await User.findById(userId);
    if (targetUser && String(targetUser.activeTeam) === String(team._id)) {
      targetUser.teamRole = "owner";
      await targetUser.save();
    }

    return res.json({
      team: await serializeTeam(team, "admin"),
      newOwnerUserId: String(userId),
    });
  } catch (err) {
    next(err);
  }
});

router.post("/leave", async (req, res, next) => {
  try {
    const context = await getRequesterTeamContext(req.userId);
    if (context.error) {
      return res
        .status(context.error.status)
        .json({ error: context.error.message });
    }

    const { user, team, requesterMember } = context;
    const leaveDecision = getLeaveTeamDecision({
      requesterRole: requesterMember.role,
      activeMembers: countActiveMembers(team),
    });
    if (!leaveDecision.allowed) {
      return res.status(409).json({ error: leaveDecision.error });
    }

    if (leaveDecision.deletesTeam) {
      await Team.deleteOne({ _id: team._id });
      user.activeTeam = null;
      user.teamRole = null;
      user.plan = normalizeStandalonePlan(user);
      await user.save();

      return res.json({
        team: null,
        leftTeam: true,
        deletedTeam: true,
      });
    }

    requesterMember.status = "removed";
    await team.save();

    user.activeTeam = null;
    user.teamRole = null;
    user.plan = normalizeStandalonePlan(user);
    await user.save();

    return res.json({
      team: null,
      leftTeam: true,
      deletedTeam: false,
    });
  } catch (err) {
    next(err);
  }
});

export default router;
