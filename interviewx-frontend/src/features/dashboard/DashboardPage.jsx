import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate } from "react-router-dom";
import {
  Plus,
  BarChart3,
  Clock,
  TrendingUp,
  TrendingDown,
  Brain,
  Code2,
  ShieldCheck,
  Users,
  Network,
  ArrowRight,
  Calendar,
} from "lucide-react";
import { RoutePaths } from "@/app/routes/paths";
import { useAuth } from "@/app/providers/useAuth.js";
import { api } from "@/shared/lib/api.js";

const fadeUp = {
  hidden: { opacity: 0, y: 20 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.5, ease: [0.16, 1, 0.3, 1] },
  },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07, delayChildren: 0.05 } },
};

const TRACK_ICONS = {
  technical: Brain,
  coding: Code2,
  cybersecurity: ShieldCheck,
  "system-design": Network,
  hr: Users,
};

const QUICK_STARTS = [
  {
    id: "technical",
    label: "Technical",
    icon: Brain,
    color: "var(--color-accent)",
  },
  { id: "coding", label: "Coding", icon: Code2, color: "#8b5cf6" },
  { id: "cybersecurity", label: "Cyber", icon: ShieldCheck, color: "#6366f1" },
  {
    id: "system-design",
    label: "System Design",
    icon: Network,
    color: "#a855f7",
  },
  { id: "hr", label: "HR Round", icon: Users, color: "#7c3aed" },
];

function scoreColor(v) {
  return v >= 85
    ? "var(--color-success)"
    : v >= 70
      ? "var(--color-accent)"
      : "var(--color-warning)";
}

