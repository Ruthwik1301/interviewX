import { motion } from 'framer-motion'
import { NavLink } from 'react-router-dom'
import { ArrowRight, Sparkles } from 'lucide-react'
import { RoutePaths } from '@/app/routes/paths'

const LINKS = {
  Product: [
    { label: 'Features', to: '/#features' },
    { label: 'How It Works', to: '/#how-it-works' },
    { label: 'Product Preview', to: '/#product' },
    { label: 'AI Feedback', to: '/#ai-feedback' },
    { label: 'Pricing', to: '/#pricing' },
  ],
  Tracks: [
    { label: 'Technical', to: RoutePaths.register },
    { label: 'Coding', to: RoutePaths.register },
    { label: 'Cybersecurity', to: '/#cybersecurity' },
    { label: 'System Design', to: RoutePaths.register },
    { label: 'HR & Behavioural', to: RoutePaths.register },
  ],
  Company: [
    { label: 'About', to: '/' },
    { label: 'Blog', to: '/' },
    { label: 'Careers', to: '/' },
    { label: 'Privacy Policy', to: '/' },
    { label: 'Terms of Service', to: '/' },
  ],
}

const SOCIALS = [
  {
    label: 'GitHub',
    href: 'https://github.com',
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
      </svg>
    ),
  },
  {
    label: 'X (Twitter)',
    href: 'https://twitter.com',
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.744l7.737-8.835L1.254 2.25H8.08l4.259 5.631 5.905-5.631zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
      </svg>
    ),
  },
  {
    label: 'LinkedIn',
    href: 'https://linkedin.com',
    svg: (
      <svg width="14" height="14" viewBox="0 0 24 24" fill="currentColor">
        <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z" />
      </svg>
    ),
  },
]

export default function Footer() {
  return (
    <footer className="relative w-full" style={{ background: 'var(--color-surface-1)' }}>
      <div
        className="absolute top-0 left-0 right-0 h-px"
        style={{
          background:
            'linear-gradient(90deg, transparent 0%, var(--color-border-strong) 30%, var(--color-accent-border) 50%, var(--color-border-strong) 70%, transparent 100%)',
        }}
      />

      <div className="mx-auto w-full max-w-[1200px] px-4 sm:px-6">
        {/* CTA banner */}
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-60px' }}
          transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
          className="relative my-16 overflow-hidden rounded-2xl border px-8 py-12 text-center"
          style={{
            background: 'var(--color-accent-bg)',
            borderColor: 'var(--color-accent-border)',
          }}
        >
          <div
            aria-hidden="true"
            className="pointer-events-none absolute inset-0"
            style={{
              background:
                'radial-gradient(ellipse 70% 60% at 50% 100%, rgba(124,58,237,0.18) 0%, transparent 70%)',
            }}
          />

          <div className="relative z-10">
            <span
              className="mb-4 inline-flex items-center gap-2 rounded-full border px-3 py-1 text-[11px] font-semibold uppercase tracking-widest"
              style={{
                background: 'rgba(124,58,237,0.15)',
                borderColor: 'var(--color-accent-border)',
                color: 'var(--color-accent)',
              }}
            >
              <Sparkles size={11} strokeWidth={2.5} />
              Start Free Today
            </span>

            <h2
              className="mx-auto mt-4 max-w-[520px] text-balance"
              style={{
                fontSize: 'clamp(1.6rem, 3.5vw, 2.5rem)',
                fontWeight: 700,
                lineHeight: 1.15,
                letterSpacing: '-0.02em',
                color: 'var(--color-text-invert)',
                margin: '1rem auto 0',
              }}
            >
              Your next interview is closer than you think
            </h2>

            <p
              className="mx-auto mt-4 max-w-[420px] text-base leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              Practice with a live DSA coding room and land roles at top companies. No
              credit card required.
            </p>

            <div className="mt-8 flex flex-wrap items-center justify-center gap-3">
              <motion.div
                whileHover={{ y: -2 }}
                whileTap={{ y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <NavLink
                  to={RoutePaths.register}
                  className="inline-flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all focus:outline-none"
                  style={{
                    background: 'linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)',
                    boxShadow: '0 4px 24px rgba(124,58,237,0.4)',
                  }}
                >
                  Get Started Free
                  <ArrowRight size={15} strokeWidth={2.5} />
                </NavLink>
              </motion.div>

              <NavLink
                to={RoutePaths.login}
                className="inline-flex items-center gap-2 rounded-xl border px-6 py-3 text-sm font-semibold transition-colors focus:outline-none"
                style={{
                  borderColor: 'var(--color-accent-border)',
                  color: 'var(--color-text-muted)',
                  background: 'transparent',
                }}
              >
                Log in
              </NavLink>
            </div>
          </div>
        </motion.div>

        {/* Main footer grid */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: '-40px' }}
          transition={{ duration: 0.55, ease: [0.16, 1, 0.3, 1] }}
          className="grid grid-cols-2 gap-8 pb-12 lg:grid-cols-4"
        >
          {/* Brand column */}
          <div className="col-span-2 lg:col-span-1">
            <NavLink
              to={RoutePaths.root}
              className="inline-flex items-center gap-2 rounded-lg text-[15px] font-semibold tracking-tight"
              style={{ color: 'var(--color-text-invert)' }}
            >
              <span
                className="flex h-6 w-6 items-center justify-center rounded-md text-[11px] font-bold leading-none text-white"
                style={{ background: 'var(--color-accent)' }}
              >
                IX
              </span>
              InterviewX
            </NavLink>

            <p
              className="mt-4 max-w-[220px] text-sm leading-relaxed"
              style={{ color: 'var(--color-text-muted)' }}
            >
              AI-powered interview intelligence for candidates who want to stop guessing and start
              landing roles.
            </p>

            <div className="mt-6 flex items-center gap-2">
              {SOCIALS.map(({ label, href, svg }) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  aria-label={label}
                  className="flex h-8 w-8 items-center justify-center rounded-lg border transition-colors hover:border-[color:var(--color-accent-border)] hover:bg-[color:var(--color-accent-bg)]"
                  style={{
                    borderColor: 'var(--color-border)',
                    color: 'var(--color-text-muted)',
                  }}
                >
                  {svg}
                </a>
              ))}
            </div>
          </div>

          {/* Link columns */}
          {Object.entries(LINKS).map(([group, links]) => (
            <div key={group}>
              <p
                className="mb-4 text-[11px] font-bold uppercase tracking-widest"
                style={{ color: 'var(--color-text-muted)' }}
              >
                {group}
              </p>
              <ul className="space-y-2.5">
                {links.map(({ label, to }) => (
                  <li key={label}>
                    <NavLink
                      to={to}
                      className="text-sm transition-colors hover:text-[color:var(--color-text-invert)]"
                      style={{ color: 'var(--color-text-muted)' }}
                    >
                      {label}
                    </NavLink>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </motion.div>

        {/* Bottom bar */}
        <div
          className="flex flex-col items-center justify-between gap-3 border-t py-6 text-[12px] sm:flex-row"
          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-muted)' }}
        >
          <span>© {new Date().getFullYear()} InterviewX. All rights reserved.</span>
          <span className="flex items-center gap-1.5">
            Built with
            <span style={{ color: 'var(--color-accent)' }}>♥</span>
            for candidates who deserve better prep.
          </span>
        </div>
      </div>
    </footer>
  )
}