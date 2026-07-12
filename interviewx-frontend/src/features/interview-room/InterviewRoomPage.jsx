import { useEffect, useRef, useState } from "react";
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

function msgId() {
  return Math.random().toString(36).slice(2);
}

function fmtTime(date) {
  return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
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
  const [error, setError] = useState("");
  const [booting, setBooting] = useState(true); // waiting for session to exist
  const [ending, setEnding] = useState(false);

  // Stable ref to the live session ID (may start as "start" then get replaced)
  const sessionIdRef = useRef(id === "start" ? null : id);

  // ─── Boot: create or load the session ────────────────────────────────────
  useEffect(() => {
    // Key that's unique to this mount's intent. If id is "start" we use the
    // route-state trackId so StrictMode's second mount sees the same key and
    // skips. For real IDs we use the ID directly.
    const routeState = location.state ?? {};
    const flightKey =
      id === "start"
        ? `start:${routeState.trackId ?? "unknown"}`
        : `load:${id}`;

    if (inFlight.has(flightKey)) return; // StrictMode second mount — bail
    inFlight.add(flightKey);

    let cancelled = false;

    async function boot() {
      try {
        let sess;

        if (id === "start") {
          // Create a new session from route state set by CreateInterviewPage
          const { trackId, role, level } = routeState;
          if (!trackId) {
            setError(
              "No interview track selected. Please go back and choose one.",
            );
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

          // Replace the placeholder URL with the real session ID so refresh works
          navigate(`/app/interviews/${sess.id}`, {
            replace: true,
            state: null,
          });
        } else {
          // Resume / re-enter an existing session
          const data = await api.get(`/api/interviews/${id}`);
          if (cancelled) return;
          sess = data.session;
          sessionIdRef.current = sess.id;

          // If it's already done, send to the report instead
          if (sess.status === "completed") {
            navigate(`/app/reports/${sess.id}`, { replace: true });
            return;
          }
        }

        if (cancelled) return;

        // Hydrate local message list from transcript
        const hydratedMessages = (sess.transcript ?? []).map((m) => ({
          id: msgId(),
          role: m.role,
          text: m.content,
          time: fmtTime(new Date(m.timestamp ?? Date.now())),
        }));

        // Hydrate scores from already-answered questions
        const scores = (sess.answers ?? []).map((a) => a.score);
        const lastFb = sess.answers?.at(-1)?.feedback ?? "";

        setSession(sess);
        setMessages(hydratedMessages);
        setAnsweredScores(scores);
        setLastFeedback(lastFb);
        setBooting(false);
      } catch (err) {
        if (cancelled) return;
        setError(
          err instanceof ApiError
            ? err.message
            : "Something went wrong starting your session.",
        );
        setBooting(false);
      } finally {
        inFlight.delete(flightKey);
      }
    }

    boot();

    return () => {
      cancelled = true;
      // Don't delete from inFlight here — we want the second StrictMode mount
      // to still see the key until the async work is complete.
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // intentionally empty — boot runs exactly once per real mount

  // ─── Speech recognition (optional, degrades gracefully) ──────────────────
  const recognitionRef = useRef(null);

  function toggleListen() {
    if (
      !("webkitSpeechRecognition" in window || "SpeechRecognition" in window)
    ) {
      return; // browser unsupported — mic button just does nothing
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
      // Append to the ControlBar textarea via a custom event the ControlBar listens for
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

    // Optimistically add user message
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

      // score is null until batch scoring at session end — track answer count instead
      if (score !== null && score !== undefined)
        setAnsweredScores((prev) => [...prev, score]);
      else setAnsweredScores((prev) => [...prev, 0]); // placeholder
      setLastFeedback(feedback);

      if (isComplete) {
        // Show a "wrapping up" message, then complete
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

  // ─── End session early ────────────────────────────────────────────────────
  async function handleEnd() {
    const sid = sessionIdRef.current;
    if (!sid || ending) return;

    const hasAnswers = answeredScores.length > 0;
    if (!hasAnswers) {
      // Can't complete with zero answers — just go home
      navigate("/app", { replace: true });
      return;
    }

    setEnding(true);
    try {
      await api.post(`/api/interviews/${sid}/complete`, {});
      navigate(`/app/reports/${sid}`, { replace: true });
    } catch {
      // Even if complete fails, try to navigate — report page will poll
      navigate(`/app/reports/${sid}`, { replace: true });
    }
  }

  // ─── Render ───────────────────────────────────────────────────────────────
  if (booting) {
    return <Spinner label="Setting up your interview session…" />;
  }

  if (error) {
    return (
      <CenteredMessage>
        <p
          className="mb-4 text-sm font-semibold"
          style={{ color: "var(--color-error)" }}
        >
          {error}
        </p>
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
        {/* Header bar */}
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

        {/* Main two-column layout */}
        <div className="flex flex-1 min-h-0 gap-4 p-4 sm:p-5">
          {/* Transcript (left / main) */}
          <div className="flex flex-col flex-1 min-h-0 min-w-0 gap-4">
            <div className="flex-1 min-h-0">
              <TranscriptPanel
                messages={messages}
                isAiTyping={isAiTyping}
                isListening={isListening}
              />
            </div>
            <ControlBar
              isListening={isListening}
              onToggleListen={toggleListen}
              onSend={handleSend}
              onEnd={handleEnd}
              isAiTyping={isAiTyping}
            />
          </div>

          {/* Scorecard (right sidebar, hidden on small screens) */}
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
