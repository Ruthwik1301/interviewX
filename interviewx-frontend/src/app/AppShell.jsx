import { useState } from "react";
import { Outlet } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, X } from "lucide-react";
import Navbar from "@/shared/ui/Navbar/Navbar.jsx";
import { useAuth } from "@/app/providers/useAuth.js";
import { api } from "@/shared/lib/api.js";

function VerifyBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);

  async function resend() {
    setSending(true);
    try {
      await api.post("/api/auth/resend-verification", {});
      setSent(true);
    } catch {
      // fail silently — user can try again
    } finally {
      setSending(false);
    }
  }

  return (
    <AnimatePresence>
      {!dismissed && (
        <motion.div
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -8 }}
          transition={{ duration: 0.3 }}
          className="relative flex items-center justify-between gap-4 px-5 py-2.5"
          style={{
            background: "var(--color-accent-bg)",
            borderBottom: "1px solid var(--color-accent-border)",
          }}
        >
          <div className="flex items-center gap-2.5">
            <Mail
              size={14}
              strokeWidth={2}
              style={{ color: "var(--color-accent)", flexShrink: 0 }}
            />
            <p
              className="text-[13px]"
              style={{ color: "var(--color-text-invert)" }}
            >
              {sent ? (
                <span style={{ color: "var(--color-success)" }}>
                  Verification email sent — check your inbox.
                </span>
              ) : (
                <>
                  Please verify your email address to unlock all features.{" "}
                  <button
                    onClick={resend}
                    disabled={sending}
                    className="font-semibold underline underline-offset-2 disabled:opacity-50"
                    style={{ color: "var(--color-accent)" }}
                  >
                    {sending ? "Sending…" : "Resend email"}
                  </button>
                </>
              )}
            </p>
          </div>
          <button
            onClick={() => setDismissed(true)}
            className="shrink-0 rounded p-0.5 transition-colors hover:bg-[color:var(--color-surface-2)]"
            aria-label="Dismiss"
            style={{ color: "var(--color-text-muted)" }}
          >
            <X size={14} strokeWidth={2} />
          </button>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

export default function AppShell() {
  const { user } = useAuth();
  const showBanner = user && user.emailVerified === false;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <Navbar variant="app" />
      {showBanner && <VerifyBanner />}
      <div className="flex flex-1 w-full">
        <main className="flex-1 w-full min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
