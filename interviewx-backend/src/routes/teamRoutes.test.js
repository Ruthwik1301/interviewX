import test from "node:test";
import assert from "node:assert/strict";

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/interviewx-test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-groq-key";

const {
  countActiveMembers,
  countPendingInvites,
  hasAvailableSeat,
  getInviteTargetDecision,
  getInviteAcceptanceDecision,
  validateRequestedMemberRole,
  getRemoveMemberDecision,
  getTransferOwnershipDecision,
  getLeaveTeamDecision,
} = await import("./teamRoutes.js");

test("countActiveMembers counts only active members", () => {
  const team = {
    members: [
      { status: "active" },
      { status: "removed" },
      { status: "active" },
      { status: "invited" },
    ],
  };

  assert.equal(countActiveMembers(team), 2);
});

test("countPendingInvites counts only pending non-expired invites", () => {
  const future = new Date(Date.now() + 60_000);
  const past = new Date(Date.now() - 60_000);
  const team = {
    pendingInvites: [
      { status: "pending", expiresAt: future },
      { status: "accepted", expiresAt: future },
      { status: "pending", expiresAt: past },
      { status: "pending", expiresAt: future },
    ],
  };

  assert.equal(countPendingInvites(team), 2);
});

test("hasAvailableSeat returns false when active members and pending invites fill purchased seats", () => {
  const future = new Date(Date.now() + 60_000);
  const team = {
    seatsPurchased: 3,
    members: [{ status: "active" }, { status: "active" }],
    pendingInvites: [{ status: "pending", expiresAt: future }],
  };

  assert.equal(hasAvailableSeat(team), false);
});

test("owner can assign admin role but admin cannot", () => {
  assert.deepEqual(validateRequestedMemberRole("owner", "admin"), {
    allowed: true,
  });

  assert.deepEqual(validateRequestedMemberRole("admin", "admin"), {
    allowed: false,
    error: "Only the team owner can assign the admin role.",
  });
});

test("invite target decision blocks inviting yourself and already-teamed users", () => {
  const selfDecision = getInviteTargetDecision({
    requesterId: "u1",
    targetUserId: "u1",
    targetUserActiveTeam: false,
    seatAvailable: true,
  });
  assert.equal(selfDecision.allowed, false);
  assert.equal(selfDecision.error, "You are already on this team.");

  const teamedDecision = getInviteTargetDecision({
    requesterId: "u1",
    targetUserId: "u2",
    targetUserActiveTeam: true,
    seatAvailable: true,
  });
  assert.equal(teamedDecision.allowed, false);
  assert.equal(
    teamedDecision.error,
    "That user already belongs to an active team.",
  );
});

test("invite target decision distinguishes add-member, reactivate-member, create-invite, and refresh-invite", () => {
  assert.deepEqual(
    getInviteTargetDecision({
      requesterId: "u1",
      targetUserId: "u2",
      targetUserActiveTeam: false,
      existingMemberStatus: null,
      seatAvailable: true,
    }),
    { allowed: true, action: "add-member" },
  );

  assert.deepEqual(
    getInviteTargetDecision({
      requesterId: "u1",
      targetUserId: "u2",
      targetUserActiveTeam: false,
      existingMemberStatus: "removed",
      seatAvailable: true,
    }),
    { allowed: true, action: "reactivate-member" },
  );

  assert.deepEqual(
    getInviteTargetDecision({
      requesterId: "u1",
      targetUserId: null,
      existingInviteStatus: null,
      seatAvailable: true,
    }),
    { allowed: true, action: "create-invite" },
  );

  assert.deepEqual(
    getInviteTargetDecision({
      requesterId: "u1",
      targetUserId: null,
      existingInviteStatus: "pending",
      seatAvailable: true,
    }),
    { allowed: true, action: "refresh-invite" },
  );
});

test("invite target decision blocks when no seats are available", () => {
  const decision = getInviteTargetDecision({
    requesterId: "u1",
    targetUserId: null,
    seatAvailable: false,
  });
  assert.equal(decision.allowed, false);
  assert.equal(
    decision.error,
    "No team seats are available. Increase seats before adding or inviting another member.",
  );
});

test("remove member decision blocks self-removal and owner removal", () => {
  const selfDecision = getRemoveMemberDecision({
    requesterId: "u1",
    requesterRole: "owner",
    targetId: "u1",
    targetRole: "member",
    targetStatus: "active",
  });
  assert.equal(selfDecision.allowed, false);

  const ownerDecision = getRemoveMemberDecision({
    requesterId: "u2",
    requesterRole: "owner",
    targetId: "u1",
    targetRole: "owner",
    targetStatus: "active",
  });
  assert.equal(ownerDecision.allowed, false);
});

