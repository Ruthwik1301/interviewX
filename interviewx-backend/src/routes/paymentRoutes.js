import crypto from "crypto";
import express, { Router } from "express";
import Razorpay from "razorpay";
import { requireAuth } from "../middleware/auth.js";
import { Team } from "../models/Team.js";
import { User } from "../models/User.js";
import { env } from "../config/env.js";
import {
  PLAN_KEYS,
  SUBSCRIPTION_STATUS,
  canStartSelfServeCheckout,
  getPlanConfig,
} from "../config/billing.js";

const router = Router();

// A subscription is billed indefinitely until cancelled. Razorpay requires a
// finite total_count of billing cycles up front, so we use a large number
// (10 years of monthly cycles) to approximate "until cancelled".
const RAZORPAY_TOTAL_BILLING_CYCLES = 120;

const ENTITLED_STATUSES = new Set([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.PAST_DUE,
]);

function getRazorpayClient() {
  if (!env.razorpayKeyId || !env.razorpayKeySecret) return null;
  return new Razorpay({
    key_id: env.razorpayKeyId,
    key_secret: env.razorpayKeySecret,
  });
}

function getPlanIdForPlan(plan) {
  if (plan === PLAN_KEYS.PRO) return env.razorpayPlanIdPro;
  if (plan === PLAN_KEYS.TEAM) return env.razorpayPlanIdTeam;
  return null;
}

function getMemberRecord(team, userId) {
  return (team?.members ?? []).find(
    (member) => String(member.user) === String(userId),
  );
}

function countActiveMembers(team) {
  return (team?.members ?? []).filter((member) => member.status === "active")
    .length;
}

function countPendingInvites(team) {
  const now = new Date();
  return (team?.pendingInvites ?? []).filter(
    (invite) => invite.status === "pending" && invite.expiresAt > now,
  ).length;
}

function getMinimumTeamSeatQuantity(team) {
  return Math.max(5, countActiveMembers(team) + countPendingInvites(team));
}

async function ensureRazorpayCustomer(razorpay, user) {
  if (user.razorpayCustomerId) {
    return user.razorpayCustomerId;
  }

  // fail_existing: "0" makes this idempotent - if a customer with this email
  // already exists on the Razorpay account, it returns that customer instead
  // of throwing.
  const customer = await razorpay.customers.create({
    name: user.name,
    email: user.email,
    fail_existing: 0,
  });

  user.razorpayCustomerId = customer.id;
  await user.save();
  return customer.id;
}

async function ensureTeamRazorpayCustomer(razorpay, team, ownerUser) {
  if (team.razorpayCustomerId) {
    return team.razorpayCustomerId;
  }

  const customer = await razorpay.customers.create({
    name: team.name,
    email: ownerUser.email,
    fail_existing: 0,
  });

  team.razorpayCustomerId = customer.id;
  await team.save();
  return customer.id;
}

function normalizeRazorpaySubscriptionStatus(status) {
  switch (status) {
    case "created":
      return SUBSCRIPTION_STATUS.INCOMPLETE;
    case "authenticated":
    case "active":
      return SUBSCRIPTION_STATUS.ACTIVE;
    case "pending":
    case "halted":
      return SUBSCRIPTION_STATUS.PAST_DUE;
    case "cancelled":
      return SUBSCRIPTION_STATUS.CANCELED;
    case "completed":
      return SUBSCRIPTION_STATUS.CANCELED;
    case "expired":
      return SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED;
    default:
      return SUBSCRIPTION_STATUS.NOT_STARTED;
  }
}

function resolvePlanFromNotes(notes) {
  const plan = notes?.plan;
  if (plan === PLAN_KEYS.PRO || plan === PLAN_KEYS.TEAM) return plan;
  return null;
}

async function findUserForSubscription(subscription) {
  const userId = subscription?.notes?.userId ?? null;
  if (userId) {
    const user = await User.findById(userId);
    if (user) return user;
  }

  const user = await User.findOne({
    razorpaySubscriptionId: subscription?.id,
  });
  return user;
}

async function findTeamForSubscription(subscription) {
  const teamId = subscription?.notes?.teamId ?? null;
  if (teamId) {
    const team = await Team.findById(teamId);
    if (team) return team;
  }

  const team = await Team.findOne({
    razorpaySubscriptionId: subscription?.id,
  });
  return team;
}

async function syncUserFromSubscription(user, subscription) {
  const normalizedStatus = normalizeRazorpaySubscriptionStatus(
    subscription?.status,
  );
  const resolvedPlan = resolvePlanFromNotes(subscription?.notes) ?? user.plan;
  const currentPeriodEnd = subscription?.current_end
    ? new Date(subscription.current_end * 1000)
    : null;

  user.razorpaySubscriptionId = subscription?.id ?? user.razorpaySubscriptionId;
  user.subscriptionStatus = normalizedStatus;
  user.subscriptionCurrentPeriodEnd = currentPeriodEnd;

  user.plan =
    resolvedPlan === PLAN_KEYS.PRO && ENTITLED_STATUSES.has(normalizedStatus)
      ? PLAN_KEYS.PRO
      : PLAN_KEYS.FREE;

  await user.save();
}

