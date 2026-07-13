import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import {
  Check,
  Sparkles,
  Zap,
  Building2,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { RoutePaths } from "@/app/routes/paths";
import { useAuth } from "@/app/providers/useAuth.js";
import { api, ApiError, getToken } from "@/shared/lib/api.js";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const ENTITLED_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

const PLAN_META = {
  free: {
    label: "Free",
    accent: "var(--color-text-muted)",
    background: "var(--color-surface-3)",
    border: "var(--color-border)",
    cta: "Current Plan",
    dailyLimit: 2,
  },
  pro: {
    label: "Pro",
    accent: "var(--color-accent)",
    background: "var(--color-accent-bg)",
    border: "var(--color-accent-border)",
    cta: "Current Plan",
    dailyLimit: 5,
  },
  team: {
    label: "Team",
    accent: "#0ea5e9",
    background: "rgba(14,165,233,0.12)",
    border: "rgba(14,165,233,0.25)",
    cta: "Managed Separately",
    dailyLimit: 3,
  },
};

function getEffectivePlan(user) {
  if (!user) return "free";
  if (user.plan === "team") return "team";

  return user.plan === "pro" &&
    ENTITLED_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus)
    ? "pro"
    : "free";
}

function formatSubscriptionStatus(status) {
  const value = String(status ?? "not_started").replace(/_/g, " ").trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getBillingSummary(user) {
  const plan = getEffectivePlan(user);
  const meta = PLAN_META[plan] ?? PLAN_META.free;

  return {
    plan,
    planLabel: meta.label,
    accent: meta.accent,
    background: meta.background,
    border: meta.border,
    cta: meta.cta,
    dailyLimit: meta.dailyLimit,
    subscriptionStatus:
      plan === "free" && user?.plan !== "team"
        ? "Free access"
        : formatSubscriptionStatus(user?.subscriptionStatus),
  };
}

function getUtcDayRange(date = new Date()) {
  const start = new Date(
    Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate()),
  );
  const end = new Date(start);
  end.setUTCDate(end.getUTCDate() + 1);
  return { start, end };
}

function computeUsageSummary(sessions, billing) {
  if (!billing) return null;

  const { start, end } = getUtcDayRange();
  const usedToday = sessions.filter((session) => {
    const timestamp = session.startedAt ?? session.createdAt;
    if (!timestamp) return false;
    const when = new Date(timestamp);
    return when >= start && when < end;
  }).length;

  return {
    usedToday,
    remainingToday: Math.max(0, billing.dailyLimit - usedToday),
    dailyLimit: billing.dailyLimit,
  };
}

const PLANS = [
  {
    id: "free",
    icon: Zap,
    name: "Free",
    price: "₹0",
    period: "forever",
    tagline: "Start practising today, no card needed.",
    cta: "Get Started Free",
    ctaTo: RoutePaths.register,
    highlighted: false,
    features: [
      "2 interview sessions per day",
      "All 16 interview tracks",
      "DSA coding room (Monaco editor)",
      "Voice input & pronunciation tips",
      "AI-scored answers & feedback",
      "Session report & scorecard",
      "Dashboard with session history",
    ],
    missing: [],
  },
  {
    id: "pro",
    icon: Sparkles,
    name: "Pro",
    price: "₹499",
    period: "per month",
    tagline: "For serious candidates targeting top companies.",
    cta: "Start Pro",
    highlighted: true,
    badge: "Most Popular",
    features: [
      "5 interview sessions per day",
      "All 16 interview tracks",
      "DSA coding room (Monaco editor)",
      "Voice input & pronunciation tips",
      "AI-scored answers & feedback",
      "Session report & scorecard",
      "Dashboard with session history",
      "Company-specific question sets",
      "Priority AI processing",
      "Export reports as PDF",
      "Progress analytics over time",
      "Email support",
    ],
    missing: [],
  },
  {
    id: "team",
    icon: Building2,
    name: "Team",
    price: "₹299",
    period: "per seat / month",
    tagline: "For bootcamps, colleges, and hiring teams.",
    cta: "Coming Soon",
    highlighted: false,
    disabled: true,
    features: [
      "3 interview sessions per member per day",
      "Everything in Pro",
      "Minimum 5 seats",
      "Admin dashboard",
      "Bulk session analytics",
      "Custom question banks",
      "Dedicated onboarding",
      "Priority support",
    ],
    missing: [],
  },
];

