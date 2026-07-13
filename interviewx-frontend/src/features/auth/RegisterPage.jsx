import { useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Eye, EyeOff, ArrowRight, Sparkles, Check } from "lucide-react";
import { RoutePaths } from "@/app/routes/paths";
import { useAuth } from "@/app/providers/useAuth.js";

const PERKS = [
  "No credit card required",
  "All interview tracks included",
  "Real-time AI feedback",
];

export default function RegisterPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const { register, loginWithGoogle } = useAuth();
  const [form, setForm] = useState({ name: "", email: "", password: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const query = new URLSearchParams(location.search);
  const hasTeamInvite = Boolean(query.get("teamInviteToken"));
  const inviteAwarePath = (path) =>
    hasTeamInvite ? `${path}${location.search}` : path;

  function update(field) {
    return (e) => setForm((prev) => ({ ...prev, [field]: e.target.value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    if (!form.name || !form.email || !form.password) {
      setError("Please fill in all fields.");
      return;
    }
    if (form.password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    setError("");
    setLoading(true);
    try {
      await register({
        name: form.name,
        email: form.email,
        password: form.password,
      });
      navigate(RoutePaths.appRoot, { replace: true });
    } catch (err) {
      setError(err.message || "Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div
      className="flex min-h-full w-full items-center justify-center px-4 py-16"
      style={{ background: "var(--color-bg)" }}
    >
      {/* Background glow */}
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 z-0"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.1) 0%, transparent 70%)",
        }}
      />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
        className="relative z-10 w-full max-w-[420px]"
      >
        <div
          className="overflow-hidden rounded-2xl border p-8"
          style={{
            background: "var(--color-surface-1)",
            borderColor: "var(--color-border-strong)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.2)",
          }}
        >
          {/* Logo */}
          <div className="mb-8 flex flex-col items-center text-center">
            <NavLink
              to={RoutePaths.root}
              className="mb-5 inline-flex items-center gap-2 text-[15px] font-semibold tracking-tight"
              style={{ color: "var(--color-text-invert)" }}
            >
              <span
                className="flex h-7 w-7 items-center justify-center rounded-lg text-[12px] font-bold text-white"
                style={{ background: "var(--color-accent)" }}
              >
                IX
              </span>
              InterviewX
            </NavLink>
            <h1
              className="text-xl font-bold"
              style={{ color: "var(--color-text-invert)", margin: 0 }}
            >
              Create your account
            </h1>
            <p
              className="mt-1.5 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Start practicing free — no credit card needed
            </p>
          </div>

          {/* Perks */}
          <div className="mb-6 flex flex-wrap justify-center gap-3">
            {PERKS.map((perk) => (
              <span
                key={perk}
                className="flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] font-medium"
                style={{
                  background: "var(--color-success-bg)",
                  borderColor: "var(--color-success-border)",
                  color: "var(--color-success)",
                }}
              >
                <Check size={10} strokeWidth={3} />
                {perk}
              </span>
            ))}
          </div>

          {/* Team invite context */}
          {hasTeamInvite && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border px-4 py-3 text-sm"
              style={{
                background: "var(--color-accent-bg)",
                borderColor: "var(--color-accent-border)",
                color: "var(--color-text)",
              }}
            >
              <p className="font-semibold" style={{ color: "var(--color-accent)" }}>
                Team invite detected
              </p>
              <p className="mt-1 leading-relaxed">
                Create your account with the invited email address. After you sign
                in, you'll be taken to the Profile page to accept the team
                invite.
              </p>
            </motion.div>
          )}

          {/* Error */}
          {error && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              className="mb-5 rounded-xl border px-4 py-3 text-sm"
              style={{
                background: "var(--color-error-bg)",
                borderColor: "var(--color-error-border)",
                color: "var(--color-error)",
              }}
            >
              {error}
            </motion.div>
          )}

          {/* Form */}
          <div className="space-y-4">
            {/* Name */}
            <div className="space-y-1.5">
              <label
                className="text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                Full Name
              </label>
              <input
                type="text"
                value={form.name}
                onChange={update("name")}
                placeholder="Jane Smith"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-[color:var(--color-focus)]"
                style={{
                  background: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            {/* Email */}
            <div className="space-y-1.5">
              <label
                className="text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                Email
              </label>
              <input
                type="email"
                value={form.email}
                onChange={update("email")}
                placeholder="you@example.com"
                className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-[color:var(--color-focus)]"
                style={{
                  background: "var(--color-surface-2)",
                  borderColor: "var(--color-border)",
                  color: "var(--color-text)",
                }}
              />
            </div>

            {/* Password */}
            <div className="space-y-1.5">
              <label
                className="text-[12px] font-semibold uppercase tracking-wider"
                style={{ color: "var(--color-text-muted)" }}
              >
                Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? "text" : "password"}
                  value={form.password}
                  onChange={update("password")}
                  placeholder="Min. 8 characters"
                  className="w-full rounded-xl border px-4 py-3 pr-11 text-sm outline-none transition-colors placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-[color:var(--color-focus)]"
                  style={{
                    background: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text)",
                  }}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 p-1"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {showPassword ? (
                    <EyeOff size={15} strokeWidth={2} />
                  ) : (
                    <Eye size={15} strokeWidth={2} />
                  )}
                </button>
              </div>
              {/* Password strength hint */}
              {form.password.length > 0 && (
                <div className="flex gap-1 pt-1">
                  {[1, 2, 3, 4].map((i) => (
                    <div
                      key={i}
                      className="h-1 flex-1 rounded-full transition-all duration-300"
                      style={{
                        background:
                          form.password.length >= i * 3
                            ? form.password.length >= 10
                              ? "var(--color-success)"
                              : "var(--color-accent)"
                            : "var(--color-surface-3)",
                      }}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <motion.button
              whileHover={{ y: -1 }}
              whileTap={{ y: 0 }}
              onClick={handleSubmit}
              disabled={loading}
              className="group relative mt-2 flex w-full items-center justify-center gap-2 rounded-xl py-3 text-sm font-semibold text-white transition-all focus:outline-none disabled:opacity-70"
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                boxShadow: "0 4px 20px rgba(124,58,237,0.3)",
              }}
            >
              {!loading && (
                <span
                  aria-hidden="true"
                  className="pulse-ring pointer-events-none absolute inset-0 rounded-xl"
                  style={{ border: "1.5px solid var(--color-accent)" }}
                />
              )}
              {loading ? (
                <motion.span
                  className="h-4 w-4 rounded-full border-2 border-white/30 border-t-white"
                  animate={{ rotate: 360 }}
                  transition={{
                    duration: 0.8,
                    repeat: Infinity,
                    ease: "linear",
                  }}
                />
              ) : (
                <>
                  Create Account
                  <ArrowRight size={15} strokeWidth={2.5} />
                </>
              )}
            </motion.button>
          </div>

          {/* Divider */}
          <div className="my-6 flex items-center gap-3">
            <div
              className="flex-1 border-t"
              style={{ borderColor: "var(--color-border)" }}
            />
            <span
              className="text-[11px] font-medium"
              style={{ color: "var(--color-text-muted)" }}
            >
              OR
            </span>
            <div
              className="flex-1 border-t"
              style={{ borderColor: "var(--color-border)" }}
            />
          </div>

          {/* Google SSO */}
          <button
            onClick={loginWithGoogle}
            className="flex w-full items-center justify-center gap-2.5 rounded-xl border py-3 text-sm font-medium transition-colors hover:bg-[color:var(--color-surface-2)] focus:outline-none"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24">
              <path
                fill="#4285F4"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="#34A853"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="#FBBC05"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="#EA4335"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Continue with Google
          </button>

          {/* Terms */}
          <p
            className="mt-4 text-center text-[11px] leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            By creating an account you agree to our{" "}
            <span
              className="font-medium"
              style={{ color: "var(--color-accent)" }}
            >
              Terms of Service
            </span>{" "}
            and{" "}
            <span
              className="font-medium"
              style={{ color: "var(--color-accent)" }}
            >
              Privacy Policy
            </span>
            .
          </p>

          {/* Footer */}
          <p
            className="mt-5 text-center text-[13px]"
            style={{ color: "var(--color-text-muted)" }}
          >
            Already have an account?{" "}
            <NavLink
              to={inviteAwarePath(RoutePaths.login)}
              className="font-semibold transition-colors hover:text-[color:var(--color-text-invert)]"
              style={{ color: "var(--color-accent)" }}
            >
              Log in
            </NavLink>
          </p>
        </div>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-6 flex items-center justify-center gap-2 text-center text-[12px]"
          style={{ color: "var(--color-text-muted)" }}
        >
          <Sparkles size={11} style={{ color: "var(--color-accent)" }} />
          Join 12,847+ candidates already landing their dream roles.
        </motion.p>
      </motion.div>
    </div>
  );
}
