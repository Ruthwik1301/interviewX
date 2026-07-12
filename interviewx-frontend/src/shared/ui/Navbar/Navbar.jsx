import { useState } from "react";
import { NavLink, useNavigate, useLocation } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Menu, X, LogOut } from "lucide-react";
import { RoutePaths } from "@/app/routes/paths";
import { useAuth } from "@/app/providers/useAuth.js";

const PUBLIC_LINKS = [
  { label: "Features", hash: "features" },
  { label: "How It Works", hash: "how-it-works" },
  { label: "Pricing", hash: "pricing" },
];

const APP_LINKS = [
  { label: "Dashboard", to: RoutePaths.appRoot, end: true },
  { label: "New Interview", to: RoutePaths.createInterview, end: false },
  { label: "Profile", to: RoutePaths.profile, end: false },
];

// Smooth scroll to a section by ID.
// If we're not on the home page, navigate there first then scroll.
function useHashScroll() {
  const navigate = useNavigate();
  const location = useLocation();

  return function scrollTo(hash) {
    if (location.pathname === "/") {
      const el = document.getElementById(hash);
      if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate(`/#${hash}`);
      // After navigation, scroll once the DOM has settled
      setTimeout(() => {
        const el = document.getElementById(hash);
        if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
      }, 120);
    }
  };
}

function PublicNavItem({ label, hash, onClick }) {
  return (
    <button
      type="button"
      onClick={() => onClick(hash)}
      className="relative inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)] transition-colors duration-150 hover:text-[color:var(--color-text)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]"
    >
      {label}
    </button>
  );
}

function AppNavItem({ to, label, end = false, onClick }) {
  return (
    <NavLink
      to={to}
      end={end}
      onClick={onClick}
      className={({ isActive }) =>
        [
          "relative inline-flex items-center rounded-lg px-3 py-2 text-sm font-medium transition-colors duration-150",
          "focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]",
          isActive
            ? "text-[color:var(--color-text)]"
            : "text-[color:var(--color-text-muted)] hover:text-[color:var(--color-text)]",
        ].join(" ")
      }
    >
      {({ isActive }) => (
        <>
          <span className="relative z-10">{label}</span>
          <motion.span
            aria-hidden="true"
            className="absolute bottom-0 left-3 right-3 h-[2px] rounded-full"
            initial={false}
            animate={{
              opacity: isActive ? 1 : 0,
              backgroundColor: "var(--color-accent)",
              scaleX: isActive ? 1 : 0.4,
            }}
            transition={{ duration: 0.2, ease: "easeOut" }}
          />
        </>
      )}
    </NavLink>
  );
}

