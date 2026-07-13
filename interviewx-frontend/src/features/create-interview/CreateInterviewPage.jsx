import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  Code2,
  ShieldCheck,
  Users,
  Network,
  ArrowRight,
  Clock,
  BarChart3,
  ChevronRight,
  Layers,
  Server,
  Globe,
  Database,
  Cloud,
  Shield,
  Lock,
  Terminal,
  Briefcase,
  Star,
  Zap,
  Calculator,
  Brain,
  BookOpen,
} from "lucide-react";

// ─── Track definitions grouped by category ───────────────────────────────────

const CATEGORIES = [
  {
    id: "dsa",
    label: "DSA & Coding",
    description: "Data structures, algorithms & problem solving",
    color: "#f59e0b",
    tracks: [
      {
        id: "dsa-fundamentals",
        icon: Terminal,
        title: "DSA Fundamentals",
        description:
          "Arrays, trees, graphs, sorting, searching — core DS&A concepts tested at top companies.",
        duration: "60 min",
        questions: 5,
        difficulty: "Medium–Hard",
        role: "Software Engineer",
        tag: "Popular",
        companies: "Google · Amazon · Microsoft",
      },
      {
        id: "competitive",
        icon: Zap,
        title: "Competitive Programming",
        description:
          "DP, greedy, backtracking, graph algorithms — advanced problem solving under pressure.",
        duration: "90 min",
        questions: 4,
        difficulty: "Hard",
        role: "Software Engineer",
        companies: "Google · Meta · Stripe",
      },
    ],
  },
  {
    id: "aptitude",
    label: "Aptitude",
    description: "Curated objective questions across reasoning and verbal skills",
    color: "#8b5cf6",
    tracks: [
      {
        id: "numerical-reasoning",
        icon: Calculator,
        title: "Numerical Reasoning",
        description:
          "Percentages, ratios, averages, work/time, and quantitative problem solving.",
        duration: "20 min",
        questions: 5,
        difficulty: "Easy–Medium",
        role: "Aptitude Candidate",
        tag: "New",
        companies: "Campus drives · Assessments · Screening rounds",
      },
      {
        id: "logical-reasoning",
        icon: Brain,
        title: "Logical Reasoning",
        description:
          "Series, analogies, arrangements, direction sense, syllogisms, and pattern logic.",
        duration: "20 min",
        questions: 5,
        difficulty: "Easy–Medium",
        role: "Aptitude Candidate",
        companies: "Campus drives · Assessments · Screening rounds",
      },
      {
        id: "verbal-ability",
        icon: BookOpen,
        title: "Verbal Ability",
        description:
          "Vocabulary, grammar, sentence completion, inference, and communication aptitude.",
        duration: "20 min",
        questions: 5,
        difficulty: "Easy–Medium",
        role: "Aptitude Candidate",
        companies: "Campus drives · Assessments · Screening rounds",
      },
    ],
  },
  {
    id: "domain",
    label: "Domain / Role",
    description: "Role-specific technical interviews",
    color: "#7c3aed",
    tracks: [
      {
        id: "swe",
        icon: Code2,
        title: "Software Engineer (SWE)",
        description:
          "Full software engineering interview — coding, design, system thinking, and trade-offs.",
        duration: "45 min",
        questions: 6,
        difficulty: "Adaptive",
        role: "Software Engineer",
        tag: "Popular",
        companies: "Google · Meta · Amazon",
      },
      {
        id: "fullstack",
        icon: Layers,
        title: "Full Stack Developer",
        description:
          "Frontend + backend + API design + database. Covers the entire application stack.",
        duration: "45 min",
        questions: 6,
        difficulty: "Adaptive",
        role: "Full Stack Developer",
        companies: "Startups · Scale-ups",
      },
      {
        id: "mern",
        icon: Globe,
        title: "MERN Stack Developer",
        description:
          "MongoDB, Express, React, Node — deep-dive into the JS full stack.",
        duration: "40 min",
        questions: 6,
        difficulty: "Medium",
        role: "MERN Stack Developer",
        companies: "Product companies · Startups",
      },
      {
        id: "frontend",
        icon: Globe,
        title: "Frontend Developer",
        description:
          "HTML, CSS, JS, React, performance, accessibility, and browser internals.",
        duration: "40 min",
        questions: 6,
        difficulty: "Adaptive",
        role: "Frontend Developer",
        companies: "Meta · Airbnb · Shopify",
      },
      {
        id: "backend",
        icon: Server,
        title: "Backend Developer",
        description:
          "APIs, databases, caching, queues, scalability, and server-side architecture.",
        duration: "45 min",
        questions: 6,
        difficulty: "Adaptive",
        role: "Backend Developer",
        companies: "Stripe · Uber · Netflix",
      },
      {
        id: "devops",
        icon: Cloud,
        title: "DevOps / Cloud Engineer",
        description:
          "CI/CD, Docker, Kubernetes, AWS/GCP, infrastructure as code, and SRE practices.",
        duration: "45 min",
        questions: 6,
        difficulty: "Medium–Hard",
        role: "DevOps Engineer",
        companies: "AWS · Google Cloud · HashiCorp",
      },
      {
        id: "database",
        icon: Database,
        title: "Database Engineer",
        description:
          "SQL, NoSQL, query optimization, indexing, replication, and database design.",
        duration: "40 min",
        questions: 5,
        difficulty: "Medium",
        role: "Database Engineer",
        companies: "Oracle · MongoDB · Snowflake",
      },
    ],
  },
  {
    id: "cybersec",
    label: "Cybersecurity",
    description: "Security roles from SOC to pentest",
    color: "#ef4444",
    tracks: [
      {
        id: "soc-analyst",
        icon: Shield,
        title: "SOC Analyst (L1 / L2)",
        description:
          "Incident triage, SIEM, threat detection, alert management, and escalation procedures.",
        duration: "40 min",
        questions: 6,
        difficulty: "Entry–Mid",
        role: "SOC Analyst",
        tag: "Popular",
        companies: "CrowdStrike · Palo Alto · MSSP",
      },
      {
        id: "penetration-tester",
        icon: Lock,
        title: "Penetration Tester",
        description:
          "Recon, exploitation, post-exploitation, reporting, and responsible disclosure.",
        duration: "50 min",
        questions: 6,
        difficulty: "Hard",
        role: "Penetration Tester",
        companies: "Offensive Security · Rapid7",
      },
      {
        id: "cybersecurity",
        icon: ShieldCheck,
        title: "Cybersecurity Engineer",
        description:
          "Defensive architecture, zero-trust, threat modeling, and security engineering.",
        duration: "45 min",
        questions: 6,
        difficulty: "Adaptive",
        role: "Cybersecurity Engineer",
        companies: "Big Tech · Financial · Healthcare",
      },
      {
        id: "soc-compliance",
        icon: Briefcase,
        title: "SOC 1 / SOC 2 Compliance",
        description:
          "Audit readiness, controls, trust service criteria, and compliance frameworks.",
        duration: "35 min",
        questions: 5,
        difficulty: "Medium",
        role: "Compliance Analyst",
        companies: "Big 4 · FinTech · SaaS",
      },
    ],
  },
  {
    id: "system",
    label: "System Design",
    description: "Architecture and distributed systems",
    color: "#06b6d4",
    tracks: [
      {
        id: "system-design",
        icon: Network,
        title: "System Design",
        description:
          "Design scalable distributed systems — trade-offs, capacity planning, and reliability.",
        duration: "60 min",
        questions: 3,
        difficulty: "Senior+",
        role: "Staff Engineer",
        tag: "Senior",
        companies: "Google · Amazon · Meta",
      },
    ],
  },
  {
    id: "hr",
    label: "HR & Soft Skills",
    description: "Behavioural and leadership interviews",
    color: "#10b981",
    tracks: [
      {
        id: "hr",
        icon: Users,
        title: "HR & Behavioural",
        description:
          "STAR-format questions on leadership, conflict resolution, culture fit, and growth mindset.",
        duration: "30 min",
        questions: 8,
        difficulty: "All levels",
        role: "Candidate",
        tag: "Popular",
        companies: "All companies",
      },
      {
        id: "leadership",
        icon: Star,
        title: "Leadership & Management",
        description:
          "Team management, stakeholder communication, roadmap ownership, and people leadership.",
        duration: "35 min",
        questions: 6,
        difficulty: "Senior+",
        role: "Engineering Manager",
        companies: "Big Tech · Scale-ups",
      },
    ],
  },
];

