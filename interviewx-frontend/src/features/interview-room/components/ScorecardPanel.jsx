import { TrendingUp } from "lucide-react";

function gradeFor(score) {
  if (score >= 90) return "A";
  if (score >= 80) return "B+";
  if (score >= 70) return "B";
  if (score >= 60) return "C+";
  return "C";
}

export default function ScorecardPanel({
  answeredScores = [],
  lastFeedback,
  questionNumber,
  totalQuestions,
}) {
  const hasScores = answeredScores.length > 0;
  const overall = hasScores
    ? Math.round(
        answeredScores.reduce((a, b) => a + b, 0) / answeredScores.length,
      )
    : 0;
  const grade = gradeFor(overall);

  return (
    <div
      className="flex h-full flex-col overflow-hidden rounded-2xl border"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border-strong)",
      }}
    >
      <div
        className="flex items-center justify-between border-b px-5 py-4 shrink-0"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-2)",
        }}
      >
        <div className="flex items-center gap-2">
          <TrendingUp
            size={14}
            strokeWidth={2}
            style={{ color: "var(--color-accent)" }}
          />
          <span
            className="text-sm font-semibold"
            style={{ color: "var(--color-text-invert)" }}
          >
            Live Scorecard
          </span>
        </div>
        <span
          className="text-[11px] font-medium"
          style={{ color: "var(--color-text-muted)" }}
        >
          Q{questionNumber} of {totalQuestions}
        </span>
      </div>

      <div className="flex-1 overflow-y-auto p-5 space-y-5">
        <div
          className="flex items-center justify-between rounded-xl border p-4"
          style={{
            background: "var(--color-surface-2)",
            borderColor: "var(--color-border)",
          }}
        >
          <div>
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Running Average
            </p>
            <p
              className="mt-0.5 text-3xl font-bold"
              style={{ color: "var(--color-accent)" }}
            >
              {hasScores ? answeredScores.length : "—"}
              {hasScores && (
                <span
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  /100
                </span>
              )}
            </p>
          </div>
          {hasScores && (
            <div
              className="flex h-14 w-14 items-center justify-center rounded-full border-4 text-sm font-bold"
              style={{
                borderColor: "var(--color-accent)",
                color: "var(--color-accent)",
                background: "var(--color-accent-bg)",
              }}
            >
              {grade}
            </div>
          )}
        </div>

        <div className="space-y-1.5">
          <div
            className="flex justify-between text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            <span>Session Progress</span>
            <span>{Math.round((questionNumber / totalQuestions) * 100)}%</span>
          </div>
          <div className="flex gap-1">
            {Array.from({ length: totalQuestions }).map((_, i) => (
              <div
                key={i}
                className="h-1.5 flex-1 rounded-full transition-all duration-500"
                style={{
                  background:
                    i < questionNumber
                      ? "var(--color-accent)"
                      : "var(--color-surface-3)",
                }}
              />
            ))}
          </div>
        </div>

        {answeredScores.length > 0 && (
          <div className="space-y-3">
            <p
              className="text-[10px] font-bold uppercase tracking-wider"
              style={{ color: "var(--color-text-muted)" }}
            >
              Per-question Scores
            </p>
            <div className="flex flex-wrap gap-1.5">
              {answeredScores.map((s, i) => (
                <span
                  key={i}
                  className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold"
                  style={{
                    background:
                      s >= 80
                        ? "var(--color-success-bg)"
                        : s >= 60
                          ? "var(--color-accent-bg)"
                          : "var(--color-warning-bg)",
                    color:
                      s >= 80
                        ? "var(--color-success)"
                        : s >= 60
                          ? "var(--color-accent)"
                          : "var(--color-warning)",
                  }}
                  title={`Question ${i + 1}: ${s}/100`}
                >
                  {s}
                </span>
              ))}
            </div>
          </div>
        )}

        <div
          className="rounded-xl border p-4 space-y-2"
          style={{
            background: "var(--color-accent-bg)",
            borderColor: "var(--color-accent-border)",
          }}
        >
          <p
            className="text-[10px] font-bold uppercase tracking-wider"
            style={{ color: "var(--color-accent)" }}
          >
            AI Feedback
          </p>
          <p
            className="text-[12px] leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            {lastFeedback ||
              "Answer the first question to see live AI feedback here."}
          </p>
        </div>
      </div>
    </div>
  );
}