test("admin can remove member but not another admin", () => {
  const memberDecision = getRemoveMemberDecision({
    requesterId: "u2",
    requesterRole: "admin",
    targetId: "u3",
    targetRole: "member",
    targetStatus: "active",
  });
  assert.equal(memberDecision.allowed, true);

  const adminDecision = getRemoveMemberDecision({
    requesterId: "u2",
    requesterRole: "admin",
    targetId: "u4",
    targetRole: "admin",
    targetStatus: "active",
  });
  assert.equal(adminDecision.allowed, false);
  assert.equal(
    adminDecision.error,
    "Admins can only remove regular members.",
  );
});

test("transfer ownership requires current owner and active non-owner target", () => {
  const allowed = getTransferOwnershipDecision({
    requesterId: "u1",
    requesterRole: "owner",
    targetId: "u2",
    targetRole: "admin",
    targetStatus: "active",
  });
  assert.equal(allowed.allowed, true);

  const notOwner = getTransferOwnershipDecision({
    requesterId: "u2",
    requesterRole: "admin",
    targetId: "u3",
    targetRole: "member",
    targetStatus: "active",
  });
  assert.equal(notOwner.allowed, false);

  const alreadyOwner = getTransferOwnershipDecision({
    requesterId: "u1",
    requesterRole: "owner",
    targetId: "u4",
    targetRole: "owner",
    targetStatus: "active",
  });
  assert.equal(alreadyOwner.allowed, false);
});

test("invite acceptance blocks wrong-email and already-used invites", () => {
  const wrongEmail = getInviteAcceptanceDecision({
    userActiveTeam: false,
    inviteStatus: "pending",
    inviteExpiresAt: new Date(Date.now() + 60_000),
    invitedEmail: "invitee@example.com",
    userEmail: "someoneelse@example.com",
    seatAvailable: true,
  });
  assert.equal(wrongEmail.allowed, false);
  assert.match(wrongEmail.error, /different email address/);

  const usedInvite = getInviteAcceptanceDecision({
    userActiveTeam: false,
    inviteStatus: "accepted",
    inviteExpiresAt: new Date(Date.now() + 60_000),
    invitedEmail: "invitee@example.com",
    userEmail: "invitee@example.com",
    seatAvailable: true,
  });
  assert.equal(usedInvite.allowed, false);
  assert.equal(usedInvite.error, "This invite is already accepted.");
});

test("invite acceptance marks expired invites and blocks seat exhaustion", () => {
  const expired = getInviteAcceptanceDecision({
    userActiveTeam: false,
    inviteStatus: "pending",
    inviteExpiresAt: new Date(Date.now() - 1),
    invitedEmail: "invitee@example.com",
    userEmail: "invitee@example.com",
    seatAvailable: true,
  });
  assert.equal(expired.allowed, false);
  assert.equal(expired.marksExpired, true);
  assert.equal(expired.error, "This team invite has expired.");

  const noSeat = getInviteAcceptanceDecision({
    userActiveTeam: false,
    inviteStatus: "pending",
    inviteExpiresAt: new Date(Date.now() + 60_000),
    invitedEmail: "invitee@example.com",
    userEmail: "invitee@example.com",
    seatAvailable: false,
  });
  assert.equal(noSeat.allowed, false);
  assert.match(noSeat.error, /No team seats are currently available/);
});

test("invite acceptance distinguishes already-active, reactivated, and new-member paths", () => {
  assert.deepEqual(
    getInviteAcceptanceDecision({
      userActiveTeam: false,
      inviteStatus: "pending",
      inviteExpiresAt: new Date(Date.now() + 60_000),
      invitedEmail: "invitee@example.com",
      userEmail: "invitee@example.com",
      existingMemberStatus: "active",
      seatAvailable: true,
    }),
    { allowed: true, action: "already-active" },
  );

  assert.deepEqual(
    getInviteAcceptanceDecision({
      userActiveTeam: false,
      inviteStatus: "pending",
      inviteExpiresAt: new Date(Date.now() + 60_000),
      invitedEmail: "invitee@example.com",
      userEmail: "invitee@example.com",
      existingMemberStatus: "removed",
      seatAvailable: true,
    }),
    { allowed: true, action: "reactivate-member" },
  );

  assert.deepEqual(
    getInviteAcceptanceDecision({
      userActiveTeam: false,
      inviteStatus: "pending",
      inviteExpiresAt: new Date(Date.now() + 60_000),
      invitedEmail: "invitee@example.com",
      userEmail: "invitee@example.com",
      existingMemberStatus: null,
      seatAvailable: true,
    }),
    { allowed: true, action: "create-member" },
  );
});

test("leave team decision requires owner to transfer first when other active members remain", () => {
  const blocked = getLeaveTeamDecision({
    requesterRole: "owner",
    activeMembers: 2,
  });
  assert.equal(blocked.allowed, false);

  const deleteTeam = getLeaveTeamDecision({
    requesterRole: "owner",
    activeMembers: 1,
  });
  assert.equal(deleteTeam.allowed, true);
  assert.equal(deleteTeam.deletesTeam, true);

  const memberLeave = getLeaveTeamDecision({
    requesterRole: "member",
    activeMembers: 5,
  });
  assert.equal(memberLeave.allowed, true);
  assert.equal(memberLeave.deletesTeam, false);
});
