import { useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Mic } from "lucide-react";

function TypingDots() {
  return (
    <div className="flex items-center gap-1 px-4 py-3">
      {[0, 0.15, 0.3].map((delay, i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full"
          style={{ background: "var(--color-accent)" }}
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay }}
        />
      ))}
    </div>
  );
}

export default function TranscriptPanel({ messages, isAiTyping, isListening }) {
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isAiTyping]);

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
            Live Transcript
          </span>
        </div>
        <AnimatePresence>
          {isListening && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.8 }}
              className="flex items-center gap-1.5 rounded-full px-2.5 py-1 text-[11px] font-semibold"
              style={{
                background: "var(--color-error-bg)",
                color: "var(--color-error)",
                border: "1px solid var(--color-error-border)",
              }}
            >
              <span className="relative flex h-1.5 w-1.5">
                <span
                  className="absolute inline-flex h-full w-full animate-ping rounded-full opacity-75"
                  style={{ background: "var(--color-error)" }}
                />
                <span
                  className="relative inline-flex h-1.5 w-1.5 rounded-full"
                  style={{ background: "var(--color-error)" }}
                />
              </span>
              <Mic size={10} strokeWidth={2.5} />
              Listening
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        <AnimatePresence initial={false}>
          {messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className={`flex items-start gap-3 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold"
                style={
                  msg.role === "ai"
                    ? { background: "var(--color-accent)", color: "#fff" }
                    : {
                        background: "var(--color-surface-3)",
                        color: "var(--color-text-muted)",
                      }
                }
              >
                {msg.role === "ai" ? "AI" : "You"}
              </div>
              <div
                className="max-w-[80%] px-4 py-3 text-sm leading-relaxed"
                style={
                  msg.role === "ai"
                    ? {
                        background: "var(--color-surface-3)",
                        color: "var(--color-text)",
                        borderRadius: "4px 16px 16px 16px",
                      }
                    : {
                        background: "var(--color-accent-bg)",
                        color: "var(--color-text)",
                        border: "1px solid var(--color-accent-border)",
                        borderRadius: "16px 4px 16px 16px",
                      }
                }
              >
                {msg.text}
                <div
                  className="mt-1 text-[10px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {msg.time}
                </div>
              </div>
            </motion.div>
          ))}
          {isAiTyping && (
            <motion.div
              key="typing"
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="flex items-start gap-3"
            >
              <div
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg text-[10px] font-bold text-white"
                style={{ background: "var(--color-accent)" }}
              >
                AI
              </div>
              <div
                className="rounded-xl"
                style={{
                  background: "var(--color-surface-3)",
                  borderRadius: "4px 16px 16px 16px",
                }}
              >
                <TypingDots />
              </div>
            </motion.div>
          )}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
}
