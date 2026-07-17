import { motion } from "framer-motion";
import { NavLink } from "react-router-dom";
import { ArrowRight, Sparkles } from "lucide-react";
import { RoutePaths } from "@/app/routes/paths";

const container = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
};

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const fadeIn = {
  hidden: { opacity: 0, x: 24 },
  show: {
    opacity: 1,
    x: 0,
    transition: { duration: 0.65, ease: [0.16, 1, 0.3, 1] },
  },
};

function Stat({ value, label }) {
  return (
    <div className="flex flex-col items-center gap-0.5">
      <span
        className="text-2xl font-bold tracking-tight"
        style={{ color: "var(--color-text-invert)" }}
      >
        {value}
      </span>
      <span
        className="text-xs font-medium uppercase tracking-widest"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </span>
    </div>
  );
}

function InterviewPreviewCard() {
  return (
    <motion.div
      variants={fadeIn}
      initial="hidden"
      animate="show"
      className="w-full overflow-hidden rounded-2xl border"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border-strong)",
        boxShadow:
          "0 32px 80px rgba(0,0,0,0.28), 0 0 0 1px rgba(167,139,250,0.08)",
      }}
    >
      <div
        className="flex items-center gap-2 border-b px-4 py-3"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-2)",
        }}
      >
        <span className="h-2.5 w-2.5 rounded-full bg-red-500/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-yellow-400/70" />
        <span className="h-2.5 w-2.5 rounded-full bg-green-500/70" />
        <span
          className="ml-3 flex-1 rounded px-3 py-1 text-center text-[11px] font-mono"
          style={{
            background: "var(--color-surface-3)",
            color: "var(--color-text-muted)",
          }}
        >
          interviewx.ai / session / live
        </span>
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
          LIVE
        </span>
      </div>

      <div className="space-y-4 p-5">
        <div className="flex items-start gap-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
            style={{ background: "var(--color-accent)" }}
          >
            AI
          </div>
          <div
            className="rounded-xl rounded-tl-sm px-4 py-3 text-sm leading-relaxed"
            style={{
              background: "var(--color-surface-3)",
              color: "var(--color-text)",
            }}
          >
            Explain how you would design a rate limiter for a distributed API
            that handles 10M requests per day.
          </div>
        </div>

        <div className="flex items-start justify-end gap-3">
          <div
            className="max-w-[80%] rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed"
            style={{
              background: "var(--color-accent-bg)",
              color: "var(--color-text)",
              border: "1px solid var(--color-accent-border)",
            }}
          >
            I'd use a token bucket algorithm with Redis as the backend store,
            with a sliding window approach to handle bursts gracefully…
          </div>
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold"
            style={{
              background: "var(--color-surface-3)",
              color: "var(--color-text-muted)",
            }}
          >
            You
          </div>
        </div>

        <div
          className="space-y-3 rounded-xl border p-4"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center justify-between">
            <span
              className="text-xs font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Live Score
            </span>
            <span
              className="text-sm font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              87 / 100
            </span>
          </div>
          {[
            { label: "Technical Accuracy", pct: 91 },
            { label: "Communication", pct: 84 },
            { label: "Problem Solving", pct: 88 },
          ].map(({ label, pct }) => (
            <div key={label} className="space-y-1">
              <div
                className="flex justify-between text-[11px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                <span>{label}</span>
                <span>{pct}%</span>
              </div>
              <div
                className="h-1 w-full overflow-hidden rounded-full"
                style={{ background: "var(--color-surface-3)" }}
              >
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: "var(--color-accent)" }}
                  initial={{ width: 0 }}
                  animate={{ width: `${pct}%` }}
                  transition={{
                    duration: 1.1,
                    ease: [0.16, 1, 0.3, 1],
                    delay: 0.6,
                  }}
                />
              </div>
            </div>
          ))}
        </div>
      </div>
    </motion.div>
  );
}

