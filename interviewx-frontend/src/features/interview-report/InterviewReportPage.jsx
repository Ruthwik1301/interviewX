import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useNavigate, useParams } from "react-router-dom";
import {
  BarChart3,
  ChevronRight,
  TrendingUp,
  TrendingDown,
  Award,
  RotateCcw,
  ArrowRight,
} from "lucide-react";
import { RoutePaths } from "@/app/routes/paths";
import { api, ApiError } from "@/shared/lib/api.js";

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
  show: { transition: { staggerChildren: 0.08 } },
};

function formatDuration(startedAt, completedAt) {
  if (!startedAt || !completedAt) return "—";
  const ms = new Date(completedAt) - new Date(startedAt);
  const mins = Math.max(1, Math.round(ms / 60000));
  return `${mins} minute${mins === 1 ? "" : "s"}`;
}

function formatDate(iso) {
  if (!iso) return "—";
  return new Date(iso).toLocaleDateString(undefined, {
    month: "long",
    day: "numeric",
    year: "numeric",
  });
}

function parseStructuredQuestion(q) {
  if (typeof q === "object" && q !== null) return q;
  if (typeof q !== "string") return null;

  const trimmed = q.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
}

/**
 * Safely extracts a clean display title whether the question is:
 * - a plain string (regular tracks)
 * - a JSON string of {title, description, ...} (DSA / aptitude tracks)
 */
function getQuestionTitle(q) {
  if (typeof q !== "string") return String(q ?? "");

  const parsed = parseStructuredQuestion(q);
  if (parsed) {
    return parsed.title ?? parsed.description ?? parsed.question ?? q.trim();
  }

  return q;
}

function normalizeAnswer(value) {
  return String(value ?? "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9%]+/g, "");
}

function extractOptionId(answer) {
  const raw = String(answer ?? "");
  const match = raw.match(/\b([A-D])\b/i);
  return match?.[1]?.toUpperCase() ?? null;
}

function getAptitudeReview(question, answer) {
  const parsed = parseStructuredQuestion(question);
  if (!parsed || !Array.isArray(parsed.options) || !parsed.correctAnswer) {
    return null;
  }

  const rawAnswer = String(answer ?? "").trim();
  const normalizedAnswer = normalizeAnswer(rawAnswer);
  const selectedId = extractOptionId(rawAnswer);
  const correctId = String(parsed.correctAnswer).toUpperCase();
  const correctOption = parsed.options.find(
    (opt) => String(opt.id).toUpperCase() === correctId,
  );

  const matchedOption =
    parsed.options.find((opt) => {
      const optionText = normalizeAnswer(opt.text);
      return (
        selectedId === String(opt.id).toUpperCase() ||
        normalizedAnswer === optionText ||
        normalizedAnswer === normalizeAnswer(`option ${opt.id}`) ||
        (optionText.length >= 4 && normalizedAnswer.includes(optionText))
      );
    }) ?? null;

  const skipped =
    !normalizedAnswer || /skip this question|^skip$|noanswer/i.test(rawAnswer);
  const selectedAnswer = skipped
    ? "Skipped"
    : matchedOption
      ? `${matchedOption.id}. ${matchedOption.text}`
      : rawAnswer || "—";
  const correctAnswer = correctOption
    ? `${correctOption.id}. ${correctOption.text}`
    : correctId;
  const isCorrect = !skipped && matchedOption
    ? String(matchedOption.id).toUpperCase() === correctId
    : false;

  return {
    selectedAnswer,
    correctAnswer,
    explanation: parsed.explanation ?? "",
    isCorrect,
    skipped,
  };
}

function ScoreBar({ label, value }) {
  const color =
    value >= 88
      ? "var(--color-success)"
      : value >= 70
        ? "var(--color-accent)"
        : "var(--color-warning)";
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span
          className="text-[15px] font-medium"
          style={{ color: "var(--color-text-invert)" }}
        >
          {label}
        </span>
        <span className="text-[15px] font-bold" style={{ color }}>
          {value}%
        </span>
      </div>
      <div
        className="h-2.5 w-full overflow-hidden rounded-full"
        style={{ background: "var(--color-surface-3)" }}
      >
        <motion.div
          className="h-full rounded-full"
          style={{ background: color }}
          initial={{ width: 0 }}
          whileInView={{ width: `${value}%` }}
          viewport={{ once: true }}
          transition={{ duration: 1, ease: [0.16, 1, 0.3, 1], delay: 0.1 }}
        />
      </div>
    </div>
  );
}

