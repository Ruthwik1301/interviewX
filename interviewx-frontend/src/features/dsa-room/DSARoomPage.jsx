import { useEffect, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import Editor from "@monaco-editor/react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Play,
  ChevronRight,
  ChevronLeft,
  RotateCcw,
  CheckCircle,
  Clock,
  BarChart3,
  Tag,
  Building2,
  ChevronDown,
  X,
} from "lucide-react";
import { api, ApiError } from "@/shared/lib/api.js";

// ─── Language config ──────────────────────────────────────────────────────────
// judge0Id = language ID on Judge0 CE (RapidAPI)
const LANGUAGES = [
  {
    id: "javascript",
    label: "JavaScript",
    monaco: "javascript",
    judge0Id: 63,
    starter: `function solution(nums) {\n  // Your code here\n  console.log("output here");\n};\n\nsolution([1, 2, 3]);\n`,
  },
  {
    id: "python",
    label: "Python",
    monaco: "python",
    judge0Id: 71,
    starter: `def solution(nums):\n    # Your code here\n    print("output here")\n\nsolution([1, 2, 3])\n`,
  },
  {
    id: "java",
    label: "Java",
    monaco: "java",
    judge0Id: 62,
    starter: `public class Main {\n    public static void main(String[] args) {\n        // Your code here\n        System.out.println("output here");\n    }\n}\n`,
  },
  {
    id: "cpp",
    label: "C++",
    monaco: "cpp",
    judge0Id: 54,
    starter: `#include <bits/stdc++.h>\nusing namespace std;\n\nint main() {\n    // Your code here\n    cout << "output here" << endl;\n    return 0;\n}\n`,
  },
  {
    id: "typescript",
    label: "TypeScript",
    monaco: "typescript",
    judge0Id: 74,
    starter: `function solution(nums: number[]): void {\n  // Your code here\n  console.log("output here");\n}\n\nsolution([1, 2, 3]);\n`,
  },
  {
    id: "go",
    label: "Go",
    monaco: "go",
    judge0Id: 60,
    starter: `package main\n\nimport "fmt"\n\nfunc main() {\n    // Your code here\n    fmt.Println("output here")\n}\n`,
  },
];

const DIFF_STYLE = {
  Easy: { bg: "#d1fae5", color: "#065f46" },
  "Warm-up": { bg: "#d1fae5", color: "#065f46" },
  Medium: { bg: "#fef3c7", color: "#92400e" },
  Hard: { bg: "#fee2e2", color: "#991b1b" },
};

function getBootErrorState(err) {
  if (err instanceof ApiError && err.status === 429) {
    return {
      isLimit: true,
      title: "Today's session limit reached",
      message: err.message,
      hint:
        "You can come back after the daily limit resets, or upgrade your plan for more sessions per day.",
    };
  }

  return {
    isLimit: false,
    title: "Couldn't start your DSA interview",
    message:
      err instanceof ApiError ? err.message : "Failed to load session.",
    hint: "Please go back and try again.",
  };
}

function fmtTime(s) {
  const m = Math.floor(s / 60);
  return `${String(m).padStart(2, "0")}:${String(s % 60).padStart(2, "0")}`;
}

/**
 * Groq sometimes returns questions as JSON objects instead of plain strings.
 * This normalises whatever shape comes back into a consistent {title, description,
 * difficulty, tags, companies, examples, constraints} object.
 */
