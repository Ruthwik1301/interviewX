import { motion } from "framer-motion";
import { ShieldAlert, Bug, Network, Lock, Terminal, Eye } from "lucide-react";

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  show: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, ease: [0.16, 1, 0.3, 1] },
  },
};

const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};

const TRACKS = [
  {
    icon: ShieldAlert,
    title: "SOC Analyst",
    level: "L1 – L3",
    questions: 140,
    tags: ["Incident Response", "SIEM", "Threat Hunting", "Log Analysis"],
    description:
      "Master triage, escalation, and detection engineering questions used at Tier-1 through Tier-3 SOC roles.",
    featured: true,
  },
  {
    icon: Bug,
    title: "Penetration Testing",
    level: "Mid – Senior",
    questions: 110,
    tags: ["Web App", "Network", "Active Directory", "Red Team"],
    description:
      "Practice methodology, reporting, and tool-specific questions for offensive security roles.",
    featured: false,
  },
  {
    icon: Network,
    title: "Network Security",
    level: "Entry – Senior",
    questions: 95,
    tags: ["Firewall", "IDS/IPS", "VPN", "Zero Trust"],
    description:
      "Deep-dive into protocol-level questions, architecture design, and network defence strategies.",
    featured: false,
  },
  {
    icon: Lock,
    title: "Security Engineering",
    level: "Mid – Staff",
    questions: 120,
    tags: ["SDLC", "Secrets Management", "PKI", "Cloud Security"],
    description:
      "Questions covering secure design, threat modelling, and engineering-level security practices.",
    featured: false,
  },
  {
    icon: Terminal,
    title: "Malware Analysis",
    level: "Mid – Senior",
    questions: 80,
    tags: ["Reverse Engineering", "Sandbox", "YARA", "Behavioral Analysis"],
    description:
      "Static and dynamic analysis questions, tool walkthroughs, and real-world malware scenario discussions.",
    featured: false,
  },
  {
    icon: Eye,
    title: "Threat Intelligence",
    level: "Mid – Senior",
    questions: 75,
    tags: ["CTI", "OSINT", "Threat Actors", "IOC Analysis"],
    description:
      "Practice intelligence cycle, attribution, and report-writing questions for CTI analyst roles.",
    featured: false,
  },
];

function Tag({ label }) {
  return (
    <span
      className="inline-flex rounded-md px-2 py-0.5 text-[10px] font-medium"
      style={{
        background: "var(--color-surface-3)",
        color: "var(--color-text-muted)",
        border: "1px solid var(--color-border)",
      }}
    >
      {label}
    </span>
  );
}

function TrackCard({
  icon: Icon,
  title,
  level,
  questions,
  tags,
  description,
  featured,
}) {
  return (
    <motion.div
      variants={fadeUp}
      whileHover={{ y: -4, transition: { duration: 0.2 } }}
      className="group relative flex flex-col gap-4 rounded-2xl border p-6 transition-colors"
      style={{
        background: featured
          ? "var(--color-accent-bg)"
          : "var(--color-surface-1)",
        borderColor: featured
          ? "var(--color-accent-border)"
          : "var(--color-border)",
        boxShadow: featured ? "0 0 0 1px var(--color-accent-border)" : "none",
      }}
    >
      {featured && (
        <div
          className="absolute right-4 top-4 rounded-full px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-wider"
          style={{ background: "var(--color-accent)", color: "#fff" }}
        >
          Most Popular
        </div>
      )}

      <div
        className="pointer-events-none absolute inset-0 rounded-2xl opacity-0 transition-opacity duration-300 group-hover:opacity-100"
        style={{
          background:
            "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(124,58,237,0.08) 0%, transparent 70%)",
        }}
      />

      <div className="relative z-10 flex items-start justify-between">
        <div
          className="flex h-10 w-10 items-center justify-center rounded-xl border"
          style={{
            background: featured
              ? "rgba(124,58,237,0.2)"
              : "var(--color-surface-2)",
            borderColor: featured
              ? "var(--color-accent-border)"
              : "var(--color-border)",
          }}
        >
          <Icon
            size={18}
            strokeWidth={1.8}
            style={{ color: "var(--color-accent)" }}
          />
        </div>

        <div className="flex flex-col items-end gap-1">
          <span
            className="text-[11px] font-semibold"
            style={{ color: "var(--color-accent)" }}
          >
            {questions}+ questions
          </span>
          <span
            className="rounded-md border px-2 py-0.5 text-[10px] font-medium"
            style={{
              borderColor: "var(--color-border)",
              color: "var(--color-text-muted)",
              background: "var(--color-surface-3)",
            }}
          >
            {level}
          </span>
        </div>
      </div>

      <div className="relative z-10 space-y-2">
        <h3
          className="text-[15px] font-semibold leading-snug"
          style={{ color: "var(--color-text-invert)" }}
        >
          {title}
        </h3>
        <p
          className="text-sm leading-relaxed"
          style={{ color: "var(--color-text-muted)" }}
        >
          {description}
        </p>
      </div>

      <div className="relative z-10 flex flex-wrap gap-1.5">
        {tags.map((tag) => (
          <Tag key={tag} label={tag} />
        ))}
      </div>

      <div
        className="absolute bottom-0 left-6 right-6 h-[1px] scale-x-0 rounded-full transition-transform duration-300 group-hover:scale-x-100"
        style={{
          background:
            "linear-gradient(90deg, transparent, var(--color-accent), transparent)",
        }}
      />
    </motion.div>
  );
}

export default function CybersecurityTracks() {
  return (
    <section
      id="cybersecurity"
      className="relative w-full"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-border-strong) 30%, var(--color-accent-border) 50%, var(--color-border-strong) 70%, transparent 100%)",
        }}
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 py-20 sm:px-6 lg:py-28">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="mb-14 flex flex-col items-center text-center"
        >
          <span
            className="mb-4 inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
            style={{
              background: "var(--color-accent-bg)",
              borderColor: "var(--color-accent-border)",
              color: "var(--color-accent)",
            }}
          >
            <ShieldAlert size={11} strokeWidth={2.5} />
            Cybersecurity Tracks
          </span>

          <h2
            className="mx-auto max-w-[620px] text-balance"
            style={{
              fontSize: "clamp(1.75rem, 4vw, 2.75rem)",
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: "-0.02em",
              color: "var(--color-text-invert)",
              margin: 0,
            }}
          >
            Built for every security role,{" "}
            <span
              style={{
                background:
                  "linear-gradient(135deg, var(--color-accent) 0%, #c084fc 100%)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              not just generic IT
            </span>
          </h2>

          <p
            className="mx-auto mt-4 max-w-[500px] text-balance text-base leading-relaxed"
            style={{ color: "var(--color-text-muted)" }}
          >
            Every cybersecurity track is built with real interview questions
            sourced from hiring managers at top security teams — not recycled
            certification dumps.
          </p>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: "-60px" }}
          className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3"
        >
          {TRACKS.map((track) => (
            <TrackCard key={track.title} {...track} />
          ))}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.55, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
          className="mt-12 flex flex-col items-center gap-2 text-center"
        >
          <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
            New questions added weekly based on real interview reports from the
            community.
          </p>
          <span
            className="text-sm font-medium"
            style={{ color: "var(--color-accent)" }}
          >
            Currently 620+ cybersecurity questions across all tracks.
          </span>
        </motion.div>
      </div>

      <div
        className="absolute bottom-0 left-0 right-0 h-px"
        style={{
          background:
            "linear-gradient(90deg, transparent 0%, var(--color-border) 50%, transparent 100%)",
        }}
      />
    </section>
  );
}
