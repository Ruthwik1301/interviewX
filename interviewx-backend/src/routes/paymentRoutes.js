import crypto from "crypto";
import express, { Router } from "express";
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
const STRIPE_API_BASE = "https://api.stripe.com/v1";
const STRIPE_WEBHOOK_TOLERANCE_SECONDS = 300;
const ENTITLED_STATUSES = new Set([
  SUBSCRIPTION_STATUS.ACTIVE,
  SUBSCRIPTION_STATUS.TRIALING,
  SUBSCRIPTION_STATUS.PAST_DUE,
]);

function buildCheckoutUrls() {
  return {
    successUrl:
      env.stripeCheckoutSuccessUrl ??
      `${env.appUrl}/app?checkout=success&session_id={CHECKOUT_SESSION_ID}`,
    cancelUrl:
      env.stripeCheckoutCancelUrl ?? `${env.appUrl}/app?checkout=cancelled`,
  };
}

function getPriceIdForPlan(plan) {
  if (plan === PLAN_KEYS.PRO) return env.stripePriceIdPro;
  if (plan === PLAN_KEYS.TEAM) return env.stripePriceIdTeam;
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

async function stripeRequest(path, { method = "POST", params = null } = {}) {
  const url = `${STRIPE_API_BASE}${path}`;
  const headers = {
    Authorization: `Bearer ${env.stripeSecretKey}`,
  };

  const options = { method, headers };

  if (params && method !== "GET") {
    headers["Content-Type"] = "application/x-www-form-urlencoded";
    options.body = params.toString();
  }

  const response = await fetch(url, options);
  const raw = await response.text();
  let data = null;

  try {
    data = JSON.parse(raw);
  } catch {
    data = null;
  }

  if (!response.ok) {
    const message =
      data?.error?.message ||
      `Stripe request failed with status ${response.status}.`;
    const err = new Error(message);
    err.statusCode = response.status;
    err.stripe = data;
    throw err;
  }

  return data;
}

async function ensureStripeCustomer(user) {
  if (user.stripeCustomerId) {
    return user.stripeCustomerId;
  }

  const params = new URLSearchParams();
  params.set("email", user.email);
  params.set("name", user.name);
  params.set("metadata[userId]", user._id.toString());

  const customer = await stripeRequest("/customers", { params });
  user.stripeCustomerId = customer.id;
  await user.save();
  return customer.id;
}

async function ensureTeamStripeCustomer(team, ownerUser) {
  if (team.stripeCustomerId) {
    return team.stripeCustomerId;
  }

  const params = new URLSearchParams();
  params.set("email", ownerUser.email);
  params.set("name", team.name);
  params.set("metadata[teamId]", team._id.toString());
  params.set("metadata[ownerUserId]", ownerUser._id.toString());

  const customer = await stripeRequest("/customers", { params });
  team.stripeCustomerId = customer.id;
  await team.save();
  return customer.id;
}

async function fetchStripeSubscription(subscriptionId) {
  if (!subscriptionId || !env.stripeSecretKey) return null;
  return stripeRequest(`/subscriptions/${subscriptionId}`, { method: "GET" });
}

function parseStripeSignatureHeader(headerValue) {
  const parts = String(headerValue ?? "")
    .split(",")
    .map((part) => part.trim())
    .filter(Boolean);

  const parsed = { timestamp: null, signatures: [] };

  for (const part of parts) {
    const [key, value] = part.split("=");
    if (!key || !value) continue;
    if (key === "t") parsed.timestamp = value;
    if (key === "v1") parsed.signatures.push(value);
  }

  return parsed;
}

function timingSafeHexEqual(a, b) {
  try {
    const left = Buffer.from(a, "hex");
    const right = Buffer.from(b, "hex");
    if (left.length === 0 || left.length !== right.length) return false;
    return crypto.timingSafeEqual(left, right);
  } catch {
    return false;
  }
}

function isValidStripeWebhookSignature(rawBody, signatureHeader, secret) {
  const { timestamp, signatures } = parseStripeSignatureHeader(signatureHeader);
  if (!timestamp || signatures.length === 0) return false;

  const timestampSeconds = Number(timestamp);
  if (!Number.isFinite(timestampSeconds)) return false;

  const ageSeconds = Math.abs(Math.floor(Date.now() / 1000) - timestampSeconds);
  if (ageSeconds > STRIPE_WEBHOOK_TOLERANCE_SECONDS) return false;

  const signedPayload = `${timestamp}.${rawBody.toString("utf8")}`;
  const expected = crypto
    .createHmac("sha256", secret)
    .update(signedPayload, "utf8")
    .digest("hex");

  return signatures.some((signature) => timingSafeHexEqual(signature, expected));
}

function normalizeStripeSubscriptionStatus(status) {
  switch (status) {
    case "incomplete":
      return SUBSCRIPTION_STATUS.INCOMPLETE;
    case "incomplete_expired":
      return SUBSCRIPTION_STATUS.INCOMPLETE_EXPIRED;
    case "trialing":
      return SUBSCRIPTION_STATUS.TRIALING;
    case "active":
      return SUBSCRIPTION_STATUS.ACTIVE;
    case "past_due":
      return SUBSCRIPTION_STATUS.PAST_DUE;
    case "canceled":
      return SUBSCRIPTION_STATUS.CANCELED;
    case "unpaid":
      return SUBSCRIPTION_STATUS.UNPAID;
    case "paused":
      return SUBSCRIPTION_STATUS.PAST_DUE;
    default:
      return SUBSCRIPTION_STATUS.NOT_STARTED;
  }
}

function resolvePlanFromStripeObject(object) {
  const metadataPlan = object?.metadata?.plan;
  if (metadataPlan === PLAN_KEYS.PRO || metadataPlan === PLAN_KEYS.TEAM) {
    return metadataPlan;
  }

  const priceId =
    object?.items?.data?.[0]?.price?.id ??
    object?.plan?.id ??
    object?.price?.id ??
    null;

  if (priceId && priceId === env.stripePriceIdPro) return PLAN_KEYS.PRO;
  if (priceId && priceId === env.stripePriceIdTeam) return PLAN_KEYS.TEAM;
  return null;
}

function extractSeatQuantity(subscription) {
  const quantity = (subscription?.items?.data ?? []).reduce(
    (sum, item) => sum + Number(item.quantity ?? 0),
    0,
  );
  return quantity > 0 ? quantity : null;
}

async function findUserForStripeObject(object) {
  const userId = object?.metadata?.userId ?? object?.client_reference_id ?? null;
  if (userId) {
    const user = await User.findById(userId);
    if (user) return user;
  }

  const customerId = object?.customer ?? null;
  if (customerId) {
    const user = await User.findOne({ stripeCustomerId: customerId });
    if (user) return user;
  }

  const subscriptionId =
    (typeof object?.subscription === "string"
      ? object.subscription
      : object?.subscription?.id) ??
    (object?.object === "subscription" ? object?.id : null);

  if (subscriptionId) {
    const user = await User.findOne({ stripeSubscriptionId: subscriptionId });
    if (user) return user;
  }

  return null;
}

async function findTeamForStripeObject(object) {
  const teamId = object?.metadata?.teamId ?? null;
  if (teamId) {
    const team = await Team.findById(teamId);
    if (team) return team;
  }

  const customerId = object?.customer ?? null;
  if (customerId) {
    const team = await Team.findOne({ stripeCustomerId: customerId });
    if (team) return team;
  }

  const subscriptionId =
    (typeof object?.subscription === "string"
      ? object.subscription
      : object?.subscription?.id) ??
    (object?.object === "subscription" ? object?.id : null);

  if (subscriptionId) {
    const team = await Team.findOne({ stripeSubscriptionId: subscriptionId });
    if (team) return team;
  }

  return null;
}

async function syncUserFromSubscription(user, subscription) {
  const normalizedStatus = normalizeStripeSubscriptionStatus(subscription?.status);
  const resolvedPlan = resolvePlanFromStripeObject(subscription) ?? user.plan;
  const customerId = subscription?.customer ?? user.stripeCustomerId ?? null;
  const subscriptionId = subscription?.id ?? user.stripeSubscriptionId ?? null;
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;

  user.stripeCustomerId = customerId;
  user.stripeSubscriptionId = subscriptionId;
  user.subscriptionStatus = normalizedStatus;
  user.subscriptionCurrentPeriodEnd = currentPeriodEnd;

  if (resolvedPlan === PLAN_KEYS.TEAM) {
    user.plan = PLAN_KEYS.FREE;
    await user.save();
    return;
  }

  user.plan =
    resolvedPlan === PLAN_KEYS.PRO && ENTITLED_STATUSES.has(normalizedStatus)
      ? PLAN_KEYS.PRO
      : PLAN_KEYS.FREE;

  await user.save();
}

async function syncTeamFromSubscription(team, subscription) {
  const normalizedStatus = normalizeStripeSubscriptionStatus(subscription?.status);
  const customerId = subscription?.customer ?? team.stripeCustomerId ?? null;
  const subscriptionId = subscription?.id ?? team.stripeSubscriptionId ?? null;
  const currentPeriodEnd = subscription?.current_period_end
    ? new Date(subscription.current_period_end * 1000)
    : null;
  const seatQuantity = extractSeatQuantity(subscription);

  team.stripeCustomerId = customerId;
  team.stripeSubscriptionId = subscriptionId;
  team.subscriptionStatus = normalizedStatus;
  team.subscriptionCurrentPeriodEnd = currentPeriodEnd;
  if (seatQuantity) {
    team.seatsPurchased = seatQuantity;
  }

  await team.save();
}

async function handleCheckoutSessionCompleted(session) {
  const plan = resolvePlanFromStripeObject(session);

  if (plan === PLAN_KEYS.TEAM) {
    const team = await findTeamForStripeObject(session);
    if (!team) {
      console.warn(
        "[payments] checkout.session.completed received for unknown team.",
      );
      return;
    }

    if (session?.customer) team.stripeCustomerId = session.customer;
    if (session?.subscription) {
      team.stripeSubscriptionId =
        typeof session.subscription === "string"
          ? session.subscription
          : session.subscription.id;
    }
    await team.save();

    if (team.stripeSubscriptionId && env.stripeSecretKey) {
      try {
        const subscription = await fetchStripeSubscription(team.stripeSubscriptionId);
        if (subscription) {
          await syncTeamFromSubscription(team, subscription);
        }
      } catch (err) {
        console.error(
          "[payments] Failed to fetch team subscription after checkout completion:",
          err.message,
        );
      }
    }
    return;
  }

  const user = await findUserForStripeObject(session);
  if (!user) {
    console.warn(
      "[payments] checkout.session.completed received for unknown user.",
    );
    return;
  }

  if (session?.customer) user.stripeCustomerId = session.customer;
  if (session?.subscription) {
    user.stripeSubscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription.id;
  }
  await user.save();

  if (user.stripeSubscriptionId && env.stripeSecretKey) {
    try {
      const subscription = await fetchStripeSubscription(user.stripeSubscriptionId);
      if (subscription) {
        await syncUserFromSubscription(user, subscription);
      }
    } catch (err) {
      console.error(
        "[payments] Failed to fetch subscription after checkout completion:",
        err.message,
      );
    }
  }
}

async function handleSubscriptionWebhook(subscription) {
  const plan = resolvePlanFromStripeObject(subscription);

  if (plan === PLAN_KEYS.TEAM) {
    const team = await findTeamForStripeObject(subscription);
    if (!team) {
      console.warn("[payments] team subscription webhook received for unknown team.");
      return;
    }

    await syncTeamFromSubscription(team, subscription);
    return;
  }

  const user = await findUserForStripeObject(subscription);
  if (!user) {
    console.warn("[payments] subscription webhook received for unknown user.");
    return;
  }

  await syncUserFromSubscription(user, subscription);
}

router.post(
  "/webhook",
  express.raw({ type: "application/json" }),
  async (req, res) => {
    try {
      if (!env.stripeWebhookSecret) {
        return res.status(503).json({
          error:
            "Stripe webhook is not configured. Add STRIPE_WEBHOOK_SECRET on the backend.",
        });
      }

      const signature = req.headers["stripe-signature"];
      if (
        !isValidStripeWebhookSignature(
          req.body,
          signature,
          env.stripeWebhookSecret,
        )
      ) {
        return res.status(400).json({ error: "Invalid Stripe webhook signature." });
      }

      let event;
      try {
        event = JSON.parse(req.body.toString("utf8"));
      } catch {
        return res.status(400).json({ error: "Invalid Stripe webhook payload." });
      }

      const object = event?.data?.object ?? null;

      switch (event?.type) {
        case "checkout.session.completed":
          await handleCheckoutSessionCompleted(object);
          break;
        case "customer.subscription.created":
        case "customer.subscription.updated":
        case "customer.subscription.deleted":
          await handleSubscriptionWebhook(object);
          break;
        default:
          break;
      }

      return res.json({ received: true });
    } catch (err) {
      console.error("[payments] webhook failed:", err.message);
      return res.status(500).json({
        error: "Failed to process Stripe webhook.",
      });
    }
  },
);

router.post("/create-checkout", requireAuth, async (req, res) => {
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

    if (!env.stripeSecretKey) {
      return res.status(503).json({
        error:
          "Stripe checkout is not configured. Add STRIPE_SECRET_KEY on the backend.",
      });
    }

    const priceId = getPriceIdForPlan(plan);
    if (!priceId) {
      return res.status(503).json({
        error: `Stripe price is not configured for the ${planConfig.label} plan.`,
      });
    }

    const user = await User.findById(req.userId);
    if (!user) {
      return res.status(404).json({ error: "User not found." });
    }

    const { successUrl, cancelUrl } = buildCheckoutUrls();
    const params = new URLSearchParams();
    params.set("mode", "subscription");
    params.set("success_url", successUrl);
    params.set("cancel_url", cancelUrl);
    params.set("line_items[0][price]", priceId);
    params.set("allow_promotion_codes", "true");

    if (plan === PLAN_KEYS.TEAM) {
      if (!user.activeTeam || user.teamRole !== "owner") {
        return res.status(403).json({
          error:
            "Only the owner of an active team can start Team checkout.",
        });
      }

      const team = await Team.findById(user.activeTeam);
      if (!team) {
        return res.status(404).json({ error: "Active team not found." });
      }

      const customerId = await ensureTeamStripeCustomer(team, user);
      const seatQuantity = getMinimumTeamSeatQuantity(team);

      params.set("customer", customerId);
      params.set("line_items[0][quantity]", String(seatQuantity));
      params.set("client_reference_id", team._id.toString());
      params.set("metadata[teamId]", team._id.toString());
      params.set("metadata[userId]", user._id.toString());
      params.set("metadata[plan]", plan);
      params.set("subscription_data[metadata][teamId]", team._id.toString());
      params.set("subscription_data[metadata][ownerUserId]", user._id.toString());
      params.set("subscription_data[metadata][plan]", plan);

      const session = await stripeRequest("/checkout/sessions", { params });

      return res.status(201).json({
        checkoutUrl: session.url,
        sessionId: session.id,
        plan,
        seats: seatQuantity,
      });
    }

    const customerId = await ensureStripeCustomer(user);
    params.set("customer", customerId);
    params.set("line_items[0][quantity]", "1");
    params.set("client_reference_id", user._id.toString());
    params.set("metadata[userId]", user._id.toString());
    params.set("metadata[plan]", plan);
    params.set("subscription_data[metadata][userId]", user._id.toString());
    params.set("subscription_data[metadata][plan]", plan);

    const session = await stripeRequest("/checkout/sessions", { params });

    return res.status(201).json({
      checkoutUrl: session.url,
      sessionId: session.id,
      plan,
    });
  } catch (err) {
    console.error("[payments] create-checkout failed:", err.message);
    return res.status(err.statusCode || 502).json({
      error:
        err.message ||
        "Failed to create Stripe checkout session. Please try again.",
    });
  }
});

