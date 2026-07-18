import { motion } from "framer-motion";

const COMPANIES = [
  "Google",
  "Meta",
  "Stripe",
  "Amazon",
  "Microsoft",
  "Netflix",
];

export default function TrustedBy() {
  return (
    <section
      className="relative w-full py-14 sm:py-16"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        <motion.p
          initial={{ opacity: 0, y: 12 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.45 }}
          className="mb-8 text-center text-[11px] font-bold uppercase tracking-widest"
          style={{ color: "var(--color-text-muted)" }}
        >
          Practice with real interview questions asked at
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-40px" }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="flex flex-wrap items-center justify-center gap-x-10 gap-y-5 sm:gap-x-14"
        >
          {COMPANIES.map((name) => (
            <span
              key={name}
              className="text-[19px] font-semibold tracking-tight grayscale opacity-50 transition-all hover:opacity-90 hover:grayscale-0 sm:text-[22px]"
              style={{ color: "var(--color-text-invert)" }}
            >
              {name}
            </span>
          ))}
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
