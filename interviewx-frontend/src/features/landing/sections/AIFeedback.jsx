import { motion } from "framer-motion";
import { Sparkles, TrendingUp, MessageSquare, Zap } from "lucide-react";

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

const POINTS = [
  {
    icon: MessageSquare,
    title: "Line-by-line answer coaching",
    description:
      "The AI doesn't just score you — it pinpoints exactly which sentence was vague, too long, or missing evidence.",
  },
  {
    icon: TrendingUp,
    title: "Progress tracking across sessions",
    description:
      "See how your scores evolve over time. InterviewX identifies your weakest areas and builds a practice plan around them.",
  },
  {
    icon: Zap,
    title: "Instant, not after the fact",
    description:
      "Feedback appears during the session — not just in a report at the end. You improve in real time, not days later.",
  },
];

function FeedbackCard() {
  const feedbackItems = [
    {
      type: "good",
      label: "Strong",
      text: '"I\'d use a token bucket algorithm with Redis…"',
      note: "Concrete, specific, correct. Good use of named technology.",
    },
    {
      type: "warn",
      label: "Improve",
      text: '"…and stuff like that, you know what I mean?"',
      note: "Filler language detected. Replace with a concrete closing statement.",
    },
    {
      type: "good",
      label: "Strong",
      text: '"For 10M requests/day, I\'d shard by user ID…"',
      note: "Excellent — you quantified the scale and gave a concrete strategy.",
    },
    {
      type: "tip",
      label: "Tip",
      text: "Missing: failure mode discussion",
      note: "Interviewers at this level expect you to address what happens when Redis goes down.",
    },
  ];

  const colors = {
    good: {
      bg: "var(--color-success-bg)",
      border: "var(--color-success-border)",
      label: "var(--color-success)",
      dot: "var(--color-success)",
    },
    warn: {
      bg: "rgba(245,158,11,0.08)",
      border: "rgba(245,158,11,0.25)",
      label: "#f59e0b",
      dot: "#f59e0b",
    },
    tip: {
      bg: "var(--color-accent-bg)",
      border: "var(--color-accent-border)",
      label: "var(--color-accent)",
      dot: "var(--color-accent)",
    },
  };

  return (
    <div
      className="w-full overflow-hidden rounded-2xl border"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border-strong)",
        boxShadow: "0 24px 60px rgba(0,0,0,0.22)",
      }}
    >
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
            AI Feedback — Live Session
          </span>
        </div>
        <span
          className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
          style={{
            background: "var(--color-accent-bg)",
            color: "var(--color-accent)",
            border: "1px solid var(--color-accent-border)",
          }}
        >
          <Sparkles size={10} strokeWidth={2.5} />
          AI Coaching
        </span>
      </div>

      <div className="space-y-3 p-5">
        {feedbackItems.map(({ type, label, text, note }, i) => {
          const c = colors[type];
          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, x: -10 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1, ease: "easeOut" }}
              className="space-y-2 rounded-xl border p-4"
              style={{ background: c.bg, borderColor: c.border }}
            >
              <div className="flex items-center gap-2">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full"
                  style={{ background: c.dot }}
                />
                <span
                  className="text-[10px] font-bold uppercase tracking-wider"
                  style={{ color: c.label }}
                >
                  {label}
                </span>
              </div>
              <p
                className="text-[13px] font-medium leading-snug"
                style={{ color: "var(--color-text-invert)" }}
              >
                {text}
              </p>
              <p
                className="text-[12px] leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                {note}
              </p>
            </motion.div>
          );
        })}
      </div>

      <div
        className="flex items-center justify-between border-t px-5 py-3"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-2)",
        }}
      >
        <span
          className="text-[12px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          14 feedback points generated
        </span>
        <span
          className="text-[12px] font-semibold"
          style={{ color: "var(--color-accent)" }}
        >
          Session score: 87/100
        </span>
      </div>
    </div>
  );
}

export default function AIFeedback() {
  return (
    <section
      id="ai-feedback"
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
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-2 lg:gap-24">
          <motion.div
            initial={{ opacity: 0, x: -24 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true, margin: "-80px" }}
            transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          >
            <FeedbackCard />
          </motion.div>

          <div>
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-80px" }}
              transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
              className="mb-10"
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
                AI Feedback
              </span>

              <h2
                className="mt-4 max-w-[440px] text-balance"
                style={{
                  fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  letterSpacing: "-0.02em",
                  color: "var(--color-text-invert)",
                  margin: "1rem 0 0",
                }}
              >
                Feedback that actually{" "}
                <span
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent) 0%, #c084fc 100%)",
                    WebkitBackgroundClip: "text",
                    WebkitTextFillColor: "transparent",
                    backgroundClip: "text",
                  }}
                >
                  makes you better
                </span>
              </h2>

              <p
                className="mt-4 max-w-[420px] text-base leading-relaxed"
                style={{ color: "var(--color-text-muted)" }}
              >
                Most platforms score you and call it feedback. InterviewX goes
                sentence by sentence — flagging weak answers, rewarding strong
                ones, and telling you exactly how to fix what's broken.
              </p>
            </motion.div>

            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true, margin: "-60px" }}
              className="space-y-6"
            >
              {POINTS.map(({ icon: Icon, title, description }) => (
                <motion.div
                  key={title}
                  variants={fadeUp}
                  className="flex items-start gap-4"
                >
                  <div
                    className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      background: "var(--color-accent-bg)",
                      borderColor: "var(--color-accent-border)",
                    }}
                  >
                    <Icon
                      size={16}
                      strokeWidth={1.8}
                      style={{ color: "var(--color-accent)" }}
                    />
                  </div>
                  <div className="space-y-1">
                    <h3
                      className="text-[14px] font-semibold"
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
                </motion.div>
              ))}
            </motion.div>

            <motion.blockquote
              initial={{ opacity: 0, y: 16 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-60px" }}
              transition={{
                duration: 0.55,
                delay: 0.3,
                ease: [0.16, 1, 0.3, 1],
              }}
              className="mt-10 rounded-xl border-l-2 py-1 pl-5"
              style={{ borderColor: "var(--color-accent)" }}
            >
              <p
                className="text-sm leading-relaxed italic"
                style={{ color: "var(--color-text-muted)" }}
              >
                "The AI caught me saying 'um' 11 times and told me exactly which
                answers needed more structure. No human coach has ever been that
                specific with me."
              </p>
              <footer
                className="mt-2 text-[12px] font-semibold"
                style={{ color: "var(--color-text)" }}
              >
                — Arjun S., landed a Staff Engineer role at Stripe
              </footer>
            </motion.blockquote>
          </div>
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
