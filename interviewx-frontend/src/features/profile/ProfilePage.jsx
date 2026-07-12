import { useState } from "react";
import { motion } from "framer-motion";
import { TrendingUp, Award, Flame, Camera, Check } from "lucide-react";
import { useAuth } from "@/app/providers/useAuth.js";

const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.45, ease: [0.16, 1, 0.3, 1] },
  },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.07 } },
};

const STATS = [
  { label: "Sessions", value: "14", icon: TrendingUp },
  { label: "Avg Score", value: "82%", icon: Award },
  { label: "Best Score", value: "93%", icon: Award },
  { label: "Day Streak", value: "5", icon: Flame },
];

const TRACK_LABELS = [
  "Technical",
  "Coding",
  "Cybersecurity",
  "System Design",
  "HR & Behavioural",
];

const NOTIF_OPTIONS = [
  {
    label: "Daily practice reminder",
    desc: "Get reminded to practice every day",
  },
  {
    label: "Weekly progress report",
    desc: "Summary of your weekly performance",
  },
  { label: "New question packs", desc: "Notified when new tracks are added" },
  {
    label: "Session completion summary",
    desc: "Email after each completed session",
  },
];

function SectionCard({ title, children }) {
  return (
    <motion.div
      variants={fadeUp}
      className="overflow-hidden rounded-2xl border"
      style={{
        background: "var(--color-surface-1)",
        borderColor: "var(--color-border-strong)",
      }}
    >
      <div
        className="border-b px-6 py-4"
        style={{
          borderColor: "var(--color-border)",
          background: "var(--color-surface-2)",
        }}
      >
        <span
          className="text-sm font-semibold"
          style={{ color: "var(--color-text-invert)" }}
        >
          {title}
        </span>
      </div>
      <div className="p-6">{children}</div>
    </motion.div>
  );
}

function InputField({
  label,
  value,
  onChange,
  type = "text",
  placeholder,
  disabled = false,
  hint,
}) {
  return (
    <div className="space-y-1.5">
      <label
        className="text-[12px] font-semibold uppercase tracking-wider"
        style={{ color: "var(--color-text-muted)" }}
      >
        {label}
      </label>
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className="w-full rounded-xl border px-4 py-3 text-sm outline-none transition-colors placeholder:text-[color:var(--color-text-muted)] focus:ring-2 focus:ring-[color:var(--color-focus)] disabled:cursor-not-allowed disabled:opacity-60"
        style={{
          background: "var(--color-surface-2)",
          borderColor: "var(--color-border)",
          color: "var(--color-text)",
        }}
      />
      {hint && (
        <p className="text-[11px]" style={{ color: "var(--color-text-muted)" }}>
          {hint}
        </p>
      )}
    </div>
  );
}

function Toggle({ checked, onChange }) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className="relative inline-flex h-5 w-9 shrink-0 cursor-pointer rounded-full border-2 transition-colors focus:outline-none"
      style={{
        background: checked ? "var(--color-accent)" : "var(--color-surface-3)",
        borderColor: "transparent",
      }}
    >
      <motion.span
        layout
        className="inline-block h-4 w-4 rounded-full bg-white shadow"
        animate={{ x: checked ? 16 : 0 }}
        transition={{ type: "spring", stiffness: 500, damping: 35 }}
      />
    </button>
  );
}