function getPlanCardMessage(planId, billing, usage, usageLoading) {
  if (!billing) return null;

  if (planId === "free") {
    if (billing.plan === "free") {
      if (usageLoading) {
        return {
          tone: "neutral",
          title: "Checking today's free usage",
          message: "Loading how many free sessions you still have available today.",
        };
      }

      if ((usage?.remainingToday ?? 0) > 0) {
        return {
          tone: "neutral",
          title: `${usage.remainingToday} free session${usage.remainingToday === 1 ? "" : "s"} left today`,
          message: `You've used ${usage.usedToday}/${PLAN_META.free.dailyLimit} free sessions so far today (UTC reset).`,
        };
      }

      return {
        tone: "warning",
        title: "Today's free limit reached",
        message:
          "You've used both free sessions today. Upgrading to Pro would raise today's allowance to 5 sessions.",
      };
    }

    if (billing.plan === "pro") {
      return {
        tone: "warning",
        title: "Lower allowance than your current plan",
        message:
          "You're already on Pro. Moving back to Free would reduce your daily interview allowance from 5 to 2.",
      };
    }

    return {
      tone: "neutral",
      title: "Managed separately",
      message:
        "Your account is associated with Team billing. Free-plan limits are shown only for comparison.",
    };
  }

  if (planId === "pro") {
    if (billing.plan === "pro") {
      if (usageLoading) {
        return {
          tone: "success",
          title: "Pro plan active",
          message: "Refreshing today's remaining Pro allowance now.",
        };
      }

      return {
        tone: "success",
        title: `${usage?.remainingToday ?? PLAN_META.pro.dailyLimit} Pro session${(usage?.remainingToday ?? PLAN_META.pro.dailyLimit) === 1 ? "" : "s"} left today`,
        message: `You've used ${usage?.usedToday ?? 0}/${PLAN_META.pro.dailyLimit} Pro sessions today before the UTC reset.`,
      };
    }

    if (billing.plan === "free") {
      if (usageLoading) {
        return {
          tone: "neutral",
          title: "More room to practise",
          message:
            "Pro raises your daily allowance from 2 sessions to 5 sessions per UTC day.",
        };
      }

      const extraToday = Math.max(0, PLAN_META.pro.dailyLimit - (usage?.usedToday ?? 0));
      const reachedFreeLimit = (usage?.remainingToday ?? 0) === 0;

      return reachedFreeLimit
        ? {
            tone: "warning",
            title: `Unlock up to ${extraToday} more session${extraToday === 1 ? "" : "s"} today`,
            message:
              "You've hit today's free limit. Upgrading to Pro increases your daily cap to 5 immediately.",
          }
        : {
            tone: "success",
            title: `Upgrade for ${extraToday} total sessions remaining today`,
            message:
              "You're still on Free, but Pro would increase today's limit to 5 and give you more room to practise.",
          };
    }

    return {
      tone: "neutral",
      title: "Team billing comes later",
      message:
        "Team checkout remains disabled until team/member management is implemented.",
    };
  }

  if (billing.plan === "team") {
    return {
      tone: "neutral",
      title: "Team-managed billing",
      message:
        "Your Team subscription will be managed separately once team/member support is fully released.",
    };
  }

  return {
    tone: "neutral",
    title: "Coming later",
    message:
      "Team billing will be enabled in a later phase alongside full team/member management.",
  };
}