function normaliseQuestion(raw) {
  if (typeof raw === "string") {
    // Try to parse if it looks like JSON
    if (raw.trim().startsWith("{")) {
      try {
        const obj = JSON.parse(raw);
        return normaliseQuestion(obj);
      } catch {
        /* fall through */
      }
    }
    return {
      title: raw.length > 72 ? raw.slice(0, 72) + "…" : raw,
      description: raw,
      difficulty: "Medium",
      tags: [],
      companies: [],
      examples: [],
      constraints: [],
    };
  }

  if (typeof raw === "object" && raw !== null) {
    const desc =
      raw.description ??
      raw.problem ??
      raw.text ??
      raw.question ??
      JSON.stringify(raw);
    const title =
      raw.title ??
      raw.name ??
      (desc.length > 72 ? desc.slice(0, 72) + "…" : desc);

    // Parse examples — Groq may give a string like "Input: [1,2] Output: [2,1]"
    let examples = [];
    if (Array.isArray(raw.examples)) {
      examples = raw.examples.map((e) =>
        typeof e === "string"
          ? { input: e, output: "" }
          : {
              input: e.input ?? "",
              output: e.output ?? "",
              explanation: e.explanation,
            },
      );
    } else if (raw.example && typeof raw.example === "string") {
      const parts = raw.example.split(/output:/i);
      examples = [
        {
          input: parts[0].replace(/input:/i, "").trim(),
          output: (parts[1] ?? "").trim(),
        },
      ];
    }

    return {
      title,
      description: desc,
      difficulty: raw.difficulty ?? raw.level ?? "Medium",
      tags: Array.isArray(raw.tags) ? raw.tags : raw.topic ? [raw.topic] : [],
      companies: Array.isArray(raw.companies) ? raw.companies : [],
      examples,
      constraints: Array.isArray(raw.constraints) ? raw.constraints : [],
    };
  }

  return {
    title: String(raw),
    description: String(raw),
    difficulty: "Medium",
    tags: [],
    companies: [],
    examples: [],
    constraints: [],
  };
}