function AptitudeAnswerReview({ review }) {
  if (!review) return null;

  return (
    <div
      className="ml-9 space-y-3 rounded-xl border p-4"
      style={{
        background: "var(--color-surface-2)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Selected Answer
          </p>
          <p
            className="mt-1 text-[13px] font-medium leading-relaxed"
            style={{
              color: review.skipped
                ? "var(--color-warning)"
                : review.isCorrect
                  ? "var(--color-success)"
                  : "var(--color-text-invert)",
            }}
          >
            {review.selectedAnswer}
          </p>
        </div>
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Correct Answer
          </p>
          <p
            className="mt-1 text-[13px] font-medium leading-relaxed"
            style={{ color: "var(--color-success)" }}
          >
            {review.correctAnswer}
          </p>
        </div>
      </div>

      {review.explanation && (
        <div>
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--color-text-muted)" }}
          >
            Explanation
          </p>
          <p
            className="mt-1 text-[13px] leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {review.explanation}
          </p>
        </div>
      )}
    </div>
  );
}

function QuestionRow({ q, answerText, score, feedback, index }) {
  const color =
    score >= 88
      ? "var(--color-success)"
      : score >= 70
        ? "var(--color-accent)"
        : "var(--color-warning)";

  const title = getQuestionTitle(q);
  const aptitudeReview = getAptitudeReview(q, answerText);

  return (
    <motion.div
      variants={fadeUp}
      className="rounded-xl border p-5 space-y-3"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border)",
      }}
    >
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <span
            className="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[12px] font-bold"
            style={{
              background: "var(--color-surface-3)",
              color: "var(--color-text-muted)",
            }}
          >
            {index + 1}
          </span>
          <p
            className="text-[15px] font-medium leading-snug"
            style={{ color: "var(--color-text-invert)" }}
          >
            {title}
          </p>
        </div>
        <span
          className="shrink-0 rounded-lg px-3 py-1.5 text-[14px] font-bold"
          style={{ background: "var(--color-surface-2)", color }}
        >
          {score}%
        </span>
      </div>
      <p
        className="pl-9 text-[14px] leading-relaxed"
        style={{ color: "var(--color-text-muted)" }}
      >
        {feedback}
      </p>
      <AptitudeAnswerReview review={aptitudeReview} />
    </motion.div>
  );
}

function CenteredMessage({ children }) {
  return (
    <div
      className="flex min-h-full w-full items-center justify-center px-6 py-20 text-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="max-w-sm">{children}</div>
    </div>
  );
}