export default function Hero() {
  return (
    <section
      className="relative w-full overflow-hidden"
      style={{ background: "var(--color-bg)" }}
      aria-label="Hero"
    >
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 100% 60% at 50% -10%, rgba(124,58,237,0.15) 0%, transparent 70%)",
        }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 z-0 opacity-[0.025]"
        style={{
          backgroundImage:
            "radial-gradient(circle, var(--color-text) 1px, transparent 1px)",
          backgroundSize: "28px 28px",
        }}
      />

      <div className="relative z-10 mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        {/* Two-column layout: text left, card right */}
        <div className="grid grid-cols-1 items-center gap-12 py-16 lg:grid-cols-2 lg:gap-16 lg:py-24">
          {/* Left: text */}
          <motion.div
            variants={container}
            initial="hidden"
            animate="show"
            className="flex flex-col items-start text-left"
          >
            <motion.div variants={fadeUp}>
              <span
                className="mb-6 inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 text-xs font-semibold uppercase tracking-widest"
                style={{
                  background: "var(--color-accent-bg)",
                  borderColor: "var(--color-accent-border)",
                  color: "var(--color-accent)",
                }}
              >
                <Sparkles size={11} strokeWidth={2.5} />
                AI-Powered Interview Intelligence
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp}
              className="text-balance"
              style={{
                fontSize: "clamp(2.4rem, 5vw, 4rem)",
                lineHeight: 1.05,
                letterSpacing: "-0.025em",
                color: "var(--color-text-invert)",
                fontWeight: 700,
                margin: 0,
              }}
            >
              Ace Every Interview.{" "}
              <span
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-accent) 0%, #c084fc 100%)",
                  WebkitBackgroundClip: "text",
                  WebkitTextFillColor: "transparent",
                  backgroundClip: "text",
                }}
              >
                Every Time.
              </span>
            </motion.h1>

            <motion.p
              variants={fadeUp}
              className="mt-5 max-w-[480px] text-balance text-lg leading-relaxed"
              style={{ color: "var(--color-text-muted)" }}
            >
              Practice with a real-time AI interviewer across technical, system
              design, cybersecurity, and HR rounds. Get scored, coached, and
              ready.
            </motion.p>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-3"
            >
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <NavLink
                  to={RoutePaths.register}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all focus:outline-none"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                    boxShadow: "0 4px 24px rgba(124,58,237,0.35)",
                  }}
                >
                  Start Practicing Free
                  <ArrowRight size={15} strokeWidth={2.5} />
                </NavLink>
              </motion.div>
              <NavLink
                to="/#how-it-works"
                className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-colors focus:outline-none"
                style={{
                  borderColor: "var(--color-border-strong)",
                  color: "var(--color-text-muted)",
                  background: "var(--color-surface-1)",
                }}
              >
                See How It Works
              </NavLink>
            </motion.div>

            <motion.div
              variants={fadeUp}
              className="mt-8 flex flex-wrap items-center gap-2 text-xs"
              style={{ color: "var(--color-text-muted)" }}
            >
              <div className="mr-1 flex -space-x-2">
                {["#7c3aed", "#9333ea", "#a855f7", "#c084fc"].map((bg, i) => (
                  <div
                    key={i}
                    className="flex h-6 w-6 items-center justify-center rounded-full border-2 text-[9px] font-bold text-white"
                    style={{ background: bg, borderColor: "var(--color-bg)" }}
                  >
                    {["AJ", "MK", "SR", "TN"][i]}
                  </div>
                ))}
              </div>
              <span>
                Includes a live{" "}
                <strong style={{ color: "var(--color-text)" }}>DSA Room</strong>
              </span>
              <span style={{ color: "var(--color-border-strong)" }}>·</span>
              <span>⭐ 4.9 / 5</span>
              <span style={{ color: "var(--color-border-strong)" }}>·</span>
              <span>No credit card</span>
            </motion.div>
          </motion.div>

          {/* Right: preview card */}
          <div className="w-full">
            <InterviewPreviewCard />
          </div>
        </div>

        {/* Stats bar */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5, ease: [0.16, 1, 0.3, 1] }}
          className="mb-16 flex flex-wrap items-center justify-center gap-8 rounded-2xl border px-8 py-6 sm:gap-12 lg:mb-24"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border)",
          }}
        >
          <Stat value="DSA Room" label="Live Coding Practice" />
          <div
            className="hidden h-8 w-px sm:block"
            style={{ background: "var(--color-border)" }}
          />
          <Stat value="98%" label="Satisfaction Rate" />
          <div
            className="hidden h-8 w-px sm:block"
            style={{ background: "var(--color-border)" }}
          />
          <Stat value="5 Tracks" label="Interview Types" />
          <div
            className="hidden h-8 w-px sm:block"
            style={{ background: "var(--color-border)" }}
          />
          <Stat value="Real-time" label="AI Feedback" />
        </motion.div>
      </div>
    </section>
  );
}
