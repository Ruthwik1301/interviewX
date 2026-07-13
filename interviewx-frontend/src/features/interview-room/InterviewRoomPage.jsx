import { useEffect, useMemo, useRef, useState } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { api, ApiError } from "@/shared/lib/api.js";
import TranscriptPanel from "./components/TranscriptPanel";
import ScorecardPanel from "./components/ScorecardPanel";
import ControlBar from "./components/ControlBar";

// StrictMode in dev mounts → unmounts → remounts every component.
// A module-level set lets us track which "start" navigations are already
// in-flight so the second mount doesn't fire a second POST /api/interviews.
const inFlight = new Set();
const APTITUDE_TRACKS = [
  "numerical-reasoning",
  "logical-reasoning",
  "verbal-ability",
];

function msgId() {
  return Math.random().toString(36).slice(2);
}

function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function parseAptitudeQuestion(raw) {
  if (typeof raw === "object" && raw !== null) return raw;
  if (typeof raw !== "string") return null;

  const trimmed = raw.trim();
  if (!trimmed.startsWith("{")) return null;

  try {
    return JSON.parse(trimmed);
  } catch {
    return null;
  }
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

function Spinner({ label }) {
  return (
    <CenteredMessage>
      <div
        className="mx-auto mb-4 h-6 w-6 animate-spin rounded-full border-2"
        style={{
          borderColor: "var(--color-accent)",
          borderTopColor: "transparent",
        }}
      />
      <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
        {label}
      </p>
    </CenteredMessage>
  );
}

function AptitudePanel({ question, onChoose, disabled }) {
  if (!question) return null;

  const meta = [question.category, question.topic, question.difficulty]
    .filter(Boolean)
    .join(" · ");

  return (
    <div
      className="shrink-0 rounded-2xl border p-4 sm:p-5"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border-strong)",
      }}
    >
      <div className="mb-3">
        <p
          className="text-[11px] font-bold uppercase tracking-wider"
          style={{ color: "var(--color-text-muted)" }}
        >
          Aptitude Question
        </p>
        <p
          className="mt-1 text-sm font-semibold"
          style={{ color: "var(--color-text-invert)" }}
        >
          {question.title ?? "Question"}
        </p>
        {meta && (
          <p className="mt-1 text-[12px]" style={{ color: "var(--color-text-muted)" }}>
            {meta}
          </p>
        )}
      </div>

      <p
        className="mb-4 text-sm leading-relaxed"
        style={{ color: "var(--color-text)" }}
      >
        {question.question ?? question.description ?? ""}
      </p>

      {Array.isArray(question.options) && question.options.length > 0 && (
        <div className="grid grid-cols-1 gap-2">
          {question.options.map((option) => (
            <button
              key={option.id}
              type="button"
              onClick={() => onChoose(option.id)}
              disabled={disabled}
              className="rounded-xl border px-4 py-3 text-left text-sm transition-colors disabled:cursor-not-allowed disabled:opacity-60"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border)",
                color: "var(--color-text)",
              }}
            >
              <span
                className="mr-2 inline-flex min-w-6 font-semibold"
                style={{ color: "var(--color-accent)" }}
              >
                {option.id}.
              </span>
              {option.text}
            </button>
          ))}
        </div>
      )}

      <p className="mt-3 text-[11px]" style={{ color: "var(--color-text-muted)" }}>
        You can click an option, type the letter, or type the full answer text.
      </p>
    </div>
  );
}

function getBootErrorState(err) {
  if (err instanceof ApiError && err.status === 429) {
    return {
      isLimit: true,
      title: "Today's session limit reached",
      message: err.message,
      hint:
        "You can start another interview after the daily limit resets, or upgrade your plan for more sessions per day.",
    };
  }

  return {
    isLimit: false,
    title: "Couldn't start your interview",
    message:
      err instanceof ApiError
        ? err.message
        : "Something went wrong starting your session.",
    hint: "Please go back and try again.",
  };
}

