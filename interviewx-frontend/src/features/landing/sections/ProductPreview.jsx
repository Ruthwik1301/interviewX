import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, BarChart3, FileText, ChevronRight } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const TABS = [
  { id: "interview", label: "Live Interview", icon: Mic },
  { id: "scorecard", label: "Scorecard", icon: BarChart3 },
  { id: "report", label: "Full Report", icon: FileText },
];

function InterviewPanel() {
  return (
    <div className="space-y-4">
      <div
        className="flex items-center justify-between rounded-xl border px-4 py-3"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center gap-3">
          <div
            className="flex h-7 w-7 items-center justify-center rounded-lg text-[10px] font-bold text-white"
            style={{ background: "var(--color-accent)" }}
          >
            IX
          </div>
          <div>
            <p
              className="text-[13px] font-semibold"
              style={{ color: "var(--color-text-invert)" }}
            >
              Technical Interview
            </p>
            <p
              className="text-[11px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              Senior Software Engineer · Round 2
            </p>
          </div>
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

      <div className="space-y-3">
        <div className="flex items-start gap-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
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
            Can you walk me through how you would implement a distributed cache
            with consistency guarantees? What trade-offs would you make?
          </div>
        </div>

        <div className="flex items-start justify-end gap-3">
          <div
            className="max-w-[85%] rounded-xl rounded-tr-sm px-4 py-3 text-sm leading-relaxed"
            style={{
              background: "var(--color-accent-bg)",
              color: "var(--color-text)",
              border: "1px solid var(--color-accent-border)",
            }}
          >
            I'd start with a write-through cache using Redis Cluster. For
            consistency, I'd use a read-your-writes model with sticky sessions,
            accepting eventual consistency across replicas to keep latency low…
          </div>
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
            style={{
              background: "var(--color-surface-3)",
              color: "var(--color-text-muted)",
            }}
          >
            You
          </div>
        </div>

        <div className="flex items-start gap-3">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
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
            Good approach. How would you handle cache invalidation when the
            underlying data changes across multiple services?
          </div>
        </div>
      </div>

      <div
        className="grid grid-cols-3 gap-3 rounded-xl border p-4"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border)",
        }}
      >
        {[
          { label: "Depth", value: "88%" },
          { label: "Clarity", value: "92%" },
          { label: "Confidence", value: "79%" },
        ].map(({ label, value }) => (
          <div key={label} className="flex flex-col items-center gap-0.5">
            <span
              className="text-base font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {value}
            </span>
            <span
              className="text-[11px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {label}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

function ScorecardPanel() {
  const scores = [
    {
      label: "Technical Accuracy",
      pct: 91,
      detail: "Excellent depth on distributed systems",
    },
    {
      label: "Communication",
      pct: 85,
      detail: "Clear structure, some filler words",
    },
    { label: "Problem Solving", pct: 88, detail: "Good trade-off analysis" },
    {
      label: "Code Quality",
      pct: 76,
      detail: "Could improve time complexity discussion",
    },
    { label: "System Design", pct: 93, detail: "Strong scalability thinking" },
  ];

  return (
    <div className="space-y-4">
      <div
        className="flex items-center justify-between rounded-xl border px-5 py-4"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border)",
        }}
      >
        <div>
          <p
            className="text-[11px] font-semibold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Overall Score
          </p>
          <p
            className="mt-0.5 text-3xl font-bold"
            style={{ color: "var(--color-accent)" }}
          >
            87
            <span
              className="text-base font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              /100
            </span>
          </p>
        </div>
        <div
          className="flex h-14 w-14 items-center justify-center rounded-full border-4 text-sm font-bold"
          style={{
            borderColor: "var(--color-accent)",
            color: "var(--color-accent)",
            background: "var(--color-accent-bg)",
          }}
        >
          A−
        </div>
      </div>

      <div className="space-y-3">
        {scores.map(({ label, pct, detail }) => (
          <div key={label} className="space-y-1.5">
            <div className="flex items-center justify-between">
              <span
                className="text-[13px] font-medium"
                style={{ color: "var(--color-text-invert)" }}
              >
                {label}
              </span>
              <span
                className="text-[13px] font-semibold"
                style={{ color: "var(--color-accent)" }}
              >
                {pct}%
              </span>
            </div>
            <div
              className="h-1.5 w-full overflow-hidden rounded-full"
              style={{ background: "var(--color-surface-3)" }}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--color-accent)" }}
                initial={{ width: 0 }}
                whileInView={{ width: `${pct}%` }}
                viewport={{ once: true }}
                transition={{
                  duration: 1,
                  ease: [0.16, 1, 0.3, 1],
                  delay: 0.1,
                }}
              />
            </div>
            <p
              className="text-[11px]"
              style={{ color: "var(--color-text-muted)" }}
            >
              {detail}
            </p>
          </div>
        ))}
      </div>
    </div>
  );
}