async function syncTeamFromSubscription(team, subscription) {
  const normalizedStatus = normalizeRazorpaySubscriptionStatus(
    subscription?.status,
  );
  const currentPeriodEnd = subscription?.current_end
    ? new Date(subscription.current_end * 1000)
    : null;
  const quantity = Number(subscription?.quantity ?? 0);

  team.razorpaySubscriptionId = subscription?.id ?? team.razorpaySubscriptionId;
  team.subscriptionStatus = normalizedStatus;
  team.subscriptionCurrentPeriodEnd = currentPeriodEnd;
  if (quantity > 0) {
    team.seatsPurchased = quantity;
  }

  await team.save();
}

async function handleSubscriptionEvent(subscription) {
  if (!subscription) return;

  const plan = resolvePlanFromNotes(subscription.notes);

  if (plan === PLAN_KEYS.TEAM) {
    const team = await findTeamForSubscription(subscription);
    if (!team) {
      console.warn(
        "[payments] Razorpay subscription webhook received for unknown team.",
      );
      return;
    }
    await syncTeamFromSubscription(team, subscription);
    return;
  }

  const user = await findUserForSubscription(subscription);
  if (!user) {
    console.warn(
      "[payments] Razorpay subscription webhook received for unknown user.",
    );
    return;
  }
  await syncUserFromSubscription(user, subscription);
}