export default function InterviewReportPage() {
  const navigate = useNavigate();
  const { id } = useParams();

  const [session, setSession] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    let cancelled = false;
    let pollTimer;

    async function load() {
      try {
        const { session } = await api.get(`/api/interviews/${id}`);
        if (cancelled) return;
        setSession(session);
        setLoading(false);

        if (session.status !== "completed") {
          setGenerating(true);
          pollTimer = setTimeout(load, 2500);
        } else {
          setGenerating(false);
        }
      } catch (err) {
        if (cancelled) return;
        setLoading(false);
        setError(
          err instanceof ApiError
            ? err.message
            : "Couldn't load this report. Please try again.",
        );
      }
    }

    load();
    return () => {
      cancelled = true;
      clearTimeout(pollTimer);
    };
  }, [id]);

  if (loading) {
    return (
      <CenteredMessage>
        <div
          className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: "var(--color-accent)",
            borderTopColor: "transparent",
          }}
        />
        <p className="text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          Loading your report…
        </p>
      </CenteredMessage>
    );
  }

  if (error) {
    return (
      <CenteredMessage>
        <p
          className="mb-4 text-[15px] font-semibold"
          style={{ color: "var(--color-error)" }}
        >
          {error}
        </p>
        <button
          onClick={() => navigate(RoutePaths.appRoot)}
          className="rounded-xl px-5 py-2.5 text-[15px] font-semibold text-white"
          style={{
            background:
              "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
          }}
        >
          Back to dashboard
        </button>
      </CenteredMessage>
    );
  }

  if (generating || !session.report) {
    return (
      <CenteredMessage>
        <div
          className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
          style={{
            borderColor: "var(--color-accent)",
            borderTopColor: "transparent",
          }}
        />
        <p
          className="mb-1 text-[15px] font-semibold"
          style={{ color: "var(--color-text-invert)" }}
        >
          Generating your report…
        </p>
        <p className="text-[15px]" style={{ color: "var(--color-text-muted)" }}>
          The AI is reviewing your answers. This usually takes a few seconds.
        </p>
      </CenteredMessage>
    );
  }

  const report = session.report;
  const breakdown = Object.entries(report.breakdown || {});
  const topScore =
    session.answers.length > 0
      ? Math.max(...session.answers.map((a) => a.score))
      : report.overall;

  return (
    <div
      className="min-h-full w-full"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="mx-auto max-w-[860px] px-4 py-12 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45 }}
          className="mb-10"
        >
          <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <span
                className="inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[12px] font-semibold uppercase tracking-widest"
                style={{
                  background: "var(--color-accent-bg)",
                  borderColor: "var(--color-accent-border)",
                  color: "var(--color-accent)",
                }}
              >
                <BarChart3 size={11} strokeWidth={2.5} />
                Session Report
              </span>
              <h1
                className="mt-3 text-balance"
                style={{
                  fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
                  fontWeight: 700,
                  letterSpacing: "-0.02em",
                  lineHeight: 1.2,
                  color: "var(--color-text-invert)",
                  margin: "0.75rem 0 0",
                }}
              >
                {session.trackTitle}
              </h1>
              <p
                className="mt-1 text-[15px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {session.role} · {formatDate(session.completedAt)} ·{" "}
                {formatDuration(session.startedAt, session.completedAt)}
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <button
                onClick={() => navigate(RoutePaths.createInterview)}
                className="flex items-center gap-1.5 rounded-lg border px-3.5 py-2.5 text-[13px] font-medium transition-colors hover:bg-[color:var(--color-accent-bg)]"
                style={{
                  borderColor: "var(--color-accent-border)",
                  color: "var(--color-accent)",
                }}
              >
                <RotateCcw size={14} strokeWidth={2} />
                Retry
              </button>
            </div>
          </div>
        </motion.div>

        {/* Overall score */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, delay: 0.05 }}
          className="mb-6 overflow-hidden rounded-2xl border"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-strong)",
          }}
        >
          <div className="flex flex-col items-center gap-6 p-8 sm:flex-row">
            <div
              className="flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-4 text-3xl font-bold"
              style={{
                borderColor: "var(--color-accent)",
                color: "var(--color-accent)",
                background: "var(--color-accent-bg)",
              }}
            >
              {report.grade}
            </div>
            <div className="flex-1 text-center sm:text-left">
              <p
                className="text-[12px] font-bold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                Overall Score
              </p>
              <p
                className="mt-1 text-5xl font-bold"
                style={{ color: "var(--color-accent)", lineHeight: 1 }}
              >
                {report.overall}
                <span
                  className="text-xl font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  /100
                </span>
              </p>
              {report.summary && (
                <p
                  className="mt-2 text-[15px] leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {report.summary}
                </p>
              )}
            </div>
            <div className="grid grid-cols-3 gap-4 sm:grid-cols-1 sm:gap-3">
              {[
                {
                  label: "Questions",
                  value: `${session.answers.length}/${session.questions.length}`,
                },
                {
                  label: "Duration",
                  value: formatDuration(session.startedAt, session.completedAt),
                },
                { label: "Top Score", value: `${topScore}%` },
              ].map(({ label, value }) => (
                <div
                  key={label}
                  className="flex flex-col items-center gap-0.5 sm:items-end"
                >
                  <span
                    className="text-[15px] font-bold"
                    style={{ color: "var(--color-text-invert)" }}
                  >
                    {value}
                  </span>
                  <span
                    className="text-[12px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </motion.div>

        {/* Score breakdown */}
        {breakdown.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.1 }}
            className="mb-6 rounded-2xl border p-6"
            style={{
              background: "var(--color-surface-1)",
              borderColor: "var(--color-border-strong)",
            }}
          >
            <p
              className="mb-5 text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Score Breakdown
            </p>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
              {breakdown.map(([label, value]) => (
                <ScoreBar key={label} label={label} value={value} />
              ))}
            </div>
          </motion.div>
        )}

        {/* Strengths + Improvements */}
        {(report.strengths?.length > 0 || report.improvements?.length > 0) && (
          <div className="mb-6 grid grid-cols-1 gap-4 sm:grid-cols-2">
            {report.strengths?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.15 }}
                className="rounded-2xl border p-5 space-y-3"
                style={{
                  background: "var(--color-success-bg)",
                  borderColor: "var(--color-success-border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <TrendingUp
                    size={15}
                    strokeWidth={2}
                    style={{ color: "var(--color-success)" }}
                  />
                  <p
                    className="text-[12px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--color-success)" }}
                  >
                    Strengths
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {report.strengths.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[14px] leading-relaxed"
                      style={{ color: "var(--color-text)" }}
                    >
                      <ChevronRight
                        size={14}
                        strokeWidth={2.5}
                        className="mt-0.5 shrink-0"
                        style={{ color: "var(--color-success)" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}

            {report.improvements?.length > 0 && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.45, delay: 0.18 }}
                className="rounded-2xl border p-5 space-y-3"
                style={{
                  background: "var(--color-warning-bg)",
                  borderColor: "var(--color-warning-border)",
                }}
              >
                <div className="flex items-center gap-2">
                  <TrendingDown
                    size={15}
                    strokeWidth={2}
                    style={{ color: "var(--color-warning)" }}
                  />
                  <p
                    className="text-[12px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--color-warning)" }}
                  >
                    Improvements
                  </p>
                </div>
                <ul className="space-y-2.5">
                  {report.improvements.map((item) => (
                    <li
                      key={item}
                      className="flex items-start gap-2 text-[14px] leading-relaxed"
                      style={{ color: "var(--color-text)" }}
                    >
                      <ChevronRight
                        size={14}
                        strokeWidth={2.5}
                        className="mt-0.5 shrink-0"
                        style={{ color: "var(--color-warning)" }}
                      />
                      {item}
                    </li>
                  ))}
                </ul>
              </motion.div>
            )}
          </div>
        )}

        {/* Question breakdown */}
        {session.answers.length > 0 && (
          <motion.div
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.45, delay: 0.2 }}
            className="mb-6"
          >
            <p
              className="mb-4 text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Question by Question
            </p>
            <motion.div
              variants={stagger}
              initial="hidden"
              whileInView="show"
              viewport={{ once: true }}
              className="space-y-3"
            >
              {session.answers.map((item, i) => (
                <QuestionRow
                  key={i}
                  index={i}
                  q={item.question}
                  answerText={item.answer}
                  score={item.score}
                  feedback={item.feedback}
                />
              ))}
            </motion.div>
          </motion.div>
        )}

        {/* Next steps */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.45 }}
          className="rounded-2xl border p-6"
          style={{
            background: "var(--color-accent-bg)",
            borderColor: "var(--color-accent-border)",
          }}
        >
          <div className="flex items-center gap-2 mb-3">
            <Award
              size={15}
              strokeWidth={2}
              style={{ color: "var(--color-accent)" }}
            />
            <p
              className="text-[12px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-accent)" }}
            >
              Keep practicing
            </p>
          </div>
          <p
            className="text-[15px] leading-relaxed mb-4"
            style={{ color: "var(--color-text)" }}
          >
            Ready for another round? Start a new session and keep building on
            this track or try a different one.
          </p>
          <button
            onClick={() => navigate(RoutePaths.createInterview)}
            className="inline-flex items-center gap-2 rounded-xl px-5 py-2.5 text-[15px] font-semibold text-white transition-all"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
              boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
            }}
          >
            Start Next Session
            <ArrowRight size={15} strokeWidth={2.5} />
          </button>
        </motion.div>
      </div>
    </div>
  );
}
