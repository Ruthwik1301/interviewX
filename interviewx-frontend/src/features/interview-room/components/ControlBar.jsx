import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic, MicOff, Send, Square, ChevronRight } from "lucide-react";

export default function ControlBar({
  isListening,
  onToggleListen,
  onSend,
  onEnd,
  isAiTyping,
  isIntroPhase,
}) {
  const [text, setText] = useState("");
  const [voiceUsed, setVoiceUsed] = useState(false);
  const textareaRef = useRef(null);

  // Listen for transcript events dispatched by InterviewRoomPage's
  // SpeechRecognition handler and append them into the textarea.
  useEffect(() => {
    function onTranscript(e) {
      setText((prev) => {
        const appended = prev ? `${prev} ${e.detail}` : e.detail;
        return appended.trim();
      });
      setVoiceUsed(true);
    }
    window.addEventListener("ix:transcript", onTranscript);
    return () => window.removeEventListener("ix:transcript", onTranscript);
  }, []);

  // When listening stops, if there's text that came from voice, auto-send it
  useEffect(() => {
    if (!isListening && voiceUsed && text.trim()) {
      const t = text.trim();
      setText("");
      setVoiceUsed(false);
      onSend(t, true); // second arg = usedVoice
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isListening]);

  function handleSend() {
    if (!text.trim() || isAiTyping) return;
    onSend(text.trim(), false);
    setText("");
    setVoiceUsed(false);
  }

  function handleKey(e) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  const placeholder = isIntroPhase
    ? isListening
      ? "Listening to your introduction…"
      : "Introduce yourself — type or click the mic to speak"
    : isListening
      ? "Listening… speak your answer"
      : "Type your answer, or click the mic to speak";

  return (
    <div
      className="shrink-0 rounded-2xl border p-4"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border-strong)",
      }}
    >
      {/* Mic pulse banner when listening */}
      <AnimatePresence>
        {isListening && (
          <motion.div
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            className="mb-3 flex items-center gap-2 overflow-hidden rounded-xl px-4 py-2.5"
            style={{
              background: "var(--color-error-bg)",
              border: "1px solid var(--color-error-border)",
            }}
          >
            <span className="relative flex h-2 w-2 shrink-0">
              <span
                className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                style={{ background: "var(--color-error)" }}
              />
              <span
                className="relative inline-flex h-2 w-2 rounded-full"
                style={{ background: "var(--color-error)" }}
              />
            </span>
            <p
              className="text-[12px] font-medium"
              style={{ color: "var(--color-error)" }}
            >
              Recording… click the mic again to stop and submit your answer
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex items-end gap-3">
        {/* Mic button */}
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onToggleListen}
          disabled={isAiTyping}
          className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border transition-colors focus:outline-none disabled:opacity-40"
          style={
            isListening
              ? {
                  background: "var(--color-error-bg)",
                  borderColor: "var(--color-error-border)",
                  color: "var(--color-error)",
                }
              : {
                  background: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text-muted)",
                }
          }
          aria-label={isListening ? "Stop recording" : "Start voice input"}
          title={isListening ? "Stop recording" : "Speak your answer"}
        >
          {isListening ? (
            <MicOff size={18} strokeWidth={2} />
          ) : (
            <Mic size={18} strokeWidth={2} />
          )}
        </motion.button>

        {/* Text area */}
        <div className="flex-1">
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={handleKey}
            placeholder={placeholder}
            disabled={isAiTyping}
            rows={2}
            className="w-full resize-none rounded-xl border px-4 py-3 text-sm leading-relaxed outline-none transition-colors placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-[color:var(--color-focus)] disabled:opacity-50"
            style={{
              background: "var(--color-surface-2)",
              borderColor: isListening
                ? "var(--color-error-border)"
                : "var(--color-border)",
              color: "var(--color-text)",
              fontFamily: "inherit",
            }}
          />
          <p
            className="mt-1 text-[11px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Press{" "}
            <kbd
              className="rounded px-1 py-0.5 text-[10px]"
              style={{ background: "var(--color-surface-3)" }}
            >
              Enter
            </kbd>{" "}
            to send ·{" "}
            <kbd
              className="rounded px-1 py-0.5 text-[10px]"
              style={{ background: "var(--color-surface-3)" }}
            >
              Shift+Enter
            </kbd>{" "}
            for new line
          </p>
        </div>

        {/* Send / Skip */}
        <div className="flex shrink-0 flex-col gap-2">
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={handleSend}
            disabled={!text.trim() || isAiTyping}
            className="flex h-11 w-11 items-center justify-center rounded-xl border transition-all focus:outline-none disabled:opacity-40"
            style={{
              background: "var(--color-accent)",
              borderColor: "var(--color-accent)",
              color: "#fff",
            }}
            aria-label="Send answer"
          >
            <Send size={16} strokeWidth={2} />
          </motion.button>

          {!isIntroPhase && (
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={() => onSend("__skip__", false)}
              disabled={isAiTyping}
              className="flex h-11 w-11 items-center justify-center rounded-xl border transition-colors focus:outline-none disabled:opacity-40"
              style={{
                background: "var(--color-surface-2)",
                borderColor: "var(--color-border)",
                color: "var(--color-text-muted)",
              }}
              aria-label="Skip question"
              title="Skip this question"
            >
              <ChevronRight size={16} strokeWidth={2} />
            </motion.button>
          )}
        </div>
      </div>

      <div className="mt-3 flex justify-end">
        <button
          onClick={onEnd}
          className="flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-[12px] font-medium transition-colors hover:bg-[color:var(--color-error-bg)] focus:outline-none"
          style={{ color: "var(--color-error)" }}
        >
          <Square size={11} strokeWidth={2.5} />
          End Session
        </button>
      </div>
    </div>
  );
}
