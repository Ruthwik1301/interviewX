import { motion } from "framer-motion";
import { Brain, ShieldCheck, Code2, Users, BarChart3, Mic } from "lucide-react";

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
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.1 } },
};

const FEATURES = [
  {
    icon: Brain,
    title: "Adaptive AI Interviewer",
    description:
      "Our AI adjusts question difficulty in real time based on your answers — just like a real senior interviewer would.",
    accent: "var(--color-accent)",
    accentBg: "var(--color-accent-bg)",
    accentBorder: "var(--color-accent-border)",
  },
  {
    icon: Mic,
    title: "Live Transcript & Feedback",
    description:
      "Every word you say is transcribed instantly. Get line-by-line coaching on clarity, depth, and confidence.",
    accent: "#8b5cf6",
    accentBg: "rgba(139,92,246,0.12)",
    accentBorder: "rgba(139,92,246,0.3)",
  },
  {
    icon: BarChart3,
    title: "Detailed Scorecards",
    description:
      "After each session, receive a full breakdown — technical accuracy, communication, problem-solving — with actionable tips.",
    accent: "#6366f1",
    accentBg: "rgba(99,102,241,0.12)",
    accentBorder: "rgba(99,102,241,0.3)",
  },
  {
    icon: Code2,
    title: "Coding Interview Mode",
    description:
      "Solve DSA problems in a live code editor while the AI evaluates your approach, efficiency, and explanation in real time.",
    accent: "#a855f7",
    accentBg: "rgba(168,85,247,0.12)",
    accentBorder: "rgba(168,85,247,0.3)",
  },
  {
    icon: ShieldCheck,
    title: "Cybersecurity Tracks",
    description:
      "Specialized tracks for SOC analyst, penetration testing, and security engineering roles — with scenario-based questions.",
    accent: "#7c3aed",
    accentBg: "rgba(124,58,237,0.12)",
    accentBorder: "rgba(124,58,237,0.3)",
  },
  {
    icon: Users,
    title: "HR & Behavioural Rounds",
    description:
      "Practice STAR-format answers for leadership, conflict, and culture-fit questions. The AI identifies vague answers instantly.",
    accent: "#9333ea",
    accentBg: "rgba(147,51,234,0.12)",
    accentBorder: "rgba(147,51,234,0.3)",
  },
];

function FeatureCard({
  icon: Icon,
  title,
  description,
  accent,
  accentBg,
  accentBorder,
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col gap-4 rounded-2xl border p-6 transition-colors"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border)",
      }}
    >
      {/* Hover glow */}
      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background: `radial-gradient(ellipse 60% 40% at 50% 0%, ${accentBg} 0%, transparent 70%)`,
        }}
      />

      {/* Icon */}
      <div
        className="relative z-10 flex h-10 w-10 items-center justify-center rounded-xl border"
        style={{ background: accentBg, borderColor: accentBorder }}
      >
        <Icon size={18} strokeWidth={1.8} style={{ color: accent }} />
      </div>

      {/* Text */}
      <div className="relative z-10 space-y-2">
        <h3
          className="text-[15px] font-semibold leading-snug"
          style={{ color: "var(--color-text-invert)" }}
        >
          {title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {description}
        </p>
      </div>

      {/* Bottom accent line on hover */}
      <div
        className="absolute bottom-0 left-6 right-6 h-[1px] scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100"
        style={{
          background: `linear-gradient(90deg, transparent, ${accent}, transparent)`,
        }}
      />
    </motion.div>
  );
}

export default function Features() {
  return (
    <section
      id="features"
      className="relative w-full"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Top divider */}
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-border-strong) 30%, var(--color-accent-border) 50%, var(--color-border-strong) 70%, transparent 100%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
        {/* Section header */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 flex flex-col items-center text-center"
        >
          <span
            className="mb-4 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{
              background: "var(--color-accent-bg)",
              borderColor: "var(--color-accent-border)",
              color: "var(--color-accent)",
            }}
          >
            Platform Features
          </span>

          <h2
            className="mx-auto max-w-[600px] text-balance"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--color-text-invert)",
              margin: 0,
            }}
          >
            Everything you need to land the role
          </h2>

          <p
            className="mx-auto mt-4 max-w-[500px] text-balance text-base leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            From your first mock session to your final round — InterviewX has
            every type of interview covered with real-time AI guidance.
          </p>
        </motion.div>

        {/* Feature grid */}
        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {FEATURES.map((feature) => (
            <FeatureCard key={feature.title} {...feature} />
          ))}
        </motion.div>

        {/* Bottom callout */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col items-center gap-3 text-center sm:flex-row sm:justify-center"
        >
          <span
            className="text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            All features included in every plan.
          </span>
          <span
            className="hidden h-1 w-1 rounded-full sm:block"
            style={{ background: "var(--color-border-strong)" }}
          />
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            No feature gating. No upsells.
          </span>
        </motion.div>
      </div>

      {/* Bottom divider */}
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