export default function Navbar({ variant = "public" }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, initials, logout } = useAuth();
  const navigate = useNavigate();
  const scrollTo = useHashScroll();
  const closeMobile = () => setMobileOpen(false);

  function handleLogout() {
    logout();
    closeMobile();
    navigate(RoutePaths.root);
  }

  function handleHashClick(hash) {
    closeMobile();
    scrollTo(hash);
  }

  return (
    <motion.header
      initial={{ opacity: 0, y: -8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
      className="sticky top-0 z-50 w-full border-b border-[color:var(--color-border)] bg-[color:var(--color-bg)]/80 backdrop-blur-md"
    >
      <div className="mx-auto flex w-full max-w-[1200px] items-center justify-between px-4 py-3 sm:px-6">
        {/* Brand */}
        <NavLink
          to={RoutePaths.root}
          className="inline-flex items-center gap-2 rounded-lg px-2 py-1 text-[15px] font-semibold tracking-tight text-[color:var(--color-text)] transition-colors hover:bg-[color:var(--color-accent-bg)]"
        >
          <span className="flex h-6 w-6 items-center justify-center rounded-md bg-[color:var(--color-accent)] text-[11px] font-bold leading-none text-white">
            IX
          </span>
          InterviewX
        </NavLink>

        {/* Desktop nav */}
        <nav
          className="hidden items-center gap-0.5 md:flex"
          aria-label="Primary navigation"
        >
          {variant === "app"
            ? APP_LINKS.map((link) => (
                <AppNavItem
                  key={link.label}
                  to={link.to}
                  label={link.label}
                  end={link.end}
                />
              ))
            : PUBLIC_LINKS.map((link) => (
                <PublicNavItem
                  key={link.label}
                  label={link.label}
                  hash={link.hash}
                  onClick={handleHashClick}
                />
              ))}
        </nav>

        {/* Desktop actions */}
        <div className="hidden items-center gap-2 md:flex">
          {variant === "app" ? (
            <>
              <NavLink
                to={RoutePaths.profile}
                className="flex items-center gap-2 rounded-lg px-2 py-1.5 transition-colors hover:bg-[color:var(--color-surface-3)] focus:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-focus)]"
              >
                <span
                  className="flex h-7 w-7 items-center justify-center rounded-full text-[11px] font-bold text-white"
                  style={{
                    background:
                      "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                  }}
                >
                  {initials}
                </span>
                <span className="text-sm font-medium text-[color:var(--color-text)]">
                  {user?.name || "Account"}
                </span>
              </NavLink>
              <button
                type="button"
                onClick={handleLogout}
                aria-label="Log out"
                className="flex items-center justify-center rounded-lg p-2 text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text)] focus:outline-none"
              >
                <LogOut size={16} strokeWidth={2} />
              </button>
            </>
          ) : (
            <>
              <NavLink
                to={RoutePaths.login}
                className="rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text)] focus:outline-none"
              >
                Log in
              </NavLink>
              <motion.div
                whileHover={{ y: -1 }}
                whileTap={{ y: 0 }}
                transition={{ duration: 0.15 }}
              >
                <NavLink
                  to={RoutePaths.register}
                  className="inline-flex items-center justify-center rounded-lg border border-[color:var(--color-accent-border)] bg-[color:var(--color-accent-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] transition-all hover:bg-[color:var(--color-accent)] hover:text-white focus:outline-none"
                >
                  Get Started
                </NavLink>
              </motion.div>
            </>
          )}
        </div>

        {/* Mobile hamburger */}
        <button
          type="button"
          aria-label={mobileOpen ? "Close menu" : "Open menu"}
          aria-expanded={mobileOpen}
          onClick={() => setMobileOpen((o) => !o)}
          className="flex items-center justify-center rounded-lg p-2 text-[color:var(--color-text-muted)] transition-colors hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text)] md:hidden"
        >
          <AnimatePresence mode="wait" initial={false}>
            {mobileOpen ? (
              <motion.span
                key="close"
                initial={{ rotate: -45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: 45, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <X size={20} />
              </motion.span>
            ) : (
              <motion.span
                key="open"
                initial={{ rotate: 45, opacity: 0 }}
                animate={{ rotate: 0, opacity: 1 }}
                exit={{ rotate: -45, opacity: 0 }}
                transition={{ duration: 0.15 }}
              >
                <Menu size={20} />
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>

      {/* Mobile drawer */}
      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            key="mobile-drawer"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.22, ease: "easeOut" }}
            className="overflow-hidden border-t border-[color:var(--color-border)] bg-[color:var(--color-bg)]/95 backdrop-blur-md md:hidden"
          >
            <div className="mx-auto max-w-[1200px] px-4 py-3 space-y-0.5">
              {variant === "app"
                ? APP_LINKS.map((link) => (
                    <AppNavItem
                      key={link.label}
                      to={link.to}
                      label={link.label}
                      end={link.end}
                      onClick={closeMobile}
                    />
                  ))
                : PUBLIC_LINKS.map((link) => (
                    <PublicNavItem
                      key={link.label}
                      label={link.label}
                      hash={link.hash}
                      onClick={handleHashClick}
                    />
                  ))}
              <div className="flex flex-col gap-2 border-t border-[color:var(--color-border)] pt-3 mt-3">
                {variant === "app" ? (
                  <>
                    <NavLink
                      to={RoutePaths.profile}
                      onClick={closeMobile}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--color-text)] hover:bg-[color:var(--color-surface-3)]"
                    >
                      <span
                        className="flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold text-white"
                        style={{
                          background:
                            "linear-gradient(135deg, var(--color-accent) 0%, #9333ea 100%)",
                        }}
                      >
                        {initials}
                      </span>
                      {user?.name || "Account"}
                    </NavLink>
                    <button
                      type="button"
                      onClick={handleLogout}
                      className="flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-medium text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text)]"
                    >
                      <LogOut size={15} strokeWidth={2} />
                      Log out
                    </button>
                  </>
                ) : (
                  <>
                    <NavLink
                      to={RoutePaths.login}
                      onClick={closeMobile}
                      className="rounded-lg px-3 py-2 text-sm font-medium text-[color:var(--color-text-muted)] hover:bg-[color:var(--color-surface-3)] hover:text-[color:var(--color-text)]"
                    >
                      Log in
                    </NavLink>
                    <NavLink
                      to={RoutePaths.register}
                      onClick={closeMobile}
                      className="inline-flex items-center justify-center rounded-lg border border-[color:var(--color-accent-border)] bg-[color:var(--color-accent-bg)] px-4 py-2 text-sm font-semibold text-[color:var(--color-text)] transition-all hover:bg-[color:var(--color-accent)] hover:text-white"
                    >
                      Get Started
                    </NavLink>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.header>
  );
}
