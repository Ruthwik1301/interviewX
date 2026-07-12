import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { Check, Sparkles, Zap, Building2 } from "lucide-react";
import { RoutePaths } from "@/app/routes/paths";

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
    cta: "Start Pro Free Trial",
    ctaTo: RoutePaths.register,
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
    cta: "Contact Us",
    ctaTo: "mailto:hello@interviewx.app",
    isExternal: true,
    highlighted: false,
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

function PlanCard({ plan }) {
  const Icon = plan.icon;

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
      {/* Highlight glow */}
      {plan.highlighted && (
        <div
          className="pointer-events-none absolute inset-0 rounded-2xl"
          style={{
            background:
              "radial-gradient(ellipse 80% 50% at 50% -10%, rgba(124,58,237,0.15) 0%, transparent 70%)",
          }}
        />
      )}

      {/* Badge */}
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

      {/* Header */}
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

      {/* CTA */}
      <div className="mb-6 relative z-10">
        {plan.isExternal ? (
          <a
            href={plan.ctaTo}
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={
              plan.highlighted
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
                  }
            }
          >
            {plan.cta}
          </a>
        ) : (
          <NavLink
            to={plan.ctaTo}
            className="flex w-full items-center justify-center rounded-xl py-2.5 text-sm font-semibold transition-all"
            style={
              plan.highlighted
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
                  }
            }
          >
            {plan.cta}
          </NavLink>
        )}
      </div>

      {/* Divider */}
      <div
        className="mb-5 h-px relative z-10"
        style={{ background: "var(--color-border)" }}
      />

      {/* Features */}
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

export default function Pricing() {
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
        {/* Header */}
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

        {/* Plan cards */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-5 md:grid-cols-3"
        >
          {PLANS.map((plan) => (
            <PlanCard key={plan.id} plan={plan} />
          ))}
        </motion.div>

        {/* Bottom note */}
        <motion.p
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ delay: 0.3 }}
          className="mt-10 text-center text-[13px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          All prices in INR. Pro plan includes a 7-day free trial — no card
          required to start. Cancel anytime.
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