function PlanCard({ plan, onSelect, isLoading, billing, usage, usageLoading }) {
  const Icon = plan.icon;
  const isCurrentPlan = billing?.plan === plan.id;
  const contextMessage = getPlanCardMessage(
    plan.id,
    billing,
    usage,
    usageLoading,
  );

  const primaryButtonStyle = plan.highlighted
    ? {
        background:
          "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
        color: "#fff",
        boxShadow: "0 4px 20px rgba(124,58,237,0.35)",
      }
    : {
        background: "var(--color-surface-2)",
        border: "1px solid var(--color-border)",
        color: "var(--color-text-invert)",
      };

  const disabledButtonStyle = {
    background: "var(--color-surface-2)",
    border: "1px solid var(--color-border)",
    color: "var(--color-text-muted)",
    opacity: 0.65,
    cursor: "not-allowed",
    boxShadow: "none",
  };

  return (
    <motion.div
      variants={fadeUp}
      whileHover={{
        y: plan.highlighted ? -6 : -3,
        transition: { duration: 0.2 },
      }}
      className="relative flex flex-col rounded-2xl border p-7"
      style={{
        background: plan.highlighted
          ? "linear-gradient(135deg, var(--color-accent-bg) 0%, var(--color-surface-1) 100%)"
          : "var(--color-surface-1)",
        borderColor: plan.highlighted
          ? "var(--color-accent-border)"
          : "var(--color-border)",
        boxShadow: plan.highlighted
          ? "0 0 0 1px var(--color-accent-border), 0 24px 60px rgba(124,58,237,0.15)"
          : "none",
      }}
    >
      {plan.highlighted && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.15) 0%, transparent 70%)",
          }}
        />
      )}

      {plan.badge && (
        <span
          className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1 text-[11px] font-bold uppercase tracking-widest"
          style={{
            background: "var(--color-accent)",
            borderColor: "var(--color-accent)",
            color: "#fff",
          }}
        >
          {plan.badge}
        </span>
      )}

      <div className="mb-6 space-y-3 relative z-10">
        <div className="flex items-center gap-2.5">
          <div
            className="flex h-9 w-9 items-center justify-center rounded-xl border"
            style={{
              background: "var(--color-accent-bg)",
              borderColor: "var(--color-accent-border)",
            }}
          >
            <Icon
              size={16}
              strokeWidth={2}
              style={{ color: "var(--color-accent)" }}
            />
          </div>
          <p
            className="text-[15px] font-bold"
            style={{ color: "var(--color-text-invert)" }}
          >
            {plan.name}
          </p>
        </div>

        <div className="flex items-end gap-1.5">
          <span
            className="text-4xl font-bold tracking-tight"
            style={{ color: "var(--color-text-invert)", lineHeight: 1 }}
          >
            {plan.price}
          </span>
          <span
            className="mb-1 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            /{plan.period}
          </span>
        </div>

        <p className="text-[13px]" style={{ color: "var(--color-text-muted)" }}>
          {plan.tagline}
        </p>
      </div>

      <div className="mb-4 relative z-10">
        {isCurrentPlan ? (
          <button
            type="button"
            disabled
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold disabled:cursor-not-allowed"
            style={disabledButtonStyle}
          >
            {billing.cta}
          </button>
        ) : plan.id === "free" ? (
          <NavLink
            to={plan.ctaTo}
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={primaryButtonStyle}
          >
            {plan.cta}
          </NavLink>
        ) : (
          <button
            type="button"
            onClick={() => onSelect(plan.id)}
            disabled={isLoading || plan.disabled}
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all disabled:cursor-not-allowed"
            style={plan.disabled ? disabledButtonStyle : primaryButtonStyle}
          >
            {isLoading ? "Redirecting…" : plan.cta}
          </button>
        )}
      </div>

      {contextMessage && (
        <div
          className="mb-5 rounded-xl border px-3.5 py-3 relative z-10"
          style={{
            background:
              contextMessage.tone === "success"
                ? "var(--color-success-bg)"
                : contextMessage.tone === "warning"
                  ? "var(--color-warning-bg)"
                  : "var(--color-surface-2)",
            borderColor:
              contextMessage.tone === "success"
                ? "var(--color-success-border)"
                : contextMessage.tone === "warning"
                  ? "var(--color-warning-border)"
                  : "var(--color-border)",
          }}
        >
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{
              color:
                contextMessage.tone === "success"
                  ? "var(--color-success)"
                  : contextMessage.tone === "warning"
                    ? "var(--color-warning)"
                    : "var(--color-text-muted)",
            }}
          >
            {contextMessage.title}
          </p>
          <p
            className="mt-1 text-[12px] leading-relaxed"
            style={{ color: "var(--color-text)" }}
          >
            {contextMessage.message}
          </p>
        </div>
      )}

      <div
        className="mb-5 h-px relative z-10"
        style={{ background: "var(--color-border)" }}
      />

      <ul className="flex flex-col gap-3 relative z-10">
        {plan.features.map((f) => (
          <li key={f} className="flex items-start gap-2.5">
            <Check
              size={14}
              strokeWidth={2.5}
              className="mt-0.5 shrink-0"
              style={{ color: "var(--color-success)" }}
            />
            <span
              className="text-[13px] leading-snug"
              style={{ color: "var(--color-text)" }}
            >
              {f}
            </span>
          </li>
        ))}
        {plan.missing.map((f) => (
          <li key={f} className="flex items-start gap-2.5 opacity-35">
            <span className="mt-0.5 flex h-3.5 w-3.5 shrink-0 items-center justify-center">
              <span
                className="h-px w-3 rounded-full"
                style={{ background: "var(--color-text-muted)" }}
              />
            </span>
            <span
              className="text-[13px] leading-snug"
              style={{ color: "var(--color-text-muted)" }}
            >
              {f}
            </span>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function BillingStatusBanner({ billing, usage, usageLoading }) {
  if (!billing) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mb-6 max-w-[980px] rounded-2xl border p-5 sm:p-6"
      style={{
        background: billing.background,
        borderColor: billing.border,
      }}
    >
      <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 flex-1">
          <p
            className="text-[11px] font-bold uppercase tracking-wider"
            style={{ color: billing.accent }}
          >
            Your current plan
          </p>
          <div className="mt-2 flex flex-wrap items-center gap-2">
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "rgba(255,255,255,0.6)",
                borderColor: billing.border,
                color: billing.accent,
              }}
            >
              {billing.planLabel}
            </span>
            <span
              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
              style={{
                background: "var(--color-surface-1)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
            >
              {billing.subscriptionStatus}
            </span>
          </div>
          <p
            className="mt-3 max-w-[580px] text-sm leading-relaxed"
            style={{ color: "var(--color-text)" }}
          >
            {billing.plan === "pro"
              ? "You already have access to Pro limits. Use today's remaining sessions before the UTC reset if you want to maximise practice."
              : billing.plan === "team"
                ? "Team billing will be managed separately once team/member support is released. Current usage is shown per member allowance."
                : "You're currently on the Free plan. Your remaining sessions today are shown below so you can decide whether you need Pro right now."}
          </p>
        </div>

        <div className="grid grid-cols-3 gap-3 lg:min-w-[340px]">
          {[
            {
              label: "Daily limit",
              value: usageLoading ? "—" : usage?.dailyLimit ?? billing.dailyLimit,
            },
            {
              label: "Used today",
              value: usageLoading ? "—" : usage?.usedToday ?? 0,
            },
            {
              label: "Remaining",
              value: usageLoading ? "—" : usage?.remainingToday ?? billing.dailyLimit,
            },
          ].map((item) => (
            <div
              key={item.label}
              className="rounded-xl border px-3 py-3 text-center"
              style={{
                background: "var(--color-surface-1)",
                borderColor: billing.border,
              }}
            >
              <p
                className="text-lg font-bold"
                style={{ color: "var(--color-text-invert)" }}
              >
                {item.value}
              </p>
              <p
                className="mt-0.5 text-[10px] font-medium uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

function CheckoutBanner({ notice }) {
  if (!notice) return null;

  const Icon = notice.tone === "success" ? CheckCircle2 : AlertCircle;
  const styles =
    notice.tone === "success"
      ? {
          background: "var(--color-success-bg)",
          borderColor: "var(--color-success-border)",
          titleColor: "var(--color-success)",
        }
      : {
          background: "var(--color-warning-bg)",
          borderColor: "var(--color-warning-border)",
          titleColor: "var(--color-warning)",
        };

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="mx-auto mb-6 max-w-[900px] rounded-2xl border p-4 sm:p-5"
      style={{
        background: styles.background,
        borderColor: styles.borderColor,
      }}
    >
      <div className="flex items-start gap-3">
        <div
          className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-xl"
          style={{ background: "rgba(255,255,255,0.65)" }}
        >
          <Icon size={18} strokeWidth={2.2} style={{ color: styles.titleColor }} />
        </div>
        <div>
          <p
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-invert)" }}
          >
            {notice.title}
          </p>
          <p className="mt-1 text-[13px]" style={{ color: "var(--color-text)" }}>
            {notice.message}
          </p>
        </div>
      </div>
    </motion.div>
  );
}

export default function Pricing() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const billing = user ? getBillingSummary(user) : null;
  const [loadingPlan, setLoadingPlan] = useState("");
  const [error, setError] = useState("");
  const [checkoutNotice, setCheckoutNotice] = useState(null);
  const [sessions, setSessions] = useState([]);
  const [usageLoading, setUsageLoading] = useState(Boolean(user));

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const checkout = params.get("checkout");

    if (checkout === "success") {
      setCheckoutNotice({
        tone: "success",
        title: "Payment successful",
        message:
          "Your Stripe checkout completed successfully. If your Pro plan was purchased for a logged-in account, subscription sync may take a few seconds.",
      });
      navigate(location.pathname, { replace: true });
      return;
    }

    if (checkout === "cancelled") {
      setCheckoutNotice({
        tone: "warning",
        title: "Checkout cancelled",
        message:
          "Your Stripe checkout was cancelled, so no billing change was applied. You can start checkout again anytime.",
      });
      navigate(location.pathname, { replace: true });
    }
  }, [location.pathname, location.search, navigate]);

  useEffect(() => {
    if (!user) {
      setSessions([]);
      setUsageLoading(false);
      return;
    }

    let cancelled = false;
    setUsageLoading(true);

    api
      .get("/api/interviews")
      .then(({ sessions }) => {
        if (!cancelled) setSessions(sessions ?? []);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setUsageLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [user]);

  const usage = useMemo(
    () => computeUsageSummary(sessions, billing),
    [sessions, billing],
  );

  async function handlePlanSelect(planId) {
    if (planId === "team") {
      setError(
        "Team billing is coming soon and will be enabled after team/member support is added.",
      );
      return;
    }

    if (planId !== "pro") return;

    setError("");

    if (!getToken()) {
      navigate(RoutePaths.login);
      return;
    }

    setLoadingPlan(planId);
    try {
      const data = await api.post("/api/payments/create-checkout", {
        plan: planId,
      });

      if (!data?.checkoutUrl) {
        throw new ApiError("Stripe checkout URL was not returned.", 502);
      }

      window.location.assign(data.checkoutUrl);
    } catch (err) {
      if (err instanceof ApiError && err.status === 401) {
        navigate(RoutePaths.login);
        return;
      }

      setError(
        err instanceof ApiError
          ? err.message
          : "Could not start Stripe checkout. Please try again.",
      );
      setLoadingPlan("");
    }
  }

  return (
    <section
      id="pricing"
      className="relative w-full"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-border-strong) 30%, var(--color-accent-border) 50%, var(--color-border-strong) 70%, transparent 100%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 flex flex-col items-center text-center"
        >
          <span
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{
              background: "var(--color-accent-bg)",
              borderColor: "var(--color-accent-border)",
              color: "var(--color-accent)",
            }}
          >
            <Sparkles size={11} strokeWidth={2.5} />
            Pricing
          </span>

          <h2
            className="mx-auto max-w-[560px] text-balance"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--color-text-invert)",
              margin: 0,
            }}
          >
            Simple pricing, zero surprises
          </h2>

          <p
            className="mx-auto mt-4 max-w-[440px] text-balance text-base leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Start free and upgrade when you need more. No feature gating, no
            hidden fees. All core features are available on every plan.
          </p>
        </motion.div>

        {billing && (
          <BillingStatusBanner
            billing={billing}
            usage={usage}
            usageLoading={usageLoading}
          />
        )}
        <CheckoutBanner notice={checkoutNotice} />

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {PLANS.map((plan) => (
            <PlanCard
              key={plan.id}
              plan={plan}
              onSelect={handlePlanSelect}
              isLoading={loadingPlan === plan.id}
              billing={billing}
              usage={usage}
              usageLoading={usageLoading}
            />
          ))}
        </motion.div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="mx-auto mt-5 max-w-[720px] text-center text-[13px]"
            style={{ color: "var(--color-error)" }}
          >
            {error}
          </motion.p>
        )}

        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          All prices in INR. Free users can upgrade to Pro securely through
          Stripe. Team billing will be enabled in a later phase with team/member
          support.
        </motion.p>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%)",
        }}
      />
    </section>
  );
}
