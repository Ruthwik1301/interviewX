import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Mail, ArrowLeft, CheckCircle } from "lucide-react";
import { api, ApiError } from "@/shared/lib/api.js";
import { RoutePaths } from "@/app/routes/paths.js";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [sent, setSent] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!email.trim()) return;

    setError("");
    setLoading(true);
    try {
      await api.post(
        "/api/auth/forgot-password",
        { email: email.trim() },
        { auth: false },
      );
      setSent(true);
    } catch (err) {
      setError(
        err instanceof ApiError
          ? err.message
          : "Something went wrong. Please try again.",
      );
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-md"
      >
        {/* Card */}
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-strong)",
          }}
        >
          <AnimatePresence mode="wait">
            {sent ? (
              <motion.div
                key="sent"
                initial={{ opacity: 0, scale: 0.96 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.35 }}
                className="text-center space-y-4"
              >
                <div
                  className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
                  style={{ background: "var(--color-success-bg)" }}
                >
                  <CheckCircle
                    size={26}
                    strokeWidth={1.8}
                    style={{ color: "var(--color-success)" }}
                  />
                </div>
                <div>
                  <h2
                    className="text-xl font-bold"
                    style={{ color: "var(--color-text-invert)" }}
                  >
                    Check your inbox
                  </h2>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    If an account with <strong>{email}</strong> exists, we've
                    sent a password-reset link. It expires in 1 hour.
                  </p>
                </div>
                <Link
                  to={RoutePaths.login}
                  className="inline-flex items-center gap-1.5 text-sm font-medium"
                  style={{ color: "var(--color-accent)" }}
                >
                  <ArrowLeft size={14} strokeWidth={2} />
                  Back to login
                </Link>
              </motion.div>
            ) : (
              <motion.div
                key="form"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="space-y-6"
              >
                {/* Header */}
                <div>
                  <div
                    className="mb-4 flex h-10 w-10 items-center justify-center rounded-xl"
                    style={{ background: "var(--color-accent-bg)" }}
                  >
                    <Mail
                      size={18}
                      strokeWidth={2}
                      style={{ color: "var(--color-accent)" }}
                    />
                  </div>
                  <h1
                    className="text-xl font-bold"
                    style={{ color: "var(--color-text-invert)" }}
                  >
                    Forgot your password?
                  </h1>
                  <p
                    className="mt-1 text-sm leading-relaxed"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Enter your email and we'll send a reset link if an account
                    exists.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-1.5">
                    <label
                      htmlFor="email"
                      className="block text-[13px] font-medium"
                      style={{ color: "var(--color-text-invert)" }}
                    >
                      Email address
                    </label>
                    <input
                      id="email"
                      type="email"
                      autoComplete="email"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      placeholder="you@example.com"
                      className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[color:var(--color-focus)]"
                      style={{
                        background: "var(--color-surface-2)",
                        borderColor: error
                          ? "var(--color-error)"
                          : "var(--color-border)",
                        color: "var(--color-text)",
                      }}
                    />
                  </div>

                  {/* Error */}
                  <AnimatePresence>
                    {error && (
                      <motion.p
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-sm font-medium"
                        style={{ color: "var(--color-error)" }}
                      >
                        {error}
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <button
                    type="submit"
                    disabled={loading || !email.trim()}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                      boxShadow: "0 4px 20px rgba(124,58,237,0.25)",
                    }}
                  >
                    {loading ? "Sending…" : "Send reset link"}
                  </button>
                </form>

                <p
                  className="text-center text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Remember it?{" "}
                  <Link
                    to={RoutePaths.login}
                    className="font-medium"
                    style={{ color: "var(--color-accent)" }}
                  >
                    Log in
                  </Link>
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
