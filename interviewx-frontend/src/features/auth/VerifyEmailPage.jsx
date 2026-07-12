import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { motion } from "framer-motion";
import { CheckCircle, AlertCircle, Loader } from "lucide-react";
import { api, ApiError } from "@/shared/lib/api.js";
import { RoutePaths } from "@/app/routes/paths.js";
import { useAuth } from "@/app/providers/useAuth.js";

export default function VerifyEmailPage() {
  const [searchParams] = useSearchParams();
  const { user, updateProfile } = useAuth();
  const token = searchParams.get("token") ?? "";

  const [status, setStatus] = useState("loading"); // "loading" | "success" | "error"
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("No verification token found in the URL.");
      return;
    }

    let cancelled = false;

    api
      .post("/api/auth/verify-email", { token }, { auth: false })
      .then((data) => {
        if (cancelled) return;
        setStatus("success");
        setMessage(data.message ?? "Email verified.");
        // If the user is currently logged in, refresh their profile so
        // emailVerified flips to true in the AuthContext without re-login.
        if (user && typeof updateProfile === "function") {
          // updateProfile does a PUT /api/profile — instead just call /me
          // by triggering a page-level no-op; simplest is a forced reload,
          // but we can do it cleanly via the api:
          api.get("/api/auth/me").then(({ user: u }) => {
            if (!cancelled && u) updateProfile({}).catch(() => {});
          });
        }
      })
      .catch((err) => {
        if (cancelled) return;
        setStatus("error");
        setMessage(
          err instanceof ApiError
            ? err.message
            : "Verification failed. Please try again.",
        );
      });

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center px-4 py-12"
      style={{ background: "var(--color-bg)" }}
    >
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.45 }}
        className="w-full max-w-md"
      >
        <div
          className="rounded-2xl border p-8 text-center space-y-5"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-strong)",
          }}
        >
          {status === "loading" && (
            <>
              <div
                className="mx-auto h-6 w-6 animate-spin rounded-full border-2"
                style={{
                  borderColor: "var(--color-accent)",
                  borderTopColor: "transparent",
                }}
              />
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                Verifying your email…
              </p>
            </>
          )}

          {status === "success" && (
            <>
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
                  Email verified!
                </h2>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Your email address has been confirmed. Your account is fully
                  active.
                </p>
              </div>
              <Link
                to={user ? RoutePaths.appRoot : RoutePaths.login}
                className="inline-block rounded-xl px-6 py-2.5 text-sm font-semibold text-white"
                style={{
                  background:
                    "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                }}
              >
                {user ? "Go to dashboard" : "Log in"}
              </Link>
            </>
          )}

          {status === "error" && (
            <>
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
              <div>
                <h2
                  className="text-xl font-bold"
                  style={{ color: "var(--color-text-invert)" }}
                >
                  Verification failed
                </h2>
                <p
                  className="mt-2 text-sm leading-relaxed"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {message}
                </p>
              </div>
              <div className="flex flex-col items-center gap-3">
                {user && <ResendButton />}
                <Link
                  to={RoutePaths.login}
                  className="text-sm font-medium"
                  style={{ color: "var(--color-accent)" }}
                >
                  Back to login
                </Link>
              </div>
            </>
          )}
        </div>
      </motion.div>
    </div>
  );
}

// Small inline component so it can call hooks freely
function ResendButton() {
  const [sent, setSent] = useState(false);
  const [loading, setLoading] = useState(false);

  async function resend() {
    setLoading(true);
    try {
      await api.post("/api/auth/resend-verification", {});
      setSent(true);
    } catch {
      // swallow — user will see the button again
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <p className="text-sm" style={{ color: "var(--color-success)" }}>
        New verification email sent — check your inbox.
      </p>
    );
  }

  return (
    <button
      onClick={resend}
      disabled={loading}
      className="rounded-xl px-5 py-2.5 text-sm font-semibold text-white disabled:opacity-50"
      style={{
        background:
          "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
      }}
    >
      {loading ? "Sending…" : "Resend verification email"}
    </button>
  );
}