// ─── Problem panel ────────────────────────────────────────────────────────────
function ProblemPanel({ q, qIndex, total, onPrev, onNext, onFinish, isLast }) {
  const diff = DIFF_STYLE[q?.difficulty] ?? DIFF_STYLE.Medium;

  return (
    <div className="flex h-full flex-col" style={{ background: "#0d1117" }}>
      {/* Header */}
      <div
        className="flex shrink-0 items-center justify-between px-5 py-3 border-b"
        style={{ borderColor: "#30363d", background: "#161b22" }}
      >
        <div className="flex items-center gap-2">
          <span className="text-[11px] font-semibold text-gray-400">
            Problem
          </span>
          <span
            className="rounded px-1.5 py-0.5 text-[10px] font-bold"
            style={{ background: "#7c3aed22", color: "#a78bfa" }}
          >
            {qIndex + 1} / {total}
          </span>
        </div>
        {q?.difficulty && (
          <span
            className="rounded-full px-2.5 py-0.5 text-[11px] font-semibold"
            style={{ background: diff.bg, color: diff.color }}
          >
            {q.difficulty}
          </span>
        )}
      </div>

      {/* Content — select-text so users can copy problem text */}
      <div
        className="flex-1 overflow-y-auto px-5 py-5 select-text"
        style={{ userSelect: "text" }}
      >
        {q ? (
          <div className="flex flex-col gap-4">
            {/* Title — block element, full width, guaranteed to sit above badges */}
            <h2
              style={{
                fontSize: "16px",
                fontWeight: 700,
                lineHeight: 1.3,
                color: "#ffffff",
                wordBreak: "break-word",
                margin: 0,
                padding: 0,
              }}
            >
              {q.title}
            </h2>

            {q.companies?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Building2 size={11} className="text-gray-500" />
                {q.companies.map((c) => (
                  <span
                    key={c}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium text-gray-400"
                    style={{ background: "#21262d" }}
                  >
                    {c}
                  </span>
                ))}
              </div>
            )}

            {q.tags?.length > 0 && (
              <div className="flex flex-wrap items-center gap-1.5">
                <Tag size={11} className="text-gray-500" />
                {q.tags.map((t) => (
                  <span
                    key={t}
                    className="rounded px-1.5 py-0.5 text-[10px] font-medium"
                    style={{ background: "#7c3aed22", color: "#a78bfa" }}
                  >
                    {t}
                  </span>
                ))}
              </div>
            )}

            <p className="text-[13px] leading-relaxed text-gray-300 whitespace-pre-wrap">
              {q.description}
            </p>

            {q.examples?.length > 0 && (
              <div className="flex flex-col gap-2">
                {q.examples.map((ex, i) => (
                  <div
                    key={i}
                    className="rounded-xl p-4"
                    style={{
                      background: "#161b22",
                      border: "1px solid #30363d",
                    }}
                  >
                    <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Example {i + 1}
                    </p>
                    <pre
                      className="text-[12px] text-gray-300 whitespace-pre-wrap m-0"
                      style={{ fontFamily: "'Fira Code', monospace" }}
                    >
                      <span className="text-gray-500">Input: </span>
                      {ex.input}
                      {"\n"}
                      <span className="text-gray-500">Output: </span>
                      {ex.output}
                      {ex.explanation && `\nExplanation: ${ex.explanation}`}
                    </pre>
                  </div>
                ))}
              </div>
            )}

            {q.constraints?.length > 0 && (
              <div
                className="rounded-xl p-4"
                style={{ background: "#161b22", border: "1px solid #30363d" }}
              >
                <p className="mb-2 text-[10px] font-bold uppercase tracking-wider text-gray-500">
                  Constraints
                </p>
                <ul className="flex flex-col gap-1 m-0 p-0 list-none">
                  {q.constraints.map((c, i) => (
                    <li
                      key={i}
                      className="text-[12px] text-gray-300 flex gap-2"
                    >
                      <span style={{ color: "#a78bfa" }}>•</span>
                      {c}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        ) : (
          <div className="flex h-40 items-center justify-center">
            <div
              className="h-5 w-5 animate-spin rounded-full border-2"
              style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }}
            />
          </div>
        )}
      </div>

      {/* Footer */}
      <div
        className="shrink-0 border-t p-4 flex gap-2"
        style={{ borderColor: "#30363d", background: "#161b22" }}
      >
        <button
          onClick={onPrev}
          disabled={qIndex === 0}
          className="flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
          style={{
            background: "#21262d",
            border: "1px solid #30363d",
            color: "#e6edf3",
          }}
        >
          <ChevronLeft size={14} strokeWidth={2} /> Prev
        </button>
        <button
          onClick={isLast ? onFinish : onNext}
          className="flex-1 flex items-center justify-center gap-2 rounded-xl py-2.5 text-sm font-semibold text-white"
          style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
        >
          {isLast ? (
            <>
              <CheckCircle size={14} strokeWidth={2} /> Finish &amp; Get Report
            </>
          ) : (
            <>
              Next Problem <ChevronRight size={14} strokeWidth={2} />
            </>
          )}
        </button>
      </div>
    </div>
  );
}

// ─── Feedback toast ───────────────────────────────────────────────────────────
function FeedbackToast({ feedback, onClose }) {
  return (
    <AnimatePresence>
      {feedback && (
        <motion.div
          initial={{ y: 80, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 80, opacity: 0 }}
          transition={{ type: "spring", damping: 26, stiffness: 260 }}
          className="absolute bottom-4 left-4 right-4 rounded-2xl p-4 shadow-2xl z-10 flex gap-3"
          style={{ background: "#161b22", border: "1px solid #30363d" }}
        >
          <div
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg"
            style={{ background: "#7c3aed22" }}
          >
            <BarChart3 size={14} style={{ color: "#a78bfa" }} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p className="text-[12px] font-semibold text-white">
                AI Feedback
              </p>
              {typeof feedback.score === "number" && (
                <span
                  className="text-[11px] font-bold"
                  style={{ color: "#a78bfa" }}
                >
                  {feedback.score}/100
                </span>
              )}
            </div>
            <p className="text-[12px] leading-relaxed text-gray-400">
              {feedback.feedback}
            </p>
          </div>
          <button
            onClick={onClose}
            className="shrink-0 text-gray-500 hover:text-gray-300"
          >
            <X size={14} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Main ─────────────────────────────────────────────────────────────────────
export default function DSARoomPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  const [session, setSession] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [qIndex, setQIndex] = useState(0);
  const [lang, setLang] = useState(LANGUAGES[0]);
  const [code, setCode] = useState(LANGUAGES[0].starter);
  const [codeMap, setCodeMap] = useState({});
  const [output, setOutput] = useState("");
  const [running, setRunning] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [booting, setBooting] = useState(true);
  const [errorState, setErrorState] = useState(null);
  const [ending, setEnding] = useState(false);
  const [elapsed, setElapsed] = useState(0);
  const [langOpen, setLangOpen] = useState(false);

  const bootedRef = useRef(false);
  const sessionIdRef = useRef(id === "start" ? null : id);
  const timerRef = useRef(null);

  const [panelWidth, setPanelWidth] = useState(360);
  const dragRef = useRef(null);

  // Resizable divider
  function startDrag(e) {
    e.preventDefault();
    const startX = e.clientX;
    const startW = panelWidth;
    function onMove(ev) {
      const newW = Math.max(260, Math.min(580, startW + ev.clientX - startX));
      setPanelWidth(newW);
    }
    function onUp() {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseup", onUp);
    }
    window.addEventListener("mousemove", onMove);
    window.addEventListener("mouseup", onUp);
  }

  // Timer
  useEffect(() => {
    timerRef.current = setInterval(() => setElapsed((e) => e + 1), 1000);
    return () => clearInterval(timerRef.current);
  }, []);

  // Boot
  useEffect(() => {
    if (bootedRef.current) return;
    bootedRef.current = true;
    const routeState = location.state ?? {};

    async function boot() {
      try {
        let sess;
        if (id === "start") {
          const { trackId, role, level } = routeState;
          if (!trackId) {
            setErrorState({
              isLimit: false,
              title: "No DSA track selected",
              message: "Please go back and choose a DSA track before starting.",
              hint: "Your setup was missing the selected track.",
            });
            setBooting(false);
            return;
          }
          const data = await api.post("/api/interviews", {
            trackId,
            role,
            level,
          });
          sess = data.session;
          sessionIdRef.current = sess.id;
          navigate(`/app/dsa/${sess.id}`, { replace: true, state: null });
        } else {
          const data = await api.get(`/api/interviews/${id}`);
          sess = data.session;
          sessionIdRef.current = sess.id;
          if (sess.status === "completed") {
            navigate(`/app/reports/${sess.id}`, { replace: true });
            return;
          }
        }
        setSession(sess);
        setQuestions((sess.questions ?? []).map(normaliseQuestion));
        setQIndex(sess.currentQuestionIndex ?? 0);
        setBooting(false);
      } catch (err) {
        setErrorState(getBootErrorState(err));
        setBooting(false);
      }
    }
    boot();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  function switchLang(l) {
    setCodeMap((prev) => ({ ...prev, [lang.id]: code }));
    setLang(l);
    setCode(codeMap[l.id] ?? l.starter);
    setLangOpen(false);
  }

  async function handleRun() {
    if (!code.trim()) return;
    setRunning(true);
    setOutput("Running your code…");

    try {
      const data = await api.post("/api/run", { code, languageId: lang.id });

      const { stdout, stderr, compileErr, exitCode } = data;

      if (compileErr) {
        setOutput(`❌  Compilation Error\n${"─".repeat(40)}\n${compileErr}`);
      } else if (exitCode !== 0 && stderr) {
        setOutput(`💥  Runtime Error\n${"─".repeat(40)}\n${stderr}`);
      } else {
        setOutput(
          `✅  Ran successfully\n` +
            "─".repeat(40) +
            "\n" +
            (stdout || "(no output — add a print/console.log to see results)"),
        );
      }
    } catch (err) {
      setOutput(
        `❌  Error: ${err instanceof ApiError ? err.message : err.message}`,
      );
    } finally {
      setRunning(false);
    }
  }

  async function sendAnswer(codeToSend) {
    const sid = sessionIdRef.current;
    if (!sid) return;
    const answerText = `Language: ${lang.label}\n\nCode:\n\`\`\`${lang.id}\n${codeToSend}\n\`\`\``;
    const data = await api.post(`/api/interviews/${sid}/answer`, {
      answer: answerText,
      usedVoice: false,
    });
    return data;
  }

  async function handleSubmit() {
    if (submitting || !code.trim()) return;
    setSubmitting(true);
    setFeedback(null);
    try {
      const data = await sendAnswer(code);
      setFeedback({ score: data.score, feedback: data.feedback });
      if (data.isComplete) {
        clearInterval(timerRef.current);
        setEnding(true);
        await api.post(`/api/interviews/${sessionIdRef.current}/complete`, {});
        navigate(`/app/reports/${sessionIdRef.current}`, { replace: true });
        return;
      }
      setTimeout(() => {
        setFeedback(null);
        setQIndex((p) => p + 1);
        setCode(lang.starter);
        setOutput("");
      }, 3500);
    } catch (err) {
      setOutput(
        `Error: ${err instanceof ApiError ? err.message : "Submission failed."}`,
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function handleNext() {
    try {
      // Save current code before moving forward
      setCodeMap((prev) => ({ ...prev, [`q_${qIndex}_${lang.id}`]: code }));
      const data = await sendAnswer(
        code.trim() || "// No code submitted — skipped",
      );
      if (data.isComplete) {
        clearInterval(timerRef.current);
        setEnding(true);
        await api.post(`/api/interviews/${sessionIdRef.current}/complete`, {});
        navigate(`/app/reports/${sessionIdRef.current}`, { replace: true });
        return;
      }
      setQIndex((p) => p + 1);
      setCode(lang.starter);
      setOutput("");
      setFeedback(null);
    } catch (err) {
      console.error(err);
    }
  }

  function handlePrev() {
    if (qIndex === 0) return;
    // Save current code for this question index
    setCodeMap((prev) => ({ ...prev, [`q_${qIndex}_${lang.id}`]: code }));
    const prevIndex = qIndex - 1;
    setQIndex(prevIndex);
    // Restore saved code for the previous question, or fall back to starter
    setCode(codeMap[`q_${prevIndex}_${lang.id}`] ?? lang.starter);
    setOutput("");
    setFeedback(null);
  }

  async function handleFinish() {
    if (ending) return;
    clearInterval(timerRef.current);
    setEnding(true);
    try {
      await api.post(`/api/interviews/${sessionIdRef.current}/complete`, {});
    } catch {
      /**/
    }
    navigate(`/app/reports/${sessionIdRef.current}`, { replace: true });
  }

  // ── Full-screen loading/error states (dark themed) ────────────────────────
  const darkCenter = (content) => (
    <div
      className="fixed inset-0 flex items-center justify-center flex-col gap-4"
      style={{ background: "#0d1117" }}
    >
      {content}
    </div>
  );

  if (booting)
    return darkCenter(
      <>
        <div
          className="h-6 w-6 animate-spin rounded-full border-2"
          style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }}
        />
        <p className="text-sm text-gray-400">Loading your DSA interview…</p>
      </>,
    );

  if (ending)
    return darkCenter(
      <>
        <div
          className="h-6 w-6 animate-spin rounded-full border-2"
          style={{ borderColor: "#7c3aed", borderTopColor: "transparent" }}
        />
        <p className="text-sm text-gray-400">Generating your report…</p>
      </>,
    );

  if (errorState)
    return darkCenter(
      <>
        <p
          className="text-sm font-semibold max-w-md text-center"
          style={{ color: errorState.isLimit ? "#fbbf24" : "#f87171" }}
        >
          {errorState.title}
        </p>
        <p className="text-sm max-w-md text-center text-gray-300">
          {errorState.message}
        </p>
        <p className="text-xs max-w-md text-center text-gray-500">
          {errorState.hint}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate("/app/interviews/new")}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{ background: "#7c3aed" }}
          >
            Back to Interview Setup
          </button>
          {errorState.isLimit && (
            <button
              onClick={() => window.location.assign("/#pricing")}
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
              style={{
                borderColor: "#7c3aed66",
                color: "#c4b5fd",
                background: "#7c3aed14",
              }}
            >
              View Pricing
            </button>
          )}
        </div>
      </>,
    );

  const currentQ = questions[qIndex];
  const isLast = qIndex >= questions.length - 1;

  return (
    // fixed inset-0 = true full viewport, no parent height issues
    <div
      className="fixed inset-0 flex flex-col overflow-hidden"
      style={{ background: "#0d1117" }}
    >
      {/* ── Top bar ─────────────────────────────────────────────── */}
      <div
        className="flex shrink-0 items-center gap-6 border-b px-5 py-2.5"
        style={{ background: "#161b22", borderColor: "#30363d" }}
      >
        {/* Logo + track */}
        <div className="flex items-center gap-2.5 min-w-0">
          <div
            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[11px] font-bold text-white"
            style={{ background: "#7c3aed" }}
          >
            IX
          </div>
          <div className="min-w-0">
            <p className="text-[13px] font-semibold text-white truncate">
              {session?.trackTitle ?? "DSA Interview"}
            </p>
            <p className="text-[11px] text-gray-500">{session?.level}</p>
          </div>
        </div>

        {/* Timer */}
        <div className="flex items-center gap-1.5 text-[12px] text-gray-400 shrink-0">
          <Clock size={12} />
          <span className={elapsed > 3600 ? "text-red-400" : ""}>
            {fmtTime(elapsed)}
          </span>
        </div>

        {/* Question counter */}
        <span
          className="shrink-0 text-[11px] font-medium px-2.5 py-1 rounded-full"
          style={{
            background: "#7c3aed22",
            color: "#a78bfa",
            border: "1px solid #7c3aed44",
          }}
        >
          {qIndex + 1} / {questions.length}
        </span>

        <div className="flex-1" />

        {/* Language picker */}
        <div className="relative shrink-0">
          <button
            onClick={() => setLangOpen((v) => !v)}
            className="flex items-center gap-2 rounded-lg border px-3 py-1.5 text-[12px] font-medium"
            style={{
              background: "#21262d",
              borderColor: "#30363d",
              color: "#e6edf3",
            }}
          >
            {lang.label} <ChevronDown size={12} />
          </button>
          <AnimatePresence>
            {langOpen && (
              <motion.div
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                className="absolute right-0 top-full mt-1 z-30 rounded-xl border py-1 shadow-2xl"
                style={{
                  background: "#161b22",
                  borderColor: "#30363d",
                  minWidth: "140px",
                }}
              >
                {LANGUAGES.map((l) => (
                  <button
                    key={l.id}
                    onClick={() => switchLang(l)}
                    className="w-full px-4 py-2 text-left text-[12px] transition-colors hover:bg-[#21262d]"
                    style={{ color: lang.id === l.id ? "#a78bfa" : "#e6edf3" }}
                  >
                    {l.label}
                  </button>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Buttons */}
        <button
          onClick={() => {
            setCode(lang.starter);
            setOutput("");
          }}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium"
          style={{
            background: "#21262d",
            borderColor: "#30363d",
            color: "#8b949e",
          }}
        >
          <RotateCcw size={11} strokeWidth={2} /> Reset
        </button>

        <button
          onClick={handleRun}
          disabled={running}
          className="flex shrink-0 items-center gap-1.5 rounded-lg border px-3 py-1.5 text-[12px] font-medium disabled:opacity-50"
          style={{
            background: "#21262d",
            borderColor: "#238636",
            color: "#3fb950",
          }}
        >
          <Play size={11} strokeWidth={2.5} fill="#3fb950" />
          {running ? "Running…" : "Run"}
        </button>

        <button
          onClick={handleSubmit}
          disabled={submitting || !code.trim()}
          className="flex shrink-0 items-center gap-1.5 rounded-lg px-4 py-1.5 text-[12px] font-semibold text-white disabled:opacity-50"
          style={{ background: "linear-gradient(135deg, #7c3aed, #9333ea)" }}
        >
          {submitting ? "Submitting…" : "Submit"}
        </button>
      </div>

      {/* ── Body ────────────────────────────────────────────────── */}
      <div className="flex flex-1 min-h-0">
        {/* Problem panel — resizable width */}
        <div
          className="shrink-0 flex flex-col min-h-0"
          style={{ width: panelWidth }}
        >
          <ProblemPanel
            q={currentQ}
            qIndex={qIndex}
            total={questions.length}
            onPrev={handlePrev}
            onNext={handleNext}
            onFinish={handleFinish}
            isLast={isLast}
          />
        </div>

        {/* Drag handle */}
        <div
          ref={dragRef}
          onMouseDown={startDrag}
          className="group relative shrink-0 flex items-center justify-center cursor-col-resize z-10 select-none"
          style={{
            width: "6px",
            background: "#161b22",
            borderLeft: "1px solid #30363d",
            borderRight: "1px solid #30363d",
          }}
          title="Drag to resize"
        >
          {/* Visual grip dots */}
          <div className="flex flex-col gap-1 opacity-40 group-hover:opacity-100 transition-opacity">
            {[0, 1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-1 w-1 rounded-full"
                style={{ background: "#a78bfa" }}
              />
            ))}
          </div>
          {/* Hover highlight */}
          <div
            className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "#7c3aed22" }}
          />
        </div>

        {/* Editor + output */}
        <div className="flex flex-1 min-h-0 min-w-0 flex-col">
          {/* Monaco */}
          <div className="relative flex-1 min-h-0">
            <Editor
              height="100%"
              language={lang.monaco}
              value={code}
              onChange={(v) => setCode(v ?? "")}
              theme="vs-dark"
              options={{
                fontSize: 14,
                fontFamily:
                  "'JetBrains Mono','Fira Code','Cascadia Code',monospace",
                fontLigatures: true,
                minimap: { enabled: false },
                lineNumbers: "on",
                scrollBeyondLastLine: false,
                wordWrap: "on",
                tabSize: 2,
                automaticLayout: true,
                padding: { top: 16, bottom: 16 },
                smoothScrolling: true,
                cursorBlinking: "smooth",
                bracketPairColorization: { enabled: true },
              }}
            />
            <FeedbackToast
              feedback={feedback}
              onClose={() => setFeedback(null)}
            />
          </div>

          {/* Output console */}
          <div
            className="shrink-0 flex flex-col border-t"
            style={{ borderColor: "#30363d", height: "140px" }}
          >
            <div
              className="flex items-center gap-3 border-b px-4 py-2 shrink-0"
              style={{ borderColor: "#30363d", background: "#161b22" }}
            >
              <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-400">
                Output
              </span>
              {output && (
                <button
                  onClick={() => setOutput("")}
                  className="ml-auto text-[10px] text-gray-500 hover:text-gray-300"
                >
                  Clear
                </button>
              )}
            </div>
            <div
              className="flex-1 overflow-y-auto px-4 py-3"
              style={{ background: "#0d1117" }}
            >
              {output ? (
                <pre
                  className="text-[12px] leading-relaxed text-gray-300 whitespace-pre-wrap"
                  style={{ fontFamily: "'Fira Code',monospace" }}
                >
                  {output}
                </pre>
              ) : (
                <p className="text-[12px] text-gray-600">
                  Click <span className="text-green-500">Run</span> to test ·{" "}
                  <span style={{ color: "#a78bfa" }}>Submit</span> for AI
                  feedback
                </p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