function formatDate(iso) {
  if (!iso) return "—";
  const d = new Date(iso);
  const now = new Date();
  const diffMs = now - d;
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffDays === 0)
    return `Today, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  if (diffDays === 1)
    return `Yesterday, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`;
  return (
    d.toLocaleDateString(undefined, { month: "short", day: "numeric" }) +
    `, ${d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}`
  );
}

function formatDurationHours(sessions) {
  const totalMins = sessions.reduce((sum, s) => {
    if (!s.startedAt || !s.completedAt) return sum;
    return (
      sum +
      Math.max(
        1,
        Math.round((new Date(s.completedAt) - new Date(s.startedAt)) / 60000),
      )
    );
  }, 0);
  if (totalMins < 60) return `${totalMins}m`;
  const h = (totalMins / 60).toFixed(1);
  return `${h}h`;
}

function computeStats(sessions) {
  const completed = sessions.filter((s) => s.status === "completed");
  const total = sessions.length;
  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, s) => sum + (s.report?.overall ?? 0), 0) /
            completed.length,
        )
      : null;
  const totalTime = formatDurationHours(completed);
  const lastSession = sessions[0]?.startedAt
    ? formatDate(sessions[0].startedAt)
    : null;
  return { total, avgScore, totalTime, lastSession };
}

function computeSkillScores(sessions) {
  const completed = sessions.filter(
    (s) => s.status === "completed" && s.report?.breakdown,
  );
  if (completed.length === 0) return null;

  // Aggregate breakdown scores across all completed sessions.
  const totals = {};
  const counts = {};
  for (const session of completed) {
    for (const [key, val] of Object.entries(session.report.breakdown)) {
      totals[key] = (totals[key] || 0) + val;
      counts[key] = (counts[key] || 0) + 1;
    }
  }

  return Object.entries(totals)
    .map(([label, total]) => ({
      label,
      value: Math.round(total / counts[label]),
    }))
    .sort((a, b) => b.value - a.value);
}

function lowestSkill(skillScores) {
  if (!skillScores || skillScores.length === 0) return null;
  return [...skillScores].sort((a, b) => a.value - b.value)[0];
}

function StatCard({ label, value, icon: Icon, trend, up }) {
  return (
    <motion.div
      variants={fadeUp}
      className="flex flex-col gap-3 rounded-2xl border p-5"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-center justify-between">
        <span
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </span>
        <div
          className="flex h-8 w-8 items-center justify-center rounded-lg"
          style={{
            background: "var(--color-accent-bg)",
            border: "1px solid var(--color-accent-border)",
          }}
        >
          <Icon
            size={14}
            strokeWidth={2}
            style={{ color: "var(--color-accent)" }}
          />
        </div>
      </div>
      <p
        className="text-3xl font-bold tracking-tight"
        style={{ color: "var(--color-text-invert)" }}
      >
        {value}
      </p>
      <p
        className="flex items-center gap-1 text-[11px]"
        style={{
          color:
            up === true
              ? "var(--color-success)"
              : up === false
                ? "var(--color-warning)"
                : "var(--color-text-muted)",
        }}
      >
        {up === true && <TrendingUp size={11} strokeWidth={2} />}
        {up === false && <TrendingDown size={11} strokeWidth={2} />}
        {trend}
      </p>
    </motion.div>
  );
}

function SkillBar({ label, value }) {
  const color = scoreColor(value);
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span
          className="text-[12px] font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          {label}
        </span>
        <span className="text-[12px] font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div
        className="h-1.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--color-surface-3)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </div>
    </div>
  );
}

function EmptyState({ onStart }) {
  return (
    <div className="flex flex-col items-center gap-4 py-14 text-center">
      <div
        className="flex h-14 w-14 items-center justify-center rounded-2xl"
        style={{
          background: "var(--color-accent-bg)",
          border: "1px solid var(--color-accent-border)",
        }}
      >
        <BarChart3
          size={24}
          strokeWidth={1.5}
          style={{ color: "var(--color-accent)" }}
        />
      </div>
      <div>
        <p
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-invert)" }}
        >
          No sessions yet
        </p>
        <p
          className="mt-1 text-[12px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          Complete your first interview to see your progress here.
        </p>
      </div>
      <button
        onClick={onStart}
        className="inline-flex items-center gap-2 rounded-xl px-4 py-2 text-sm font-semibold text-white"
        style={{
          background:
            "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
        }}
      >
        <Plus size={14} strokeWidth={2.5} />
        Start first interview
      </button>
    </div>
  );
}

export default function DashboardPage() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const firstName = user?.name?.trim().split(/\s+/)[0];

  const [sessions, setSessions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    api
      .get("/api/interviews")
      .then(({ sessions }) => setSessions(sessions))
      .catch(() => setSessions([]))
      .finally(() => setLoading(false));
  }, []);

  const stats = computeStats(sessions);
  const skillScores = computeSkillScores(sessions);
  const weakest = lowestSkill(skillScores);
  const recentSessions = sessions.slice(0, 5);

  const statCards = [
    {
      label: "Sessions Done",
      value: loading ? "—" : String(stats.total),
      icon: BarChart3,
      trend: stats.total === 0 ? "No sessions yet" : `${stats.total} total`,
      up: null,
    },
    {
      label: "Avg Score",
      value: loading
        ? "—"
        : stats.avgScore !== null
          ? `${stats.avgScore}%`
          : "—",
      icon: TrendingUp,
      trend:
        stats.avgScore !== null
          ? "Across completed sessions"
          : "Complete a session to see",
      up: stats.avgScore !== null ? stats.avgScore >= 75 : null,
    },
    {
      label: "Total Time",
      value: loading ? "—" : stats.totalTime || "—",
      icon: Clock,
      trend: "Across all sessions",
      up: null,
    },
    {
      label: "Last Session",
      value: loading ? "—" : stats.lastSession ? "Recent" : "—",
      icon: Calendar,
      trend: stats.lastSession || "No sessions yet",
      up: null,
    },
  ];

  return (
    <div
      className="min-h-full w-full"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="mx-auto max-w-[1100px] px-4 py-10 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1
              className="text-balance"
              style={{
                fontSize: "clamp(1.4rem,2.5vw,1.8rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--color-text-invert)",
                margin: 0,
              }}
            >
              Welcome back{firstName ? `, ${firstName}` : ""} 👋
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              {sessions.length === 0
                ? "Start your first interview to track your progress."
                : `You've completed ${sessions.filter((s) => s.status === "completed").length} interview${sessions.filter((s) => s.status === "completed").length === 1 ? "" : "s"} so far.`}
            </p>
          </div>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={() => navigate(RoutePaths.createInterview)}
            className="group relative inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
            }}
          >
            <Plus size={15} strokeWidth={2.5} />
            New Interview
          </motion.button>
        </motion.div>

        {/* Stats */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="mb-6 grid grid-cols-2 gap-4 sm:grid-cols-4"
        >
          {statCards.map((s) => (
            <StatCard key={s.label} {...s} />
          ))}
        </motion.div>

        {/* Main grid */}
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {/* Recent sessions */}
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="lg:col-span-2"
          >
            <div
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "var(--color-surface-1)",
                borderColor: "var(--color-border-strong)",
              }}
            >
              <div
                className="flex items-center justify-between border-b px-5 py-4"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface-2)",
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-invert)" }}
                >
                  Recent Sessions
                </span>
                {sessions.length > 5 && (
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Showing last 5
                  </span>
                )}
              </div>

              {loading ? (
                <div className="flex items-center justify-center py-14">
                  <div
                    className="h-5 w-5 animate-spin rounded-full border-2 border-t-transparent"
                    style={{
                      borderColor: "var(--color-accent)",
                      borderTopColor: "transparent",
                    }}
                  />
                </div>
              ) : recentSessions.length === 0 ? (
                <EmptyState
                  onStart={() => navigate(RoutePaths.createInterview)}
                />
              ) : (
                <div
                  className="divide-y"
                  style={{ borderColor: "var(--color-border)" }}
                >
                  {recentSessions.map((session, i) => {
                    const Icon = TRACK_ICONS[session.trackId] ?? Brain;
                    const score = session.report?.overall;
                    const color =
                      score != null
                        ? scoreColor(score)
                        : "var(--color-text-muted)";
                    return (
                      <motion.button
                        key={session.id}
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ duration: 0.35, delay: 0.1 + i * 0.06 }}
                        onClick={() =>
                          navigate(
                            RoutePaths.interviewReport.replace(
                              ":id",
                              session.id,
                            ),
                          )
                        }
                        className="flex w-full items-center gap-4 px-5 py-4 text-left transition-colors hover:bg-[color:var(--color-surface-2)]"
                      >
                        <div
                          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl border"
                          style={{
                            background: "var(--color-accent-bg)",
                            borderColor: "var(--color-accent-border)",
                          }}
                        >
                          <Icon
                            size={15}
                            strokeWidth={1.8}
                            style={{ color: "var(--color-accent)" }}
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p
                            className="text-[13px] font-semibold truncate"
                            style={{ color: "var(--color-text-invert)" }}
                          >
                            {session.trackTitle}
                          </p>
                          <p
                            className="text-[11px] truncate"
                            style={{ color: "var(--color-text-muted)" }}
                          >
                            {session.role} · {formatDate(session.startedAt)}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          {score != null ? (
                            <span
                              className="text-sm font-bold"
                              style={{ color }}
                            >
                              {score}%
                            </span>
                          ) : (
                            <span
                              className="text-[11px] rounded-full px-2 py-0.5 font-medium"
                              style={{
                                background: "var(--color-surface-3)",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {session.status === "in_progress"
                                ? "In progress"
                                : "—"}
                            </span>
                          )}
                          <ArrowRight
                            size={13}
                            strokeWidth={2}
                            style={{ color: "var(--color-text-muted)" }}
                          />
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              )}
            </div>
          </motion.div>

          {/* Right column */}
          <div className="flex flex-col gap-6">
            {/* Quick start */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.15 }}
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "var(--color-surface-1)",
                borderColor: "var(--color-border-strong)",
              }}
            >
              <div
                className="border-b px-5 py-4"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface-2)",
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-invert)" }}
                >
                  Quick Start
                </span>
              </div>
              <div className="grid grid-cols-5 gap-2 p-4">
                {QUICK_STARTS.map(({ id, label, icon: Icon, color }) => (
                  <button
                    key={id}
                    onClick={() => navigate(RoutePaths.createInterview)}
                    className="flex flex-col items-center gap-1.5 rounded-xl p-2 transition-colors hover:bg-[color:var(--color-surface-2)] focus:outline-none"
                  >
                    <div
                      className="flex h-9 w-9 items-center justify-center rounded-xl"
                      style={{
                        background: `${color}20`,
                        border: `1px solid ${color}40`,
                      }}
                    >
                      <Icon size={15} strokeWidth={1.8} style={{ color }} />
                    </div>
                    <span
                      className="text-center text-[9px] font-medium leading-tight"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {label}
                    </span>
                  </button>
                ))}
              </div>
            </motion.div>

            {/* Skill progress */}
            <motion.div
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.45, delay: 0.2 }}
              className="overflow-hidden rounded-2xl border"
              style={{
                background: "var(--color-surface-1)",
                borderColor: "var(--color-border-strong)",
              }}
            >
              <div
                className="border-b px-5 py-4"
                style={{
                  borderColor: "var(--color-border)",
                  background: "var(--color-surface-2)",
                }}
              >
                <span
                  className="text-sm font-semibold"
                  style={{ color: "var(--color-text-invert)" }}
                >
                  Skill Progress
                </span>
                <p
                  className="mt-0.5 text-[11px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Averaged across all reports
                </p>
              </div>
              <div className="space-y-4 p-5">
                {loading ? (
                  <p
                    className="text-center text-[12px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Loading…
                  </p>
                ) : skillScores && skillScores.length > 0 ? (
                  skillScores.map((s) => <SkillBar key={s.label} {...s} />)
                ) : (
                  <p
                    className="text-center text-[12px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Complete an interview to see skill breakdown.
                  </p>
                )}
              </div>
            </motion.div>
          </div>
        </div>

        {/* AI recommendation */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="mt-6 flex flex-col gap-4 overflow-hidden rounded-2xl border p-6 sm:flex-row sm:items-center sm:justify-between"
          style={{
            background: "var(--color-accent-bg)",
            borderColor: "var(--color-accent-border)",
          }}
        >
          <div>
            <p
              className="text-[11px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-accent)" }}
            >
              AI Recommendation
            </p>
            {weakest ? (
              <>
                <p
                  className="mt-1 text-[14px] font-semibold"
                  style={{ color: "var(--color-text-invert)" }}
                >
                  Focus on {weakest.label} — your lowest area at {weakest.value}
                  %.
                </p>
                <p
                  className="mt-0.5 text-[12px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Another interview session will help you build on this
                  directly.
                </p>
              </>
            ) : (
              <>
                <p
                  className="mt-1 text-[14px] font-semibold"
                  style={{ color: "var(--color-text-invert)" }}
                >
                  Start your first interview to get personalised
                  recommendations.
                </p>
                <p
                  className="mt-0.5 text-[12px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  After your first session, AI will suggest what to work on
                  next.
                </p>
              </>
            )}
          </div>
          <motion.button
            whileHover={{ y: -2 }}
            whileTap={{ y: 0 }}
            onClick={() => navigate(RoutePaths.createInterview)}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
            }}
          >
            {weakest ? "Practice This Skill" : "Start First Interview"}
            <ArrowRight size={14} strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