export default function InterviewRoomPage() {
  const { id } = useParams();
  const location = useLocation();
  const navigate = useNavigate();

  // ─── State ───────────────────────────────────────────────────────────────
  const [session, setSession] = useState(null);
  const [messages, setMessages] = useState([]);
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [answeredScores, setAnsweredScores] = useState([]);
  const [lastFeedback, setLastFeedback] = useState("");
  const [errorState, setErrorState] = useState(null);
  const [booting, setBooting] = useState(true); // waiting for session to exist
  const [ending, setEnding] = useState(false);

  // Stable ref to the live session ID (may start as "start" then get replaced)
  const sessionIdRef = useRef(id === "start" ? null : id);

  const isAptitude = APTITUDE_TRACKS.includes(session?.trackId);
  const currentAptitudeQuestion = useMemo(() => {
    if (!isAptitude || !session) return null;
    return parseAptitudeQuestion(
      session.questions?.[session.currentQuestionIndex] ?? null,
    );
  }, [isAptitude, session]);

  // ─── Boot: create or load the session ────────────────────────────────────
  useEffect(() => {
    const routeState = location.state ?? {};
    const flightKey =
      id === "start"
        ? `start:${routeState.trackId ?? "unknown"}`
        : `load:${id}`;

    if (inFlight.has(flightKey)) return;
    inFlight.add(flightKey);

    let cancelled = false;

    async function boot() {
      try {
        let sess;

        if (id === "start") {
          const { trackId, role, level } = routeState;
          if (!trackId) {
            setErrorState({
              isLimit: false,
              title: "No interview track selected",
              message: "Please go back and choose a track before starting.",
              hint: "Your setup was missing the selected track.",
            });
            setBooting(false);
            inFlight.delete(flightKey);
            return;
          }

          const data = await api.post("/api/interviews", {
            trackId,
            role,
            level,
          });
          if (cancelled) return;

          sess = data.session;
          sessionIdRef.current = sess.id;

          navigate(`/app/interviews/${sess.id}`, {
            replace: true,
            state: null,
          });
        } else {
          const data = await api.get(`/api/interviews/${id}`);
          if (cancelled) return;
          sess = data.session;
          sessionIdRef.current = sess.id;

          if (sess.status === "completed") {
            navigate(`/app/reports/${sess.id}`, { replace: true });
            return;
          }
        }

        if (cancelled) return;

        const hydratedMessages = (sess.transcript ?? []).map((m) => ({
          id: msgId(),
          role: m.role,
          text: m.content,
          time: fmtTime(new Date(m.timestamp ?? Date.now())),
        }));

        const scores = (sess.answers ?? []).map((a) => a.score);
        const lastFb = sess.answers?.at(-1)?.feedback ?? "";

        setSession(sess);
        setMessages(hydratedMessages);
        setAnsweredScores(scores);
        setLastFeedback(lastFb);
        setBooting(false);
      } catch (err) {
        if (cancelled) return;
        setErrorState(getBootErrorState(err));
        setBooting(false);
      } finally {
        inFlight.delete(flightKey);
      }
    }

    boot();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ─── Speech recognition (optional, degrades gracefully) ──────────────────
  const recognitionRef = useRef(null);

  function toggleListen() {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      return;
    }

    if (isListening) {
      recognitionRef.current?.stop();
      setIsListening(false);
      return;
    }

    const SR = window.SpeechRecognition ?? window.webkitSpeechRecognition;
    const rec = new SR();
    rec.continuous = true;
    rec.interimResults = false;
    rec.lang = "en-US";
    rec.onresult = (e) => {
      const transcript = Array.from(e.results)
        .map((r) => r[0].transcript)
        .join(" ");
      window.dispatchEvent(
        new CustomEvent("ix:transcript", { detail: transcript }),
      );
    };
    rec.onend = () => setIsListening(false);
    rec.start();
    recognitionRef.current = rec;
    setIsListening(true);
  }

  // ─── Send an answer ───────────────────────────────────────────────────────
  async function handleSend(text) {
    if (!session || isAiTyping) return;
    const sid = sessionIdRef.current;
    if (!sid) return;

    const isSkip = text === "__skip__";
    const displayText = isSkip ? "(skipped)" : text;

    const userMsg = {
      id: msgId(),
      role: "user",
      text: displayText,
      time: fmtTime(new Date()),
    };
    setMessages((prev) => [...prev, userMsg]);
    setIsAiTyping(true);

    try {
      const payload = isSkip ? "I'd like to skip this question." : text;
      const data = await api.post(`/api/interviews/${sid}/answer`, {
        answer: payload,
      });

      const { score, feedback, nextQuestion, isComplete } = data;

      if (score !== null && score !== undefined) {
        setAnsweredScores((prev) => [...prev, score]);
      } else {
        setAnsweredScores((prev) => [...prev, 0]);
      }
      setLastFeedback(feedback);

      if (isComplete) {
        const doneMsg = {
          id: msgId(),
          role: "ai",
          text: "Great work — you've answered all the questions! Generating your report now…",
          time: fmtTime(new Date()),
        };
        setMessages((prev) => [...prev, doneMsg]);
        setIsAiTyping(false);
        setEnding(true);

        await api.post(`/api/interviews/${sid}/complete`, {});
        navigate(`/app/reports/${sid}`, { replace: true });
        return;
      }

      if (nextQuestion) {
        const aiMsg = {
          id: msgId(),
          role: "ai",
          text: nextQuestion,
          time: fmtTime(new Date()),
        };
        setMessages((prev) => [...prev, aiMsg]);
        setSession((prev) =>
          prev
            ? { ...prev, currentQuestionIndex: prev.currentQuestionIndex + 1 }
            : prev,
        );
      }
    } catch (err) {
      const errMsg = {
        id: msgId(),
        role: "ai",
        text:
          err instanceof ApiError
            ? `Error: ${err.message}`
            : "Something went wrong submitting your answer. Please try again.",
        time: fmtTime(new Date()),
      };
      setMessages((prev) => [...prev, errMsg]);
    } finally {
      setIsAiTyping(false);
    }
  }

  async function handleEnd() {
    const sid = sessionIdRef.current;
    if (!sid || ending) return;

    const hasAnswers = answeredScores.length > 0;
    if (!hasAnswers) {
      navigate("/app", { replace: true });
      return;
    }

    setEnding(true);
    try {
      await api.post(`/api/interviews/${sid}/complete`, {});
      navigate(`/app/reports/${sid}`, { replace: true });
    } catch {
      navigate(`/app/reports/${sid}`, { replace: true });
    }
  }

  if (booting) {
    return <Spinner label="Setting up your interview session…" />;
  }

  if (errorState) {
    return (
      <CenteredMessage>
        <p
          className="mb-2 text-base font-semibold"
          style={{
            color: errorState.isLimit
              ? "var(--color-warning)"
              : "var(--color-error)",
          }}
        >
          {errorState.title}
        </p>
        <p className="mb-2 text-sm" style={{ color: "var(--color-text)" }}>
          {errorState.message}
        </p>
        <p
          className="mb-5 text-xs leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {errorState.hint}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <button
            onClick={() => navigate("/app/interviews/new")}
            className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
            }}
          >
            Back to Interview Setup
          </button>
          {errorState.isLimit && (
            <button
              onClick={() => window.location.assign("/#pricing")}
              className="rounded-xl border px-5 py-2.5 text-sm font-semibold"
              style={{
                borderColor: "var(--color-accent-border)",
                color: "var(--color-accent)",
                background: "var(--color-accent-bg)",
              }}
            >
              View Pricing
            </button>
          )}
        </div>
      </CenteredMessage>
    );
  }

  if (ending) {
    return <Spinner label="Generating your report… hang tight." />;
  }

  const questionNumber = session
    ? Math.min(session.currentQuestionIndex + 1, session.questions?.length ?? 1)
    : 1;
  const totalQuestions = session?.questions?.length ?? 5;

  return (
    <AnimatePresence>
      <motion.div
        key="room"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        className="flex h-full w-full flex-col"
        style={{ background: "var(--color-bg)" }}
      >
        <div
          className="shrink-0 border-b px-5 py-3 flex items-center justify-between"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border)",
          }}
        >
          <div className="flex items-center gap-3">
            <div
              className="flex h-7 w-7 items-center justify-center rounded-lg text-[11px] font-bold text-white"
              style={{ background: "var(--color-accent)" }}
            >
              IX
            </div>
            <div>
              <p
                className="text-sm font-semibold leading-none"
                style={{ color: "var(--color-text-invert)" }}
              >
                {session?.trackTitle ?? "Interview"}
              </p>
              <p
                className="mt-0.5 text-[11px]"
                style={{ color: "var(--color-text-muted)" }}
              >
                {session?.role} · {session?.level}
              </p>
            </div>
          </div>
          <span
            className="rounded-full border px-2.5 py-1 text-[11px] font-semibold"
            style={{
              background: "var(--color-accent-bg)",
              borderColor: "var(--color-accent-border)",
              color: "var(--color-accent)",
            }}
          >
            Live
          </span>
        </div>

        <div className="flex flex-1 min-h-0 gap-4 p-4 sm:p-5">
          <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4">
            <div className="flex-1 min-h-0">
              <TranscriptPanel
                messages={messages}
                isAiTyping={isAiTyping}
                isListening={isListening}
              />
            </div>
            {isAptitude && currentAptitudeQuestion && (
              <AptitudePanel
                question={currentAptitudeQuestion}
                onChoose={(optionId) => handleSend(optionId)}
                disabled={isAiTyping}
              />
            )}
            <ControlBar
              isListening={isListening}
              onToggleListen={toggleListen}
              onSend={handleSend}
              onEnd={handleEnd}
              isAiTyping={isAiTyping}
              isIntroPhase={session?.introPhase}
            />
          </div>

          <div className="hidden lg:flex w-72 xl:w-80 shrink-0 flex-col min-h-0">
            <ScorecardPanel
              answeredScores={answeredScores}
              lastFeedback={lastFeedback}
              questionNumber={questionNumber}
              totalQuestions={totalQuestions}
            />
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