export default function ProfilePage() {
  const { user, initials, updateProfile } = useAuth();

  const [profile, setProfile] = useState({
    name: user?.name ?? "",
    email: user?.email ?? "",
    role: user?.role ?? "",
    target: user?.target ?? "",
  });
  const [tracks, setTracks] = useState(
    TRACK_LABELS.map((label) => ({ label, checked: !!user?.tracks?.[label] })),
  );
  const [notifs, setNotifs] = useState(
    NOTIF_OPTIONS.map((n) => ({
      ...n,
      enabled: user?.notifications?.[n.label] ?? true,
    })),
  );
  const [saved, setSaved] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState("");

  function update(field) {
    return (e) => setProfile((prev) => ({ ...prev, [field]: e.target.value }));
  }

  function toggleTrack(i) {
    setTracks((prev) =>
      prev.map((t, idx) => (idx === i ? { ...t, checked: !t.checked } : t)),
    );
  }

  function toggleNotif(i) {
    setNotifs((prev) =>
      prev.map((n, idx) => (idx === i ? { ...n, enabled: !n.enabled } : n)),
    );
  }

  async function handleSave() {
    setSaving(true);
    setSaveError("");
    try {
      await updateProfile({
        name: profile.name,
        role: profile.role,
        target: profile.target,
        tracks: Object.fromEntries(tracks.map((t) => [t.label, t.checked])),
        notifications: Object.fromEntries(
          notifs.map((n) => [n.label, n.enabled]),
        ),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch (err) {
      setSaveError(err.message || "Could not save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="min-h-full w-full"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="mx-auto max-w-[760px] px-4 py-10 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between"
        >
          <div>
            <h1
              style={{
                fontSize: "clamp(1.4rem, 2.5vw, 1.85rem)",
                fontWeight: 700,
                letterSpacing: "-0.02em",
                color: "var(--color-text-invert)",
                margin: 0,
              }}
            >
              Profile
            </h1>
            <p
              className="mt-1 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Manage your account, preferences, and interview goals.
            </p>
          </div>
          <motion.button
            whileHover={{ y: -1 }}
            whileTap={{ y: 0 }}
            onClick={handleSave}
            disabled={saving}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-5 py-2.5 text-sm font-semibold text-white transition-all focus:outline-none disabled:opacity-70"
            style={{
              background: saved
                ? "var(--color-success)"
                : "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
              boxShadow: "0 4px 16px rgba(124,58,237,0.3)",
            }}
          >
            {saved ? (
              <>
                <Check size={14} strokeWidth={2.5} /> Saved!
              </>
            ) : saving ? (
              "Saving…"
            ) : (
              "Save Changes"
            )}
          </motion.button>
        </motion.div>

        {saveError && (
          <p
            className="-mt-2 text-sm font-medium"
            style={{ color: "var(--color-error)" }}
          >
            {saveError}
          </p>
        )}

        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          className="space-y-6"
        >
          {/* Avatar card */}
          <motion.div
            variants={fadeUp}
            className="overflow-hidden rounded-2xl border"
            style={{
              background: "var(--color-surface-1)",
              borderColor: "var(--color-border-strong)",
            }}
          >
            <div className="flex flex-col items-center gap-6 p-8 sm:flex-row">
              <div className="relative shrink-0">
                <div
                  className="flex h-20 w-20 items-center justify-center rounded-full text-2xl font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                  }}
                >
                  {initials}
                </div>
                <button
                  className="absolute bottom-0 right-0 flex h-6 w-6 items-center justify-center rounded-full border-2"
                  style={{
                    background: "var(--color-surface-2)",
                    borderColor: "var(--color-bg)",
                    color: "var(--color-text-muted)",
                  }}
                >
                  <Camera size={11} strokeWidth={2} />
                </button>
              </div>
              <div className="flex-1 text-center sm:text-left">
                <p
                  className="text-lg font-bold"
                  style={{ color: "var(--color-text-invert)" }}
                >
                  {profile.name}
                </p>
                <p
                  className="text-sm"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  {profile.email}
                </p>
                <span
                  className="mt-2 inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                  style={{
                    background: "var(--color-accent-bg)",
                    borderColor: "var(--color-accent-border)",
                    color: "var(--color-accent)",
                  }}
                >
                  Pro Plan
                </span>
              </div>
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-2 sm:gap-6">
                {STATS.map(({ label, value, icon: Icon }) => (
                  <div
                    key={label}
                    className="flex flex-col items-center gap-0.5"
                  >
                    <Icon
                      size={13}
                      strokeWidth={2}
                      style={{ color: "var(--color-accent)" }}
                    />
                    <span
                      className="text-lg font-bold"
                      style={{ color: "var(--color-text-invert)" }}
                    >
                      {value}
                    </span>
                    <span
                      className="text-[10px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {label}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          </motion.div>

          {/* Personal info */}
          <SectionCard title="Personal Information">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <InputField
                label="Full Name"
                value={profile.name}
                onChange={update("name")}
                placeholder="Your name"
              />
              <InputField
                label="Email"
                value={profile.email}
                onChange={update("email")}
                type="email"
                placeholder="you@example.com"
                disabled
                hint="Email can't be changed yet."
              />
              <InputField
                label="Current Role"
                value={profile.role}
                onChange={update("role")}
                placeholder="e.g. Software Engineer"
              />
              <InputField
                label="Target Role"
                value={profile.target}
                onChange={update("target")}
                placeholder="e.g. Staff Engineer at Google"
              />
            </div>
          </SectionCard>

          {/* Tracks */}
          <SectionCard title="Interview Tracks">
            <p
              className="mb-4 text-sm"
              style={{ color: "var(--color-text-muted)" }}
            >
              Select the tracks you want to practice. The AI will prioritise
              these in your sessions.
            </p>
            <div className="space-y-2">
              {tracks.map((track, i) => (
                <div
                  key={track.label}
                  className="flex items-center justify-between rounded-xl border px-4 py-3 transition-colors"
                  style={{
                    background: track.checked
                      ? "var(--color-accent-bg)"
                      : "var(--color-surface-2)",
                    borderColor: track.checked
                      ? "var(--color-accent-border)"
                      : "var(--color-border)",
                  }}
                >
                  <span
                    className="text-sm font-medium"
                    style={{ color: "var(--color-text-invert)" }}
                  >
                    {track.label}
                  </span>
                  <Toggle
                    checked={track.checked}
                    onChange={() => toggleTrack(i)}
                  />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Notifications */}
          <SectionCard title="Notifications">
            <div className="space-y-4">
              {notifs.map((n, i) => (
                <div
                  key={n.label}
                  className="flex items-center justify-between gap-4"
                >
                  <div>
                    <p
                      className="text-sm font-medium"
                      style={{ color: "var(--color-text-invert)" }}
                    >
                      {n.label}
                    </p>
                    <p
                      className="text-[12px]"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {n.desc}
                    </p>
                  </div>
                  <Toggle checked={n.enabled} onChange={() => toggleNotif(i)} />
                </div>
              ))}
            </div>
          </SectionCard>

          {/* Danger zone */}
          <motion.div
            variants={fadeUp}
            className="overflow-hidden rounded-2xl border"
            style={{
              background: "var(--color-surface-1)",
              borderColor: "var(--color-error-border)",
            }}
          >
            <div
              className="border-b px-6 py-4"
              style={{
                borderColor: "var(--color-error-border)",
                background: "var(--color-error-bg)",
              }}
            >
              <span
                className="text-sm font-semibold"
                style={{ color: "var(--color-error)" }}
              >
                Danger Zone
              </span>
            </div>
            <div className="flex flex-col gap-3 p-6 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p
                  className="text-sm font-medium"
                  style={{ color: "var(--color-text-invert)" }}
                >
                  Delete account
                </p>
                <p
                  className="text-[12px]"
                  style={{ color: "var(--color-text-muted)" }}
                >
                  Permanently delete your account and all session data. This
                  cannot be undone.
                </p>
              </div>
              <button
                className="shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[color:var(--color-error-bg)] focus:outline-none"
                style={{
                  borderColor: "var(--color-error-border)",
                  color: "var(--color-error)",
                }}
              >
                Delete Account
              </button>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