function isValidRazorpayWebhookSignature(rawBody, signatureHeader, secret) {
  if (!signatureHeader) return false;

  const expected = crypto
    .createHmac("sha256", secret)
    .update(rawBody)
    .digest("hex");

  try {
    const left = Buffer.from(expected, "utf8");
    const right = Buffer.from(String(signatureHeader), "utf8");
    if (left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

// ── Create subscription: called from the pricing page to start checkout ──
router.post("/create-subscription", requireAuth, async (req, res) => {
  try {
    const { plan } = req.body ?? {};

    if (!plan) {
      return res.status(400).json({ error: "plan is required." });
    }

    if (!Object.values(PLAN_KEYS).includes(plan)) {
      return res.status(400).json({ error: "Invalid plan." });
    }

    const planConfig = getPlanConfig(plan);

    if (!canStartSelfServeCheckout(plan)) {
      return res.status(400).json({
        error: `${planConfig.label} does not require checkout.`,
      });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({
        error:
          "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET on the backend.",
      });
    }

    const planId = getPlanIdForPlan(plan);
    if (!planId) {
      return res.status(503).json({
        error: `Razorpay plan is not configured for the ${planConfig.label} plan.`,
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    if (plan === PLAN_KEYS.TEAM) {
      if (!user.activeTeam || user.teamRole !== "owner") {
        return res.status(403).json({
          error: "Only the owner of an active team can start Team checkout.",
        });
      }

      const team = await Team.findById(user.activeTeam);
      if (!team) {
        return res.status(404).json({ error: "Active team not found." });
      }

      const customerId = await ensureTeamRazorpayCustomer(razorpay, team, user);
      const seatQuantity = getMinimumTeamSeatQuantity(team);

      const subscription = await razorpay.subscriptions.create({
        plan_id: planId,
        customer_notify: 1,
        total_count: RAZORPAY_TOTAL_BILLING_CYCLES,
        quantity: seatQuantity,
        notes: {
          teamId: team._id.toString(),
          ownerUserId: user._id.toString(),
          plan,
        },
      });

      // Best-effort: link the Razorpay customer we resolved above to this
      // subscription record for later lookups (Razorpay associates the
      // customer via the notify email, not this field, so this is just for
      // our own reference).
      void customerId;

      return res.status(201).json({
        subscriptionId: subscription.id,
        razorpayKeyId: env.razorpayKeyId,
        plan,
        seats: seatQuantity,
        prefill: { name: user.name, email: user.email },
      });
    }

    await ensureRazorpayCustomer(razorpay, user);

    const subscription = await razorpay.subscriptions.create({
      plan_id: planId,
      customer_notify: 1,
      total_count: RAZORPAY_TOTAL_BILLING_CYCLES,
      notes: {
        userId: user._id.toString(),
        plan,
      },
    });

    return res.status(201).json({
      subscriptionId: subscription.id,
      razorpayKeyId: env.razorpayKeyId,
      plan,
      prefill: { name: user.name, email: user.email },
    });
  } catch (err) {
    console.error("[payments] create-subscription failed:", err.message);
    return res.status(err.statusCode || 502).json({
      error:
        err.error?.description ||
        err.message ||
        "Failed to create Razorpay subscription. Please try again.",
    });
  }
});

// ── Verify: called from the frontend Checkout.js success handler ──
router.post("/verify-subscription", requireAuth, async (req, res) => {
  try {
    const {
      razorpay_payment_id: paymentId,
      razorpay_subscription_id: subscriptionId,
      razorpay_signature: signature,
    } = req.body ?? {};

    if (!paymentId || !subscriptionId || !signature) {
      return res.status(400).json({
        error: "Missing Razorpay payment verification fields.",
      });
    }

    if (!env.razorpayKeySecret) {
      return res.status(503).json({
        error: "Razorpay is not configured on the backend.",
      });
    }

    const expectedSignature = crypto
      .createHmac("sha256", env.razorpayKeySecret)
      .update(`${paymentId}|${subscriptionId}`)
      .digest("hex");

    const validSignature =
      expectedSignature.length === signature.length &&
      crypto.timingSafeEqual(
        Buffer.from(expectedSignature, "utf8"),
        Buffer.from(signature, "utf8"),
      );

    if (!validSignature) {
      return res.status(400).json({ error: "Invalid payment signature." });
    }

    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({
        error: "Razorpay is not configured on the backend.",
      });
    }

    const subscription = await razorpay.subscriptions.fetch(subscriptionId);
    await handleSubscriptionEvent(subscription);

    const user = await User.findById(req.userId).select(
      "email plan subscriptionStatus activeTeam teamRole",
    );

    return res.json({
      verified: true,
      plan: user?.plan ?? PLAN_KEYS.FREE,
      subscriptionStatus:
        user?.subscriptionStatus ?? SUBSCRIPTION_STATUS.NOT_STARTED,
    });
  } catch (err) {
    console.error("[payments] verify-subscription failed:", err.message);
    return res.status(err.statusCode || 502).json({
      error:
        err.error?.description ||
        err.message ||
        "Failed to verify Razorpay payment. Please contact support if you were charged.",
    });
  }
});

// ── Cancel: replaces the Stripe billing-portal "manage subscription" flow ──
router.post("/cancel-subscription", requireAuth, async (req, res) => {
  try {
    const razorpay = getRazorpayClient();
    if (!razorpay) {
      return res.status(503).json({
        error: "Razorpay is not configured on the backend.",
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const scope = req.body?.scope === "team" ? "team" : "user";

    if (scope === "team") {
      if (!user.activeTeam || user.teamRole !== "owner") {
        return res.status(403).json({
          error: "Only the owner of an active team can cancel Team billing.",
        });
      }

      const team = await Team.findById(user.activeTeam);
      if (!team?.razorpaySubscriptionId) {
        return res.status(409).json({
          error: "No active Team subscription was found to cancel.",
        });
      }

      // Cancel at the end of the current billing cycle so the team keeps
      // access for time already paid for.
      const subscription = await razorpay.subscriptions.cancel(
        team.razorpaySubscriptionId,
        { cancel_at_cycle_end: 1 },
      );
      await syncTeamFromSubscription(team, subscription);

      return res.json({ cancelled: true, status: subscription.status });
    }

    if (!user.razorpaySubscriptionId) {
      return res.status(409).json({
        error: "No active subscription was found to cancel.",
      });
    }

    const subscription = await razorpay.subscriptions.cancel(
      user.razorpaySubscriptionId,
      { cancel_at_cycle_end: 1 },
    );
    await syncUserFromSubscription(user, subscription);

    return res.json({ cancelled: true, status: subscription.status });
  } catch (err) {
    console.error("[payments] cancel-subscription failed:", err.message);
    return res.status(err.statusCode || 502).json({
      error:
        err.error?.description ||
        err.message ||
        "Failed to cancel the Razorpay subscription. Please try again.",
    });
  }
});

// ── Webhook: keeps plan/status in sync for renewals, failures, cancellations ──
router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (!env.razorpayWebhookSecret) {
        return res.status(503).json({
          error:
            "Razorpay webhook is not configured. Add RAZORPAY_WEBHOOK_SECRET on the backend.",
        });
      }

      const signature = req.headers["x-razorpay-signature"];
      if (
        !isValidRazorpayWebhookSignature(
          req.body,
          signature,
          env.razorpayWebhookSecret,
        )
      ) {
        return res
          .status(400)
          .json({ error: "Invalid Razorpay webhook signature." });
      }

      let event;
      try {
        event = JSON.parse(req.body.toString("utf8"));
      } catch {
        return res
          .status(400)
          .json({ error: "Invalid Razorpay webhook payload." });
      }

      const subscriptionEntity = event?.payload?.subscription?.entity ?? null;

      switch (event?.event) {
        case "subscription.authenticated":
        case "subscription.activated":
        case "subscription.charged":
        case "subscription.completed":
        case "subscription.cancelled":
        case "subscription.paused":
        case "subscription.halted":
        case "subscription.pending":
          await handleSubscriptionEvent(subscriptionEntity);
          break;
        default:
          break;
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("[payments] webhook failed:", err.message);
      return res.status(500).json({
        error: "Failed to process Razorpay webhook.",
      });
    }
  },
);

export default router;
