import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAuth } from "./providers/useAuth.js";
import { RoutePaths } from "./routes/paths.js";

// Simple full-screen loading state while we verify a stored token on first load.
function AuthChecking() {
  return (
    <div
      className="flex min-h-screen w-full items-center justify-center"
      style={{ background: "var(--color-bg)" }}
    >
      <div
        className="h-6 w-6 animate-spin rounded-full border-2 border-t-transparent"
        style={{
          borderColor: "var(--color-accent)",
          borderTopColor: "transparent",
        }}
        role="status"
        aria-label="Checking session"
      />
    </div>
  );
}

// Wrap routes that require a logged-in user (e.g. /app/*).
// Redirects to /login and remembers where the user was headed.
export function RequireAuth() {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return <AuthChecking />;
  }
  if (!isAuthenticated) {
    return (
      <Navigate to={RoutePaths.login} state={{ from: location }} replace />
    );
  }
  return <Outlet />;
}

// Wrap routes that should redirect away if already logged in (e.g. /login, /register).
export function RedirectIfAuthed() {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return <AuthChecking />;
  }
  if (isAuthenticated) {
    return <Navigate to={RoutePaths.appRoot} replace />;
  }
  return <Outlet />;
}
