export const PLAN_KEYS = {
  FREE: "free",
  PRO: "pro",
  TEAM: "team",
};

export const SUBSCRIPTION_STATUS = {
  NOT_STARTED: "not_started",
  INCOMPLETE: "incomplete",
  INCOMPLETE_EXPIRED: "incomplete_expired",
  TRIALING: "trialing",
  ACTIVE: "active",
  PAST_DUE: "past_due",
  CANCELED: "canceled",
  UNPAID: "unpaid",
};

// A single consistent timezone boundary for per-day session limits.
// UTC keeps enforcement deterministic across backend instances and regions.
export const DAILY_LIMIT_TIMEZONE = "UTC";

export const PLAN_CONFIG = {
  [PLAN_KEYS.FREE]: {
    key: PLAN_KEYS.FREE,
    label: "Free",
    selfServeCheckout: false,
    dailySessionLimit: 5,
    billingRequired: false,
  },
  [PLAN_KEYS.PRO]: {
    key: PLAN_KEYS.PRO,
    label: "Pro",
    selfServeCheckout: true,
    dailySessionLimit: 10,
    billingRequired: true,
  },
  [PLAN_KEYS.TEAM]: {
    key: PLAN_KEYS.TEAM,
    label: "Team",
    selfServeCheckout: true,
    dailySessionLimitPerMember: 8,
    billingRequired: true,
    note: "Team billing uses real team membership, seat counts, and team-level subscription status.",
  },
};

export const USER_PLAN_VALUES = Object.values(PLAN_KEYS);
export const STRIPE_SUBSCRIPTION_STATUS_VALUES =
  Object.values(SUBSCRIPTION_STATUS);

export function getPlanConfig(plan = PLAN_KEYS.FREE) {
  return PLAN_CONFIG[plan] ?? PLAN_CONFIG[PLAN_KEYS.FREE];
}

export function isPaidPlan(plan = PLAN_KEYS.FREE) {
  return plan === PLAN_KEYS.PRO || plan === PLAN_KEYS.TEAM;
}

export function canStartSelfServeCheckout(plan) {
  const config = getPlanConfig(plan);
  return Boolean(config.selfServeCheckout && !config.requiresTeamModel);
}

export function getDailySessionLimit(plan = PLAN_KEYS.FREE) {
  const config = getPlanConfig(plan);
  return config.dailySessionLimit ?? null;
}