router.post("/create-portal-session", requireAuth, async (req, res) => {
  try {
    if (!env.stripeSecretKey) {
      return res.status(503).json({
        error:
          "Stripe billing portal is not configured. Add STRIPE_SECRET_KEY on the backend.",
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
          error:
            "Only the owner of an active team can manage Team billing.",
        });
      }

      const team = await Team.findById(user.activeTeam);
      if (!team) {
        return res.status(404).json({ error: "Active team not found." });
      }
      if (!team.stripeCustomerId) {
        return res.status(409).json({
          error:
            "No Stripe billing account was found yet for this team. Start Team checkout first if you need billing management.",
        });
      }

      const params = new URLSearchParams();
      params.set("customer", team.stripeCustomerId);
      params.set("return_url", `${env.appUrl}/app/profile?portal=returned`);

      const session = await stripeRequest("/billing_portal/sessions", { params });

      return res.status(201).json({
        portalUrl: session.url,
      });
    }

    if (!user.stripeCustomerId) {
      return res.status(409).json({
        error:
          "No Stripe billing account was found yet for this user. Start a Pro checkout first if you need billing management.",
      });
    }

    const params = new URLSearchParams();
    params.set("customer", user.stripeCustomerId);
    params.set("return_url", `${env.appUrl}/app/profile?portal=returned`);

    const session = await stripeRequest("/billing_portal/sessions", { params });

    return res.status(201).json({
      portalUrl: session.url,
    });
  } catch (err) {
    console.error("[payments] create-portal-session failed:", err.message);
    return res.status(err.statusCode || 502).json({
      error:
        err.message ||
        "Failed to create Stripe customer portal session. Please try again.",
    });
  }
});

export default router;