// Flatten for easy lookup
const ALL_TRACKS = CATEGORIES.flatMap((c) => c.tracks);

const LEVELS = ["Entry Level", "Mid Level", "Senior", "Staff / Principal"];

// ─── Component ────────────────────────────────────────────────────────────────

export default function CreateInterviewPage() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState("domain");
  const [selected, setSelected] = useState(null);
  const [level, setLevel] = useState("Mid Level");

  const visibleTracks =
    CATEGORIES.find((c) => c.id === activeCategory)?.tracks ?? [];
  const selectedTrack = ALL_TRACKS.find((t) => t.id === selected);

  function handleStart() {
    if (!selected || !selectedTrack) return;
    const isDSA = ["dsa-fundamentals", "competitive"].includes(selected);
    navigate(isDSA ? "/app/dsa/start" : "/app/interviews/start", {
      state: { trackId: selected, role: selectedTrack.role, level },
    });
  }

  return (
    <div
      className="min-h-full w-full"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="mx-auto max-w-[960px] px-4 py-10 sm:px-6">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.45, ease: [0.16, 1, 0.3, 1] }}
          className="mb-8 text-center"
        >
          <span
            className="mb-3 inline-flex items-center rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{
              background: "var(--color-accent-bg)",
              borderColor: "var(--color-accent-border)",
              color: "var(--color-accent)",
            }}
          >
            New Session
          </span>
          <h1
            className="mt-3 text-balance"
            style={{
              fontSize: "clamp(1.6rem, 3vw, 2.1rem)",
              fontWeight: 700,
              letterSpacing: "-0.02em",
              lineHeight: 1.15,
              color: "var(--color-text-invert)",
            }}
          >
            Choose your interview track
          </h1>
          <p
            className="mt-2 text-sm"
            style={{ color: "var(--color-text-muted)" }}
          >
            Pick a category, select a role, and set your experience level.
          </p>
        </motion.div>

        {/* Experience level */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.06 }}
          className="mb-7"
        >
          <p
            className="mb-2.5 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--color-text-muted)" }}
          >
            Experience Level
          </p>
          <div className="flex flex-wrap gap-2">
            {LEVELS.map((l) => (
              <button
                key={l}
                onClick={() => setLevel(l)}
                className="rounded-lg border px-4 py-2 text-sm font-medium transition-all focus:outline-none"
                style={
                  level === l
                    ? {
                        background: "var(--color-accent-bg)",
                        borderColor: "var(--color-accent-border)",
                        color: "var(--color-accent)",
                      }
                    : {
                        background: "var(--color-surface-1)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-muted)",
                      }
                }
              >
                {l}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Category tabs */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="mb-5"
        >
          <p
            className="mb-2.5 text-[11px] font-bold uppercase tracking-widest"
            style={{ color: "var(--color-text-muted)" }}
          >
            Category
          </p>
          <div className="flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSelected(null);
                }}
                className="flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-medium transition-all focus:outline-none"
                style={
                  activeCategory === cat.id
                    ? {
                        background: `${cat.color}18`,
                        borderColor: `${cat.color}55`,
                        color: cat.color,
                      }
                    : {
                        background: "var(--color-surface-1)",
                        borderColor: "var(--color-border)",
                        color: "var(--color-text-muted)",
                      }
                }
              >
                <span
                  className="h-2 w-2 rounded-full shrink-0"
                  style={{
                    background:
                      activeCategory === cat.id
                        ? cat.color
                        : "var(--color-border)",
                  }}
                />
                {cat.label}
                <span
                  className="rounded px-1.5 py-0.5 text-[10px] font-bold"
                  style={{
                    background:
                      activeCategory === cat.id
                        ? `${cat.color}25`
                        : "var(--color-surface-2)",
                    color:
                      activeCategory === cat.id
                        ? cat.color
                        : "var(--color-text-muted)",
                  }}
                >
                  {cat.tracks.length}
                </span>
              </button>
            ))}
          </div>
        </motion.div>

        {/* Track cards */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeCategory}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            transition={{ duration: 0.25 }}
            className="mb-8 grid grid-cols-1 gap-3 sm:grid-cols-2"
          >
            {visibleTracks.map((track) => {
              const Icon = track.icon;
              const isActive = selected === track.id;
              const cat = CATEGORIES.find((c) =>
                c.tracks.some((t) => t.id === track.id),
              );

              return (
                <motion.button
                  key={track.id}
                  whileHover={{ y: -2 }}
                  whileTap={{ y: 0 }}
                  onClick={() => setSelected(isActive ? null : track.id)}
                  className="relative flex items-start gap-4 rounded-2xl border p-5 text-left transition-all focus:outline-none"
                  style={{
                    background: isActive
                      ? `${cat.color}0f`
                      : "var(--color-surface-1)",
                    borderColor: isActive
                      ? `${cat.color}55`
                      : "var(--color-border)",
                    boxShadow: isActive ? `0 0 0 1px ${cat.color}33` : "none",
                  }}
                >
                  {/* Tag badge */}
                  {track.tag && (
                    <span
                      className="absolute right-4 top-4 rounded-full px-2 py-0.5 text-[10px] font-bold"
                      style={{
                        background:
                          track.tag === "Popular"
                            ? "var(--color-success-bg)"
                            : "var(--color-accent-bg)",
                        color:
                          track.tag === "Popular"
                            ? "var(--color-success)"
                            : "var(--color-accent)",
                      }}
                    >
                      {track.tag}
                    </span>
                  )}

                  {/* Icon */}
                  <div
                    className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border"
                    style={{
                      background: isActive
                        ? `${cat.color}20`
                        : "var(--color-surface-2)",
                      borderColor: isActive
                        ? `${cat.color}44`
                        : "var(--color-border)",
                    }}
                  >
                    <Icon
                      size={18}
                      strokeWidth={1.8}
                      style={{
                        color: isActive ? cat.color : "var(--color-accent)",
                      }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-1 pr-6">
                    <p
                      className="text-[14px] font-semibold"
                      style={{ color: "var(--color-text-invert)" }}
                    >
                      {track.title}
                    </p>
                    <p
                      className="text-[12px] leading-relaxed"
                      style={{ color: "var(--color-text-muted)" }}
                    >
                      {track.description}
                    </p>
                    <p
                      className="text-[11px] font-medium"
                      style={{
                        color: isActive ? cat.color : "var(--color-text-muted)",
                        opacity: 0.8,
                      }}
                    >
                      {track.companies}
                    </p>
                    <div className="flex items-center gap-3 pt-1 flex-wrap">
                      <span
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <Clock size={10} strokeWidth={2} />
                        {track.duration}
                      </span>
                      <span
                        className="flex items-center gap-1 text-[11px]"
                        style={{ color: "var(--color-text-muted)" }}
                      >
                        <BarChart3 size={10} strokeWidth={2} />
                        {track.questions} questions
                      </span>
                      <span
                        className="rounded px-1.5 py-0.5 text-[10px] font-semibold"
                        style={{
                          background: "var(--color-surface-3)",
                          color: "var(--color-text-muted)",
                          border: "1px solid var(--color-border)",
                        }}
                      >
                        {track.difficulty}
                      </span>
                    </div>
                  </div>

                  {/* Selected checkmark */}
                  {isActive && (
                    <motion.div
                      layoutId="selected-ring"
                      className="absolute right-4 bottom-4 flex h-5 w-5 items-center justify-center rounded-full"
                      style={{ background: cat.color }}
                    >
                      <svg
                        width="10"
                        height="10"
                        viewBox="0 0 10 10"
                        fill="none"
                      >
                        <path
                          d="M2 5l2 2 4-4"
                          stroke="#fff"
                          strokeWidth="1.5"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </motion.div>
                  )}
                </motion.button>
              );
            })}
          </motion.div>
        </AnimatePresence>

        {/* Selected summary + start */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.18 }}
          className="flex items-center justify-between gap-4 rounded-2xl border p-4"
          style={{
            background: "var(--color-surface-1)",
            borderColor: selected
              ? "var(--color-accent-border)"
              : "var(--color-border)",
          }}
        >
          <div>
            {selectedTrack ? (
              <div className="flex items-center gap-2.5">
                <div
                  className="flex h-8 w-8 items-center justify-center rounded-lg"
                  style={{ background: "var(--color-accent-bg)" }}
                >
                  <selectedTrack.icon
                    size={15}
                    strokeWidth={2}
                    style={{ color: "var(--color-accent)" }}
                  />
                </div>
                <div>
                  <p
                    className="text-sm font-semibold"
                    style={{ color: "var(--color-text-invert)" }}
                  >
                    {selectedTrack.title}
                  </p>
                  <p
                    className="text-[11px]"
                    style={{ color: "var(--color-text-muted)" }}
                  >
                    {level} · {selectedTrack.duration} ·{" "}
                    {selectedTrack.questions} questions
                  </p>
                </div>
              </div>
            ) : (
              <p
                className="text-sm"
                style={{ color: "var(--color-text-muted)" }}
              >
                No track selected — pick one above to begin
              </p>
            )}
          </div>

          <motion.button
            whileHover={selected ? { y: -1 } : {}}
            whileTap={selected ? { scale: 0.97 } : {}}
            onClick={handleStart}
            disabled={!selected}
            className="inline-flex shrink-0 items-center gap-2 rounded-xl px-6 py-2.5 text-sm font-semibold text-white transition-all focus:outline-none disabled:opacity-40 disabled:cursor-not-allowed"
            style={{
              background: selected
                ? "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)"
                : "var(--color-surface-3)",
              boxShadow: selected ? "0 4px 20px rgba(124,58,237,0.35)" : "none",
              color: selected ? "#fff" : "var(--color-text-muted)",
            }}
          >
            Start Interview
            <ArrowRight size={15} strokeWidth={2.5} />
          </motion.button>
        </motion.div>
      </div>
    </div>
  );
}
