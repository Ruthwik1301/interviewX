import { motion } from "framer-motion";
import { UserPlus, LayoutGrid, Mic2, BarChart2 } from "lucide-react";

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
  show: { transition: { staggerChildren: 0.12, delayChildren: 0.05 } },
};

const STEPS = [
  {
    number: "01",
    icon: UserPlus,
    title: "Create your account",
    description:
      "Sign up in seconds with email or Google. No credit card required. Set your target role and experience level to personalise every session.",
  },
  {
    number: "02",
    icon: LayoutGrid,
    title: "Pick your track",
    description:
      "Choose from 16 interview tracks — SWE, Full Stack, MERN, DevOps, SOC Analyst, Penetration Testing, System Design, HR, and more. DSA sessions open a live VS Code-style coding room.",
  },
  {
    number: "03",
    icon: Mic2,
    title: "Interview with the AI",
    description:
      "Introduce yourself, then answer questions by typing or speaking. The AI transcribes your voice, follows up naturally, and gives pronunciation tips — just like a real interviewer.",
  },
  {
    number: "04",
    icon: BarChart2,
    title: "Review your report",
    description:
      "After every session, get a full report — overall grade, per-question scores, strengths, areas to improve, and voice coaching tips. Track your progress over time on the dashboard.",
  },
];

function Step({ number, icon: Icon, title, description, isLast }) {
  return (
    <motion.div variants={fadeUp} className="relative flex gap-5">
      <div className="flex flex-col items-center">
        <div
          className="relative flex h-11 w-11 shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold"
          style={{
            borderColor: "var(--color-accent-border)",
            background: "var(--color-accent-bg)",
            color: "var(--color-accent)",
          }}
        >
          <div
            className="absolute inset-0 rounded-full opacity-40 blur-md"
            style={{ background: "var(--color-accent)" }}
          />
          <span className="relative z-10">{number}</span>
        </div>
        {!isLast && (
          <div
            className="mt-2 w-px flex-1"
            style={{
              background:
                "linear-gradient(to bottom, var(--color-accent-border), transparent)",
              minHeight: "40px",
            }}
          />
        )}
      </div>

      <div className="pb-10">
        <div className="mb-3 flex items-center gap-3">
          <div
            className="flex h-8 w-8 items-center justify-center rounded-lg border"
            style={{
              background: "var(--color-surface-2)",
              borderColor: "var(--color-border)",
            }}
          >
            <Icon
              size={15}
              strokeWidth={1.8}
              style={{ color: "var(--color-accent)" }}
            />
          </div>
          <h3
            className="text-[15px] font-semibold"
            style={{ color: "var(--color-text-invert)" }}
          >
            {title}
          </h3>
        </div>
        <p
          className="max-w-[400px] text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {description}
        </p>
      </div>
    </motion.div>
  );
}

function SessionPreview() {
  return (
    <div
      className="w-full max-w-[420px] overflow-hidden rounded-2xl border"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border-strong)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
      }}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between border-b px-5 py-4"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-2)",
        }}
      >
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 items-center justify-center rounded-md text-[10px] font-bold text-white"
            style={{ background: "var(--color-accent)" }}
          >
            IX
          </div>
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-invert)" }}
          >
            Full Stack Developer Round
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            background: "var(--color-success-bg)",
            color: "var(--color-success)",
            border: "1px solid var(--color-success-border)",
          }}
        >
          <span className="relative flex h-1.5 w-1.5">
            <span
              className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
              style={{ background: "var(--color-success)" }}
            />
            <span
              className="relative inline-flex h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--color-success)" }}
            />
          </span>
          Live
        </span>
      </div>

      {/* Progress bar */}
      <div
        className="border-b px-5 py-4"
        style={{ borderColor: "var(--color-border)" }}
      >
        <div className="mb-2 flex items-center justify-between">
          <span
            className="text-xs font-medium"
            style={{ color: "var(--color-text-muted)" }}
          >
            Session Progress
          </span>
          <span
            className="text-xs font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            Q2 of 6
          </span>
        </div>
        <div className="flex gap-1.5">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div
              key={n}
              className="h-1.5 flex-1 rounded-full"
              style={{
                background:
                  n <= 2 ? "var(--color-accent)" : "var(--color-surface-3)",
              }}
            />
          ))}
        </div>
      </div>

      {/* Conversation */}
      <div className="space-y-3 p-5">
        <div
          className="rounded-xl p-4 text-sm leading-relaxed"
          style={{
            background: "var(--color-surface-3)",
            color: "var(--color-text)",
          }}
        >
          <span
            className="mb-2 block text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-accent)" }}
          >
            AI Interviewer
          </span>
          Walk me through how a request flows from the browser all the way
          through your full stack application.
        </div>

        {/* Voice indicator */}
        <div className="flex items-center gap-2">
          <div
            className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[10px] font-bold"
            style={{
              background: "var(--color-surface-3)",
              color: "var(--color-text-muted)",
            }}
          >
            You
          </div>
          <div
            className="flex items-center gap-1 rounded-xl px-4 py-2.5"
            style={{
              background: "var(--color-accent-bg)",
              border: "1px solid var(--color-accent-border)",
            }}
          >
            {[0, 0.15, 0.3].map((delay, i) => (
              <motion.span
                key={i}
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: "var(--color-accent)" }}
                animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
                transition={{ duration: 0.9, repeat: Infinity, delay }}
              />
            ))}
          </div>
          <span
            className="text-xs"
            style={{ color: "var(--color-text-muted)" }}
          >
            🎙️ Speaking…
          </span>
        </div>

        {/* Live scores */}
        <div
          className="grid grid-cols-3 gap-2 rounded-xl border p-3"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
          }}
        >
          {[
            { label: "Clarity", value: "88%" },
            { label: "Depth", value: "74%" },
            { label: "Confidence", value: "91%" },
          ].map(({ label, value }) => (
            <div key={label} className="flex flex-col items-center gap-0.5">
              <span
                className="text-sm font-bold"
                style={{ color: "var(--color-accent)" }}
              >
                {value}
              </span>
              <span
                className="text-[10px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {label}
              </span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

export default function HowItWorks() {
  return (
    <section
      id="how-it-works"
      className="relative w-full"
      style={{ background: "var(--color-surface-2)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-24">
          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mb-12"
            >
              <span
                className="inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
                style={{
                  background: "var(--color-accent-bg)",
                  borderColor: "var(--color-accent-border)",
                  color: "var(--color-accent)",
                }}
              >
                How It Works
              </span>

              <h2
                className="mt-4 max-w-[420px] text-balance"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: "var(--color-text-invert)",
                  margin: "1rem 0 0",
                }}
              >
                From sign-up to offer letter in 4 steps
              </h2>

              <p
                className="mt-4 max-w-[400px] text-base leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                InterviewX gets you interview-ready as fast as possible — with
                real AI feedback, voice coaching, and a live coding environment
                every step of the way.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
            >
              {STEPS.map((step, i) => (
                <Step
                  key={step.number}
                  {...step}
                  isLast={i === STEPS.length - 1}
                />
              ))}
            </motion.div>
          </div>

          <motion.div
            initial={{ opacity: 0, x: 24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
            className="flex items-center justify-center lg:justify-end"
          >
            <SessionPreview />
          </motion.div>
        </div>
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
