import { useCallback, useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import { useLocation, useNavigate } from "react-router-dom";
import { TrendingUp, Award, Flame, Camera, Check } from "lucide-react";
import { useAuth } from "@/app/providers/useAuth.js";
import { api, ApiError } from "@/shared/lib/api.js";

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

const ENTITLED_SUBSCRIPTION_STATUSES = new Set([
  "active",
  "trialing",
  "past_due",
]);

const PLAN_META = {
  free: {
    label: "Free",
    dailyLimit: 2,
    accent: "var(--color-text-muted)",
    background: "var(--color-surface-3)",
    border: "var(--color-border)",
    note: "2 interview sessions per day",
  },
  pro: {
    label: "Pro",
    dailyLimit: 5,
    accent: "var(--color-accent)",
    background: "var(--color-accent-bg)",
    border: "var(--color-accent-border)",
    note: "5 interview sessions per day",
  },
  team: {
    label: "Team",
    dailyLimit: 3,
    accent: "#0ea5e9",
    background: "rgba(14,165,233,0.12)",
    border: "rgba(14,165,233,0.25)",
    note: "3 interview sessions per member per day",
  },
};

function getEffectivePlan(user) {
  if (!user) return "free";
  if (user.plan === "team") return "team";

  return user.plan === "pro" &&
    ENTITLED_SUBSCRIPTION_STATUSES.has(user.subscriptionStatus)
    ? "pro"
    : "free";
}

function formatSubscriptionStatus(status) {
  const value = String(status ?? "not_started").replace(/_/g, " ").trim();
  return value.charAt(0).toUpperCase() + value.slice(1);
}

function getBillingSummary(user) {
  const plan = getEffectivePlan(user);
  const meta = PLAN_META[plan] ?? PLAN_META.free;

  return {
    plan,
    planLabel: meta.label,
    planAccent: meta.accent,
    planBackground: meta.background,
    planBorder: meta.border,
    dailyLimit: meta.dailyLimit,
    dailyNote: meta.note,
    subscriptionStatus:
      plan === "free" && user?.plan !== "team"
        ? "Free access"
        : formatSubscriptionStatus(user?.subscriptionStatus),
  };
}

function toUtcDateKey(value) {
  const date = new Date(value);
  return `${date.getUTCFullYear()}-${String(date.getUTCMonth() + 1).padStart(2, "0")}-${String(date.getUTCDate()).padStart(2, "0")}`;
}

function computeDayStreak(sessions) {
  const uniqueDays = new Set(
    sessions
      .map((session) => session.startedAt ?? session.createdAt)
      .filter(Boolean)
      .map(toUtcDateKey),
  );

  let streak = 0;
  const cursor = new Date();
  cursor.setUTCHours(0, 0, 0, 0);

  while (uniqueDays.has(toUtcDateKey(cursor))) {
    streak += 1;
    cursor.setUTCDate(cursor.getUTCDate() - 1);
  }

  return streak;
}

function computeProfileStats(sessions) {
  const completed = sessions.filter(
    (session) => session.status === "completed" && session.report?.overall != null,
  );

  const avgScore =
    completed.length > 0
      ? Math.round(
          completed.reduce((sum, session) => sum + session.report.overall, 0) /
            completed.length,
        )
      : null;

  const bestScore =
    completed.length > 0
      ? Math.max(...completed.map((session) => session.report.overall))
      : null;

  return {
    totalSessions: sessions.length,
    avgScore,
    bestScore,
    streak: computeDayStreak(sessions),
  };
}

function formatDateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

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
  const location = useLocation();
  const navigate = useNavigate();
  const {
    user,
    initials,
    updateProfile,
    refreshUser,
    clearPendingTeamInvite,
    logout,
  } = useAuth();
  const billing = getBillingSummary(user);

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
  const [billingNotice, setBillingNotice] = useState(null);
  const [managingBilling, setManagingBilling] = useState(false);
  const [refreshingBilling, setRefreshingBilling] = useState(false);
  const [sessions, setSessions] = useState([]);
  const [statsLoading, setStatsLoading] = useState(true);
  const [team, setTeam] = useState(null);
  const [teamLoading, setTeamLoading] = useState(true);
  const [teamName, setTeamName] = useState("");
  const [teamSubmitting, setTeamSubmitting] = useState(false);
  const [teamError, setTeamError] = useState("");
  const [teamNotice, setTeamNotice] = useState("");
  const [memberEmail, setMemberEmail] = useState("");
  const [memberRole, setMemberRole] = useState("member");
  const [memberSubmitting, setMemberSubmitting] = useState(false);
  const [removingMemberId, setRemovingMemberId] = useState("");
  const [resendingInviteEmail, setResendingInviteEmail] = useState("");
  const [revokingInviteEmail, setRevokingInviteEmail] = useState("");
  const [transferTargetId, setTransferTargetId] = useState("");
  const [transferSubmitting, setTransferSubmitting] = useState(false);
  const [leavingTeam, setLeavingTeam] = useState(false);
  const [startingTeamBilling, setStartingTeamBilling] = useState(false);
  const [managingTeamBilling, setManagingTeamBilling] = useState(false);
  const [inviteTokenStatus, setInviteTokenStatus] = useState(null);
  const [acceptingInvite, setAcceptingInvite] = useState(false);
  const [deletingAccount, setDeletingAccount] = useState(false);
  const [deleteError, setDeleteError] = useState("");

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

  useEffect(() => {
    let cancelled = false;

    api
      .get("/api/interviews")
      .then(({ sessions }) => {
        if (!cancelled) setSessions(sessions ?? []);
      })
      .catch(() => {
        if (!cancelled) setSessions([]);
      })
      .finally(() => {
        if (!cancelled) setStatsLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const loadTeam = useCallback(async () => {
    setTeamLoading(true);
    try {
      const { team } = await api.get("/api/team/me");
      setTeam(team ?? null);
    } catch {
      setTeam(null);
    } finally {
      setTeamLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTeam();
  }, [loadTeam]);

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    if (params.get("portal") !== "returned") return;

    let cancelled = false;

    async function syncBilling() {
      setRefreshingBilling(true);
      setBillingNotice({
        tone: "info",
        message: "Refreshing your latest subscription status from the server…",
      });

      try {
        await refreshUser();
        if (cancelled) return;
        setBillingNotice({
          tone: "success",
          message:
            "Billing portal closed. Your subscription status has been refreshed.",
        });
      } catch {
        if (cancelled) return;
        setBillingNotice({
          tone: "warning",
          message:
            "Returned from the billing portal, but we couldn't refresh your subscription status automatically. Please refresh the page in a few seconds.",
        });
      } finally {
        if (!cancelled) {
          setRefreshingBilling(false);
          window.history.replaceState({}, "", location.pathname);
        }
      }
    }

    syncBilling();

    return () => {
      cancelled = true;
    };
  }, [location.pathname, location.search, refreshUser]);

  const stats = useMemo(() => computeProfileStats(sessions), [sessions]);
  const activeTeamMembers = (team?.members ?? []).filter(
    (member) => member.status === "active",
  );
  const pendingInvites = (team?.pendingInvites ?? []).filter(
    (invite) => invite.status === "pending",
  );
  const usedSeats = activeTeamMembers.length + pendingInvites.length;
  const availableSeats = Math.max(0, (team?.seatsPurchased ?? 0) - usedSeats);
  const transferCandidates = activeTeamMembers.filter(
    (member) => member.userId !== user?.id && member.role !== "owner",
  );
  const canManageMembers =
    team?.myRole === "owner" || team?.myRole === "admin";
  const teamSubscriptionEntitled =
    team?.subscriptionStatus === "active" ||
    team?.subscriptionStatus === "trialing" ||
    team?.subscriptionStatus === "past_due";
  const teamInviteToken = new URLSearchParams(location.search).get(
    "teamInviteToken",
  );

  useEffect(() => {
    if (!teamInviteToken) return;

    setInviteTokenStatus({
      tone: "info",
      message:
        team
          ? "A team invite token is present, but you already belong to a team. Leave your current team before accepting a different invite."
          : "You're signed in with an invited email. Accept the team invite below to join the team.",
    });
  }, [teamInviteToken, team]);

  async function handleAcceptInvite() {
    if (!teamInviteToken) return;

    setAcceptingInvite(true);
    setTeamError("");
    setTeamNotice("");
    setInviteTokenStatus({
      tone: "info",
      message: "Accepting your team invite…",
    });

    try {
      const { team } = await api.post("/api/team/accept-invite", {
        token: teamInviteToken,
      });
      setTeam(team ?? null);
      await refreshUser();
      clearPendingTeamInvite();
      setInviteTokenStatus({
        tone: "success",
        message: "Team invite accepted successfully.",
      });
      navigate(location.pathname, { replace: true });
    } catch (err) {
      setInviteTokenStatus({
        tone: "warning",
        message:
          err instanceof ApiError
            ? err.message
            : "Could not accept the team invite right now.",
      });
    } finally {
      setAcceptingInvite(false);
    }
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

  async function handleCreateTeam() {
    const name = teamName.trim();
    if (!name) {
      setTeamError("Team name is required.");
      return;
    }

    setTeamSubmitting(true);
    setTeamError("");
    setTeamNotice("");
    try {
      const { team } = await api.post("/api/team", { name });
      setTeam(team ?? null);
      setTeamName("");
      setTeamError("");
      setTeamNotice("Team created successfully.");
      await refreshUser();
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not create team right now. Please try again.",
      );
    } finally {
      setTeamSubmitting(false);
    }
  }

  async function handleAddMember() {
    const email = memberEmail.trim();
    if (!email) {
      setTeamError("Member email is required.");
      return;
    }

    setMemberSubmitting(true);
    setTeamError("");
    setTeamNotice("");
    try {
      const { team } = await api.post("/api/team/members", {
        email,
        role: memberRole,
      });
      setTeam(team ?? null);
      setMemberEmail("");
      setMemberRole("member");
      setTeamNotice("Team member added successfully.");
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not add that team member right now.",
      );
    } finally {
      setMemberSubmitting(false);
    }
  }

  async function handleRemoveMember(userId) {
    setRemovingMemberId(userId);
    setTeamError("");
    setTeamNotice("");
    try {
      const { team } = await api.delete(`/api/team/members/${userId}`);
      setTeam(team ?? null);
      setTeamNotice("Team member removed successfully.");
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not remove that team member right now.",
      );
    } finally {
      setRemovingMemberId("");
    }
  }

  async function handleTransferOwnership() {
    const userId = transferTargetId || transferCandidates[0]?.userId || "";
    if (!userId) {
      setTeamError("Select an active member to transfer ownership to.");
      return;
    }

    setTransferSubmitting(true);
    setTeamError("");
    setTeamNotice("");
    try {
      const { team } = await api.post("/api/team/transfer-ownership", { userId });
      setTeam(team ?? null);
      setTransferTargetId("");
      setTeamNotice("Ownership transferred successfully.");
      await refreshUser();
      await loadTeam();
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not transfer ownership right now.",
      );
    } finally {
      setTransferSubmitting(false);
    }
  }

  async function handleLeaveTeam() {
    setLeavingTeam(true);
    setTeamError("");
    setTeamNotice("");
    try {
      await api.post("/api/team/leave", {});
      setTeam(null);
      setTransferTargetId("");
      setMemberEmail("");
      setMemberRole("member");
      setTeamNotice("You left the team successfully.");
      await refreshUser();
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not leave the team right now.",
      );
    } finally {
      setLeavingTeam(false);
    }
  }

  async function handleManageBilling() {
    setManagingBilling(true);
    setBillingNotice(null);

    try {
      const data = await api.post("/api/payments/create-portal-session", {});
      if (!data?.portalUrl) {
        throw new ApiError(
          "Stripe billing portal URL was not returned.",
          502,
        );
      }

      window.location.assign(data.portalUrl);
    } catch (err) {
      setBillingNotice({
        tone: "warning",
        message:
          err instanceof ApiError
            ? err.message
            : "Could not open the billing portal right now. Please try again.",
      });
      setManagingBilling(false);
    }
  }

  async function handleResendInvite(email) {
    setResendingInviteEmail(email);
    setTeamError("");
    setTeamNotice("");
    try {
      const { team } = await api.post("/api/team/invites/resend", { email });
      setTeam(team ?? null);
      setTeamNotice(`Invite resent to ${email}.`);
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not resend that invite right now.",
      );
    } finally {
      setResendingInviteEmail("");
    }
  }

  async function handleRevokeInvite(email) {
    setRevokingInviteEmail(email);
    setTeamError("");
    setTeamNotice("");
    try {
      const { team } = await api.post("/api/team/invites/revoke", { email });
      setTeam(team ?? null);
      setTeamNotice(`Invite revoked for ${email}.`);
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not revoke that invite right now.",
      );
    } finally {
      setRevokingInviteEmail("");
    }
  }

  async function handleDeleteAccount() {
    const confirmed = window.confirm(
      "Delete your account permanently? This will remove your interview history and cannot be undone.",
    );
    if (!confirmed) return;

    setDeletingAccount(true);
    setDeleteError("");
    try {
      await api.delete("/api/profile");
      logout();
      window.location.assign("/");
    } catch (err) {
      setDeleteError(
        err instanceof ApiError
          ? err.message
          : "Could not delete your account right now. Please try again.",
      );
      setDeletingAccount(false);
    }
  }

  async function handleStartTeamBilling() {
    setStartingTeamBilling(true);
    setTeamError("");
    setTeamNotice("");
    try {
      const data = await api.post("/api/payments/create-checkout", {
        plan: "team",
      });
      if (!data?.checkoutUrl) {
        throw new ApiError("Stripe checkout URL was not returned.", 502);
      }
      window.location.assign(data.checkoutUrl);
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not start Team billing checkout right now.",
      );
      setStartingTeamBilling(false);
    }
  }

  async function handleManageTeamBilling() {
    setManagingTeamBilling(true);
    setTeamError("");
    setTeamNotice("");
    try {
      const data = await api.post("/api/payments/create-portal-session", {
        scope: "team",
      });
      if (!data?.portalUrl) {
        throw new ApiError(
          "Stripe billing portal URL was not returned.",
          502,
        );
      }
      window.location.assign(data.portalUrl);
    } catch (err) {
      setTeamError(
        err instanceof ApiError
          ? err.message
          : "Could not open Team billing management right now.",
      );
      setManagingTeamBilling(false);
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
                <div className="mt-2 flex flex-wrap items-center justify-center gap-2 sm:justify-start">
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: billing.planBackground,
                      borderColor: billing.planBorder,
                      color: billing.planAccent,
                    }}
                  >
                    {billing.planLabel} Plan
                  </span>
                  <span
                    className="inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold"
                    style={{
                      background: "var(--color-surface-2)",
                      borderColor: "var(--color-border)",
                      color: "var(--color-text-muted)",
                    }}
                  >
                    {billing.subscriptionStatus}
                  </span>
                </div>
              </div>
              <div className="grid grid-cols-4 gap-4 sm:grid-cols-2 sm:gap-6">
                {[
                  {
                    label: "Sessions",
                    value: statsLoading ? "—" : String(stats.totalSessions),
                    icon: TrendingUp,
                  },
                  {
                    label: "Avg Score",
                    value:
                      statsLoading || stats.avgScore == null
                        ? "—"
                        : `${stats.avgScore}%`,
                    icon: Award,
                  },
                  {
                    label: "Best Score",
                    value:
                      statsLoading || stats.bestScore == null
                        ? "—"
                        : `${stats.bestScore}%`,
                    icon: Award,
                  },
                  {
                    label: "Day Streak",
                    value: statsLoading ? "—" : String(stats.streak),
                    icon: Flame,
                  },
                ].map(({ label, value, icon: Icon }) => (
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

          {/* Plan & usage */}
          <SectionCard title="Plan & Usage">
            <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
              <div className="space-y-3">
                <div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Current plan
                  </p>
                  <div className="mt-2 flex flex-wrap items-center gap-2">
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-semibold"
                      style={{
                        background: billing.planBackground,
                        borderColor: billing.planBorder,
                        color: billing.planAccent,
                      }}
                    >
                      {billing.planLabel}
                    </span>
                    <span
                      className="inline-flex items-center rounded-full border px-3 py-1 text-[12px] font-medium"
                      style={{
                        background: "var(--color-surface-2)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-muted)",
                      }}
                    >
                      {billing.subscriptionStatus}
                    </span>
                  </div>
                </div>

                <div>
                  <p
                    className="text-[11px] font-bold uppercase tracking-wider"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Daily allowance
                  </p>
                  <p
                    className="mt-1 text-sm font-semibold"
                    style={{ color: "var(--color-text-invert)" }}
                  >
                    {billing.dailyNote}
                  </p>
                  <p
                    className="mt-1 text-[12px] leading-relaxed"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    Session limits reset daily at 00:00 UTC and are enforced on
                    the backend when a new interview starts.
                  </p>
                </div>

                {billingNotice && (
                  <p
                    className="rounded-xl border px-3 py-2 text-[12px] leading-relaxed"
                    style={{
                      background:
                        billingNotice.tone === "success"
                          ? "var(--color-success-bg)"
                          : billingNotice.tone === "warning"
                            ? "var(--color-warning-bg)"
                            : "var(--color-surface-2)",
                      borderColor:
                        billingNotice.tone === "success"
                          ? "var(--color-success-border)"
                          : billingNotice.tone === "warning"
                            ? "var(--color-warning-border)"
                            : "var(--color-border)",
                      color:
                        billingNotice.tone === "success"
                          ? "var(--color-success)"
                          : billingNotice.tone === "warning"
                            ? "var(--color-warning)"
                            : "var(--color-text-muted)",
                    }}
                  >
                    {billingNotice.message}
                  </p>
                )}
              </div>

              <div className="flex flex-col gap-3 sm:items-end sm:text-right">
                {billing.plan === "free" && (
                  <div>
                    <p
                      className="text-[12px] font-medium"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Need more practice each day?
                    </p>
                    <button
                      type="button"
                      onClick={() => window.location.assign("/#pricing")}
                      className="mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-white"
                      style={{
                        background:
                          "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                      }}
                    >
                      Upgrade to Pro
                    </button>
                  </div>
                )}

                <button
                  type="button"
                  onClick={handleManageBilling}
                  disabled={managingBilling || refreshingBilling}
                  className="rounded-xl border px-4 py-2.5 text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-70"
                  style={{
                    background: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                    color: "var(--color-text-invert)",
                  }}
                >
                  {managingBilling
                    ? "Opening Billing…"
                    : refreshingBilling
                      ? "Refreshing Status…"
                      : "Manage Billing"}
                </button>
              </div>
            </div>
          </SectionCard>

          <SectionCard title="Team">
            {inviteTokenStatus && (
              <div
                className="mb-4 rounded-xl border px-4 py-3"
                style={{
                  background:
                    inviteTokenStatus.tone === "success"
                      ? "var(--color-success-bg)"
                      : inviteTokenStatus.tone === "warning"
                        ? "var(--color-warning-bg)"
                        : "var(--color-surface-2)",
                  borderColor:
                    inviteTokenStatus.tone === "success"
                      ? "var(--color-success-border)"
                      : inviteTokenStatus.tone === "warning"
                        ? "var(--color-warning-border)"
                        : "var(--color-border)",
                  color:
                    inviteTokenStatus.tone === "success"
                      ? "var(--color-success)"
                      : inviteTokenStatus.tone === "warning"
                        ? "var(--color-warning)"
                        : "var(--color-text-muted)",
                }}
              >
                <p className="text-[12px] leading-relaxed">
                  {inviteTokenStatus.message}
                </p>
                {teamInviteToken && !team && (
                  <button
                    type="button"
                    onClick={handleAcceptInvite}
                    disabled={acceptingInvite}
                    className="mt-3 rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                    }}
                  >
                    {acceptingInvite ? "Accepting Invite…" : "Accept Team Invite"}
                  </button>
                )}
              </div>
            )}
            {teamLoading ? (
              <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                Loading your team…
              </p>
            ) : team ? (
              <div className="space-y-5">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                  <div>
                    <p
                      className="text-lg font-semibold"
                      style={{ color: "var(--color-text-invert)" }}
                    >
                      {team.name}
                    </p>
                    <div className="mt-2 flex flex-wrap items-center gap-2">
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-semibold"
                        style={{
                          background: "rgba(14,165,233,0.12)",
                          borderColor: "rgba(14,165,233,0.25)",
                          color: "#0ea5e9",
                        }}
                      >
                        {String(team.myRole ?? "member").replace(/^./, (c) => c.toUpperCase())}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          background:
                            team.subscriptionStatus === "active" ||
                            team.subscriptionStatus === "trialing" ||
                            team.subscriptionStatus === "past_due"
                              ? "var(--color-success-bg)"
                              : "var(--color-warning-bg)",
                          borderColor:
                            team.subscriptionStatus === "active" ||
                            team.subscriptionStatus === "trialing" ||
                            team.subscriptionStatus === "past_due"
                              ? "var(--color-success-border)"
                              : "var(--color-warning-border)",
                          color:
                            team.subscriptionStatus === "active" ||
                            team.subscriptionStatus === "trialing" ||
                            team.subscriptionStatus === "past_due"
                              ? "var(--color-success)"
                              : "var(--color-warning)",
                        }}
                      >
                        {formatSubscriptionStatus(team.subscriptionStatus)}
                      </span>
                      <span
                        className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
                        style={{
                          background: "var(--color-surface-2)",
                          borderColor: "var(--color-border)",
                          color: "var(--color-text-muted)",
                        }}
                      >
                        {usedSeats}/{team.seatsPurchased} seats allocated
                      </span>
                    </div>
                    <p
                      className="mt-2 text-[12px] leading-relaxed"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {team.subscriptionStatus === "active" ||
                      team.subscriptionStatus === "trialing" ||
                      team.subscriptionStatus === "past_due"
                        ? availableSeats > 0
                          ? `${availableSeats} seat${availableSeats === 1 ? "" : "s"} still available. Pending invites also reserve seats until accepted, revoked, or expired.`
                          : "All purchased seats are currently allocated across active members and pending invites."
                        : "This team does not currently have an entitled Team subscription, so Team-specific billing/limit benefits are not active yet."}
                    </p>
                    <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-3">
                      <div
                        className="rounded-xl border px-3 py-3"
                        style={{
                          background: "var(--color-surface-2)",
                          borderColor: "var(--color-border)",
                        }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Active members
                        </p>
                        <p
                          className="mt-1 text-base font-semibold"
                          style={{ color: "var(--color-text-invert)" }}
                        >
                          {activeTeamMembers.length}
                        </p>
                      </div>
                      <div
                        className="rounded-xl border px-3 py-3"
                        style={{
                          background: "var(--color-surface-2)",
                          borderColor: "var(--color-border)",
                        }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Pending invites
                        </p>
                        <p
                          className="mt-1 text-base font-semibold"
                          style={{ color: "var(--color-text-invert)" }}
                        >
                          {pendingInvites.length}
                        </p>
                      </div>
                      <div
                        className="rounded-xl border px-3 py-3"
                        style={{
                          background: "var(--color-surface-2)",
                          borderColor: "var(--color-border)",
                        }}
                      >
                        <p
                          className="text-[10px] font-bold uppercase tracking-wider"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Current period end
                        </p>
                        <p
                          className="mt-1 text-sm font-semibold"
                          style={{ color: "var(--color-text-invert)" }}
                        >
                          {formatDateTime(team.subscriptionCurrentPeriodEnd)}
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {(teamError || teamNotice) && (
                  <p
                    className="rounded-xl border px-3 py-2 text-[12px] leading-relaxed"
                    style={{
                      background: teamError
                        ? "var(--color-error-bg)"
                        : "var(--color-success-bg)",
                      borderColor: teamError
                        ? "var(--color-error-border)"
                        : "var(--color-success-border)",
                      color: teamError
                        ? "var(--color-error)"
                        : "var(--color-success)",
                    }}
                  >
                    {teamError || teamNotice}
                  </p>
                )}

                {team.myRole === "owner" && (
                  <div
                    className="flex flex-col gap-3 rounded-xl border p-4 sm:flex-row sm:items-center sm:justify-between"
                    style={{
                      background: "var(--color-surface-2)",
                      borderColor: "var(--color-border)",
                    }}
                  >
                    <div>
                      <p
                        className="text-[11px] font-bold uppercase tracking-wider"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        Team Billing
                      </p>
                      <p
                        className="mt-1 text-[13px] leading-relaxed"
                        style={{ color: "var(--color-text)" }}
                      >
                        {teamSubscriptionEntitled
                          ? "Your team already has an entitled subscription. You can manage seats, payment methods, and invoices through Stripe."
                          : "Team billing is not active yet. Start Team checkout to activate team subscription benefits and seat-backed access."}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-2 sm:justify-end">
                      {!teamSubscriptionEntitled && (
                        <button
                          type="button"
                          onClick={handleStartTeamBilling}
                          disabled={startingTeamBilling}
                          className="rounded-xl px-4 py-2.5 text-sm font-semibold text-white disabled:opacity-70"
                          style={{
                            background:
                              "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                          }}
                        >
                          {startingTeamBilling ? "Starting Checkout…" : "Start Team Billing"}
                        </button>
                      )}
                      {team.stripeCustomerId && (
                        <button
                          type="button"
                          onClick={handleManageTeamBilling}
                          disabled={managingTeamBilling}
                          className="rounded-xl border px-4 py-2.5 text-sm font-semibold disabled:opacity-70"
                          style={{
                            background: "var(--color-surface-1)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text-invert)",
                          }}
                        >
                          {managingTeamBilling ? "Opening Portal…" : "Manage Team Billing"}
                        </button>
                      )}
                    </div>
                  </div>
                )}

                {canManageMembers && (
                  <div className="space-y-3 rounded-xl border p-4" style={{
                    background: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                  }}>
                    <p
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Add Member
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_140px_auto] sm:items-end">
                      <InputField
                        label="Member Email"
                        value={memberEmail}
                        onChange={(e) => setMemberEmail(e.target.value)}
                        type="email"
                        placeholder="teammate@example.com"
                      />
                      <div className="space-y-1.5">
                        <label
                          className="text-[12px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          Role
                        </label>
                        <select
                          value={memberRole}
                          onChange={(e) => setMemberRole(e.target.value)}
                          className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                          style={{
                            background: "var(--color-surface-1)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                          }}
                        >
                          <option value="member">Member</option>
                          {team.myRole === "owner" && (
                            <option value="admin">Admin</option>
                          )}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleAddMember}
                        disabled={memberSubmitting}
                        className="rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                        }}
                      >
                        {memberSubmitting ? "Adding…" : "Add Member"}
                      </button>
                    </div>
                  </div>
                )}

                {team.myRole === "owner" && (
                  <div className="space-y-3 rounded-xl border p-4" style={{
                    background: "var(--color-surface-2)",
                    borderColor: "var(--color-border)",
                  }}>
                    <p
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Transfer Ownership
                    </p>
                    <div className="grid grid-cols-1 gap-3 sm:grid-cols-[1fr_auto] sm:items-end">
                      <div className="space-y-1.5">
                        <label
                          className="text-[12px] font-semibold uppercase tracking-wider"
                          style={{ color: "var(--color-text-muted)" }}
                        >
                          New Owner
                        </label>
                        <select
                          value={transferTargetId || transferCandidates[0]?.userId || ""}
                          onChange={(e) => setTransferTargetId(e.target.value)}
                          className="w-full rounded-xl border px-4 py-3 text-sm outline-none"
                          style={{
                            background: "var(--color-surface-1)",
                            borderColor: "var(--color-border)",
                            color: "var(--color-text)",
                          }}
                          disabled={transferCandidates.length === 0 || transferSubmitting}
                        >
                          {transferCandidates.length === 0 ? (
                            <option value="">No active members available</option>
                          ) : (
                            transferCandidates.map((member) => (
                              <option key={member.userId} value={member.userId}>
                                {member.name || member.email || member.userId} {member.email ? `(${member.email})` : ""}
                              </option>
                            ))
                          )}
                        </select>
                      </div>
                      <button
                        type="button"
                        onClick={handleTransferOwnership}
                        disabled={transferSubmitting || transferCandidates.length === 0}
                        className="rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                        }}
                      >
                        {transferSubmitting ? "Transferring…" : "Transfer Ownership"}
                      </button>
                    </div>
                    <p className="text-[12px]" style={{ color: "var(--color-text-muted)" }}>
                      Owners must transfer ownership before leaving a team that still has other active members.
                    </p>
                  </div>
                )}

                {canManageMembers && pendingInvites.length > 0 && (
                  <div>
                    <p
                      className="mb-3 text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Pending Invites
                    </p>
                    <div className="space-y-2">
                      {pendingInvites.map((invite) => (
                        <div
                          key={`${invite.email}-${invite.invitedAt}`}
                          className="flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          style={{
                            background: "var(--color-surface-2)",
                            borderColor: "var(--color-border)",
                          }}
                        >
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--color-text-invert)" }}
                            >
                              {invite.email}
                            </p>
                            <p
                              className="text-[12px] truncate"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              Invited {formatDateTime(invite.invitedAt)} · Expires {formatDateTime(invite.expiresAt)}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <span
                              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                background: "var(--color-surface-1)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {String(invite.role).replace(/^./, (c) => c.toUpperCase())}
                            </span>
                            <button
                              type="button"
                              onClick={() => handleResendInvite(invite.email)}
                              disabled={resendingInviteEmail === invite.email}
                              className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-70"
                              style={{
                                borderColor: "var(--color-accent-border)",
                                color: "var(--color-accent)",
                                background: "var(--color-accent-bg)",
                              }}
                            >
                              {resendingInviteEmail === invite.email ? "Resending…" : "Resend"}
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRevokeInvite(invite.email)}
                              disabled={revokingInviteEmail === invite.email}
                              className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-70"
                              style={{
                                borderColor: "var(--color-error-border)",
                                color: "var(--color-error)",
                                background: "var(--color-error-bg)",
                              }}
                            >
                              {revokingInviteEmail === invite.email ? "Revoking…" : "Revoke"}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                <div>
                  <div className="mb-3 flex items-center justify-between gap-3">
                    <p
                      className="text-[11px] font-bold uppercase tracking-wider"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      Members
                    </p>
                    <button
                      type="button"
                      onClick={handleLeaveTeam}
                      disabled={leavingTeam}
                      className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-70"
                      style={{
                        borderColor: "var(--color-error-border)",
                        color: "var(--color-error)",
                        background: "var(--color-error-bg)",
                      }}
                    >
                      {leavingTeam
                        ? team.myRole === "owner" && activeTeamMembers.length === 1
                          ? "Deleting Team…"
                          : "Leaving…"
                        : team.myRole === "owner" && activeTeamMembers.length === 1
                          ? "Delete Team"
                          : "Leave Team"}
                    </button>
                  </div>
                  <div className="space-y-2">
                    {(team.members ?? []).map((member) => {
                      const canRemove =
                        canManageMembers &&
                        member.userId !== user?.id &&
                        member.role !== "owner" &&
                        (team.myRole === "owner" || member.role === "member");

                      return (
                        <div
                          key={`${member.userId}-${member.joinedAt ?? member.role}`}
                          className="flex flex-col gap-3 rounded-xl border px-4 py-3 sm:flex-row sm:items-center sm:justify-between"
                          style={{
                            background: "var(--color-surface-2)",
                            borderColor: "var(--color-border)",
                          }}
                        >
                          <div className="min-w-0">
                            <p
                              className="text-sm font-medium truncate"
                              style={{ color: "var(--color-text-invert)" }}
                            >
                              {member.name || member.email || member.userId}
                            </p>
                            <p
                              className="text-[12px] truncate"
                              style={{ color: "var(--color-text-muted)" }}
                            >
                              {member.email || member.userId}
                            </p>
                          </div>
                          <div className="flex flex-wrap items-center gap-2 sm:justify-end">
                            <span
                              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                background: "var(--color-surface-1)",
                                borderColor: "var(--color-border)",
                                color: "var(--color-text-muted)",
                              }}
                            >
                              {String(member.role).replace(/^./, (c) => c.toUpperCase())}
                            </span>
                            <span
                              className="inline-flex items-center rounded-full border px-2.5 py-1 text-[11px] font-medium"
                              style={{
                                background:
                                  member.status === "active"
                                    ? "var(--color-success-bg)"
                                    : "var(--color-surface-1)",
                                borderColor:
                                  member.status === "active"
                                    ? "var(--color-success-border)"
                                    : "var(--color-border)",
                                color:
                                  member.status === "active"
                                    ? "var(--color-success)"
                                    : "var(--color-text-muted)",
                              }}
                            >
                              {String(member.status).replace(/^./, (c) => c.toUpperCase())}
                            </span>
                            {canRemove && (
                              <button
                                type="button"
                                onClick={() => handleRemoveMember(member.userId)}
                                disabled={removingMemberId === member.userId}
                                className="rounded-lg border px-3 py-1.5 text-[11px] font-semibold disabled:opacity-70"
                                style={{
                                  borderColor: "var(--color-error-border)",
                                  color: "var(--color-error)",
                                  background: "var(--color-error-bg)",
                                }}
                              >
                                {removingMemberId === member.userId ? "Removing…" : "Remove"}
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
                  You are not part of a team yet. Create one now to start building out team membership and future Team billing support.
                </p>
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-[1fr_auto] sm:items-end">
                  <InputField
                    label="Team Name"
                    value={teamName}
                    onChange={(e) => setTeamName(e.target.value)}
                    placeholder="e.g. InterviewX Bootcamp Cohort"
                  />
                  <button
                    type="button"
                    onClick={handleCreateTeam}
                    disabled={teamSubmitting}
                    className="rounded-xl px-5 py-3 text-sm font-semibold text-white disabled:opacity-70"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                    }}
                  >
                    {teamSubmitting ? "Creating Team…" : "Create Team"}
                  </button>
                </div>
                {(teamError || teamNotice) && (
                  <p
                    className="text-sm"
                    style={{
                      color: teamError
                        ? "var(--color-error)"
                        : "var(--color-success)",
                    }}
                  >
                    {teamError || teamNotice}
                  </p>
                )}
              </div>
            )}
          </SectionCard>

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
              <div className="shrink-0">
                {deleteError && (
                  <p
                    className="mb-2 max-w-xs text-[12px] leading-relaxed"
                    style={{ color: "var(--color-error)" }}
                  >
                    {deleteError}
                  </p>
                )}
                <button
                  type="button"
                  onClick={handleDeleteAccount}
                  disabled={deletingAccount}
                  className="shrink-0 rounded-xl border px-4 py-2 text-sm font-semibold transition-colors hover:bg-[color:var(--color-error-bg)] focus:outline-none disabled:opacity-70"
                  style={{
                    borderColor: "var(--color-error-border)",
                    color: "var(--color-error)",
                  }}
                >
                  {deletingAccount ? "Deleting Account…" : "Delete Account"}
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      </div>
    </div>
  );
}
