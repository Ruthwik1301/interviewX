import test from "node:test";
import assert from "node:assert/strict";

process.env.MONGODB_URI = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/interviewx-test";
process.env.JWT_SECRET = process.env.JWT_SECRET || "test-secret";
process.env.GROQ_API_KEY = process.env.GROQ_API_KEY || "test-groq-key";

const { resolveAccessContextFromState } = await import("./interviewController.js");

test("falls back to free plan when no user is present", () => {
  const result = resolveAccessContextFromState(null, null);
  assert.equal(result.plan, "free");
  assert.equal(result.dailyLimit, 2);
});

test("grants Pro access only when individual subscription is entitled", () => {
  const user = {
    _id: "u1",
    plan: "pro",
    subscriptionStatus: "active",
    activeTeam: null,
  };

  const result = resolveAccessContextFromState(user, null);
  assert.equal(result.plan, "pro");
  assert.equal(result.dailyLimit, 5);
});

test("falls back to Free when individual Pro subscription is not entitled", () => {
  const user = {
    _id: "u1",
    plan: "pro",
    subscriptionStatus: "canceled",
    activeTeam: null,
  };

  const result = resolveAccessContextFromState(user, null);
  assert.equal(result.plan, "free");
  assert.equal(result.dailyLimit, 2);
});

test("grants Team access only when member is active, team is entitled, and seats are not exceeded", () => {
  const user = {
    _id: "u1",
    plan: "free",
    subscriptionStatus: "not_started",
    activeTeam: "t1",
  };
  const team = {
    _id: "t1",
    subscriptionStatus: "active",
    seatsPurchased: 2,
    members: [
      { user: "u1", role: "member", status: "active" },
      { user: "u2", role: "member", status: "active" },
    ],
  };

  const result = resolveAccessContextFromState(user, team);
  assert.equal(result.plan, "team");
  assert.equal(result.dailyLimit, 3);
  assert.equal(result.teamMember.role, "member");
});

test("falls back to individual plan when team subscription is not entitled", () => {
  const user = {
    _id: "u1",
    plan: "pro",
    subscriptionStatus: "active",
    activeTeam: "t1",
  };
  const team = {
    _id: "t1",
    subscriptionStatus: "not_started",
    seatsPurchased: 5,
    members: [{ user: "u1", role: "member", status: "active" }],
  };

  const result = resolveAccessContextFromState(user, team);
  assert.equal(result.plan, "pro");
  assert.equal(result.dailyLimit, 5);
});

test("falls back to individual plan when active members exceed purchased seats", () => {
  const user = {
    _id: "u1",
    plan: "free",
    subscriptionStatus: "not_started",
    activeTeam: "t1",
  };
  const team = {
    _id: "t1",
    subscriptionStatus: "active",
    seatsPurchased: 1,
    members: [
      { user: "u1", role: "member", status: "active" },
      { user: "u2", role: "member", status: "active" },
    ],
  };

  const result = resolveAccessContextFromState(user, team);
  assert.equal(result.plan, "free");
  assert.equal(result.dailyLimit, 2);
});

test("falls back to individual plan when team member is removed", () => {
  const user = {
    _id: "u1",
    plan: "pro",
    subscriptionStatus: "active",
    activeTeam: "t1",
  };
  const team = {
    _id: "t1",
    subscriptionStatus: "active",
    seatsPurchased: 5,
    members: [{ user: "u1", role: "member", status: "removed" }],
  };

  const result = resolveAccessContextFromState(user, team);
  assert.equal(result.plan, "pro");
  assert.equal(result.dailyLimit, 5);
});
