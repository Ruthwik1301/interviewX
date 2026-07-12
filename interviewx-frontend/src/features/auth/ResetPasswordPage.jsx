import { useState } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { KeyRound, Eye, EyeOff, CheckCircle, AlertCircle } from "lucide-react";
import { api, ApiError } from "@/shared/lib/api.js";
import { RoutePaths } from "@/app/routes/paths.js";

export default function ResetPasswordPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const token = searchParams.get("token") ?? "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [done, setDone] = useState(false);

  const mismatch = confirm.length > 0 && password !== confirm;
  const canSubmit =
    password.length >= 8 && password === confirm && token && !loading;

  async function handleSubmit(e) {
    e.preventDefault();
    if (!canSubmit) return;

    setError("");
    setLoading(true);
    try {
      await api.post(
        "/api/auth/reset-password",
        { token, password },
        { auth: false },
      );
      setDone(true);
      // Auto-redirect to login after 3 seconds
      setTimeout(() => navigate(RoutePaths.login, { replace: true }), 3000);
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

  // No token in URL — show a clear error
  if (!token) {
    return (
      <div
        className="flex min-h-screen w-full items-center justify-center px-4 py-12"
        style={{ background: "var(--color-bg)" }}
      >
        <div
          className="w-full max-w-md rounded-2xl border p-8 text-center space-y-4"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-strong)",
          }}
        >
          <div
            className="mx-auto flex h-14 w-14 items-center justify-center rounded-full"
            style={{ background: "var(--color-error-bg)" }}
          >
            <AlertCircle
              size={26}
              strokeWidth={1.8}
              style={{ color: "var(--color-error)" }}
            />
          </div>
          <h2
            className="text-xl font-bold"
            style={{ color: "var(--color-text-invert)" }}
          >
            Invalid reset link
          </h2>
          <p
            className="text-sm leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            This password reset link is missing or malformed. Please request a
            new one.
          </p>
          <Link
            to={RoutePaths.forgotPassword}
            className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white"
            style={{
              background:
                "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
            }}
          >
            Request new link
          </Link>
        </div>
      </div>
    );
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
        <div
          className="rounded-2xl border p-8"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-strong)",
          }}
        >
          <AnimatePresence mode="wait">
            {done ? (
              <motion.div
                key="done"
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
                    Password updated
                  </h2>
                  <p
                    className="mt-2 text-sm leading-relaxed"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Your password has been changed. Redirecting you to login…
                  </p>
                </div>
                <Link
                  to={RoutePaths.login}
                  className="inline-block text-sm font-medium"
                  style={{ color: "var(--color-accent)" }}
                >
                  Go to login now
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
                    <KeyRound
                      size={18}
                      strokeWidth={2}
                      style={{ color: "var(--color-accent)" }}
                    />
                  </div>
                  <h1
                    className="text-xl font-bold"
                    style={{ color: "var(--color-text-invert)" }}
                  >
                    Set a new password
                  </h1>
                  <p
                    className="mt-1 text-sm"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Must be at least 8 characters.
                  </p>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-4">
                  {/* New password */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="password"
                      className="block text-[13px] font-medium"
                      style={{ color: "var(--color-text-invert)" }}
                    >
                      New password
                    </label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPw ? "text" : "password"}
                        autoComplete="new-password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required
                        minLength={8}
                        placeholder="At least 8 characters"
                        className="w-full rounded-xl border px-4 py-2.5 pr-10 text-sm outline-none transition-colors focus:ring-2 focus:ring-[color:var(--color-focus)]"
                        style={{
                          background: "var(--color-surface-2)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text)",
                        }}
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw((v) => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2"
                        style={{ color: "var(--color-text-muted)" }}
                        tabIndex={-1}
                        aria-label={showPw ? "Hide password" : "Show password"}
                      >
                        {showPw ? (
                          <EyeOff size={15} strokeWidth={2} />
                        ) : (
                          <Eye size={15} strokeWidth={2} />
                        )}
                      </button>
                    </div>
                  </div>

                  {/* Confirm */}
                  <div className="space-y-1.5">
                    <label
                      htmlFor="confirm"
                      className="block text-[13px] font-medium"
                      style={{ color: "var(--color-text-invert)" }}
                    >
                      Confirm new password
                    </label>
                    <input
                      id="confirm"
                      type={showPw ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      required
                      placeholder="Re-enter your password"
                      className="w-full rounded-xl border px-4 py-2.5 text-sm outline-none transition-colors focus:ring-2 focus:ring-[color:var(--color-focus)]"
                      style={{
                        background: "var(--color-surface-2)",
                        borderColor: mismatch
                          ? "var(--color-error)"
                          : "var(--color-border)",
                        color: "var(--color-text)",
                      }}
                    />
                    <AnimatePresence>
                      {mismatch && (
                        <motion.p
                          initial={{ opacity: 0, y: -4 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0 }}
                          className="text-[12px]"
                          style={{ color: "var(--color-error)" }}
                        >
                          Passwords don't match
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* API error */}
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
                    disabled={!canSubmit}
                    className="w-full rounded-xl py-2.5 text-sm font-semibold text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                      boxShadow: canSubmit
                        ? "0 4px 20px rgba(124,58,237,0.25)"
                        : "none",
                    }}
                  >
                    {loading ? "Updating…" : "Update password"}
                  </button>
                </form>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
}