function ReportPanel() {
  const sections = [
    {
      title: "Strengths",
      color: "var(--color-success)",
      colorBg: "var(--color-success-bg)",
      colorBorder: "var(--color-success-border)",
      items: [
        "Strong grasp of distributed systems trade-offs",
        "Excellent system design scalability thinking",
        "Confident delivery with clear structure",
      ],
    },
    {
      title: "Improvements",
      color: "#f59e0b",
      colorBg: "rgba(245,158,11,0.1)",
      colorBorder: "rgba(245,158,11,0.25)",
      items: [
        'Reduce filler words — "um", "like" detected 11 times',
        "Add more concrete complexity analysis to code answers",
        "Expand on failure modes in distributed scenarios",
      ],
    },
  ];

  return (
    <div className="space-y-4">
      <div
        className="rounded-xl border px-5 py-4"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border)",
        }}
      >
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-[11px] font-semibold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Session Report
            </p>
            <p
              className="mt-0.5 text-[13px] font-semibold"
              style={{ color: "var(--color-text-invert)" }}
            >
              Technical Interview · Senior Engineer
            </p>
          </div>
          <div
            className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold"
            style={{
              background: "var(--color-accent-bg)",
              borderColor: "var(--color-accent-border)",
              color: "var(--color-accent)",
            }}
          >
            Score: 87/100
          </div>
        </div>
      </div>

      {sections.map(({ title, color, colorBg, colorBorder, items }) => (
        <div
          key={title}
          className="space-y-2 rounded-xl border p-4"
          style={{ background: colorBg, borderColor: colorBorder }}
        >
          <p
            className="text-[12px] font-bold uppercase tracking-wider"
            style={{ color }}
          >
            {title}
          </p>
          <ul className="space-y-1.5">
            {items.map((item) => (
              <li
                key={item}
                className="flex items-start gap-2 text-[13px]"
                style={{ color: "var(--color-text)" }}
              >
                <ChevronRight
                  size={13}
                  strokeWidth={2.5}
                  className="mt-0.5 shrink-0"
                  style={{ color }}
                />
                {item}
              </li>
            ))}
          </ul>
        </div>
      ))}

      <div
        className="rounded-xl border px-4 py-3"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border)",
        }}
      >
        <p
          className="mb-2 text-[11px] font-semibold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Recommended Next Session
        </p>
        <p className="text-[13px]" style={{ color: "var(--color-text)" }}>
          System Design Deep Dive — focus on failure handling and consensus
          protocols.
        </p>
      </div>
    </div>
  );
}

export default function ProductPreview() {
  const [activeTab, setActiveTab] = useState("interview");

  const panels = {
    interview: <InterviewPanel />,
    scorecard: <ScorecardPanel />,
    report: <ReportPanel />,
  };

  return (
    <section
      id="product"
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
            Product Preview
          </span>

          <h2
            className="mx-auto max-w-[580px] text-balance"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--color-text-invert)",
              margin: 0,
            }}
          >
            See exactly what you get inside
          </h2>

          <p
            className="mx-auto mt-4 max-w-[460px] text-balance text-base leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            From the live interview room to your detailed scorecard and full
            session report — everything is built to make you better, faster.
          </p>
        </motion.div>

        <motion.div
          variants={fadeUp}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="mx-auto max-w-[680px]"
        >
          <div
            className="mb-6 flex items-center gap-1 rounded-xl border p-1"
            style={{
              background: "var(--color-surface-1)",
              borderColor: "var(--color-border)",
            }}
          >
            {TABS.map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setActiveTab(id)}
                className="relative flex flex-1 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-medium transition-colors focus:outline-none"
                style={{
                  color:
                    activeTab === id
                      ? "var(--color-text-invert)"
                      : "var(--color-text-muted)",
                }}
              >
                {activeTab === id && (
                  <motion.div
                    layoutId="tab-bg"
                    className="absolute inset-0 rounded-lg"
                    style={{ background: "var(--color-surface-3)" }}
                    transition={{ duration: 0.2, ease: "easeOut" }}
                  />
                )}
                <Icon size={14} strokeWidth={2} className="relative z-10" />
                <span className="relative z-10 hidden sm:inline">{label}</span>
              </button>
            ))}
          </div>

          <div
            className="overflow-hidden rounded-2xl border p-5"
            style={{
              background: "var(--color-surface-1)",
              borderColor: "var(--color-border-strong)",
              boxShadow: "0 24px 60px rgba(0,0,0,0.18)",
            }}
          >
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                transition={{ duration: 0.22, ease: "easeOut" }}
              >
                {panels[activeTab]}
              </motion.div>
            </AnimatePresence>
          </div>
        </motion.div>
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
