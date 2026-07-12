import { useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { setToken } from "@/shared/lib/api.js";
import { useAuth } from "@/app/providers/useAuth.js";
import { RoutePaths } from "@/app/routes/paths.js";

/**
 * Landing page for /auth/google/success?token=...
 * Reads the JWT from the URL, stores it, loads the user profile,
 * then redirects to the dashboard.
 */
export default function GoogleCallbackPage() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { refreshUser } = useAuth();
  const handled = useRef(false);

  useEffect(() => {
    if (handled.current) return;
    handled.current = true;

    const token = searchParams.get("token");
    const error = searchParams.get("error");

    if (error || !token) {
      navigate(`${RoutePaths.login}?error=${error ?? "google_failed"}`, {
        replace: true,
      });
      return;
    }

    // Store the JWT exactly like the normal login flow does
    setToken(token);

    // Refresh the AuthContext so the user is recognised everywhere
    refreshUser()
      .then(() => navigate(RoutePaths.appRoot, { replace: true }))
      .catch(() => navigate(RoutePaths.login, { replace: true }));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div
      className="flex min-h-screen w-full items-center justify-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div className="flex flex-col items-center gap-4">
        <div
          className="h-7 w-7 animate-spin rounded-full border-2"
          style={{
            borderColor: "var(--color-accent)",
            borderTopColor: "transparent",
          }}
        />
        <p className="text-sm" style={{ color: "var(--color-text-muted)" }}>
          Signing you in with Google…
        </p>
      </div>
    </div>
  );
}
