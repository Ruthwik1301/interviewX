import { useCallback, useEffect, useState } from "react";
import { AuthContext } from "./AuthContext.js";
import { api, getToken, setToken } from "@/shared/lib/api.js";

function initials(name) {
  if (!name) return "U";
  const parts = name.trim().split(/\s+/);
  const first = parts[0]?.[0] ?? "";
  const last = parts.length > 1 ? parts[parts.length - 1][0] : "";
  return (first + last).toUpperCase() || "U";
}

const API_BASE = import.meta.env.VITE_API_URL || "http://localhost:5000";

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(() => !!getToken());
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    const token = getToken();
    if (!token) return;

    api
      .get("/api/auth/me")
      .then(({ user }) => setUser(user))
      .catch(() => {
        setToken(null);
        setUser(null);
      })
      .finally(() => setIsLoading(false));
  }, []);

  const login = useCallback(async ({ email, password }) => {
    setIsSubmitting(true);
    try {
      const { token, user } = await api.post(
        "/api/auth/login",
        { email, password },
        { auth: false },
      );
      setToken(token);
      setUser(user);
      return user;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const register = useCallback(async ({ name, email, password }) => {
    setIsSubmitting(true);
    try {
      const { token, user } = await api.post(
        "/api/auth/register",
        { name, email, password },
        { auth: false },
      );
      setToken(token);
      setUser(user);
      return user;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  const updateProfile = useCallback(async (patch) => {
    const { user } = await api.put("/api/profile", patch);
    setUser(user);
    return user;
  }, []);

  const refreshUser = useCallback(async () => {
    const { user } = await api.get("/api/auth/me");
    setUser(user);
    return user;
  }, []);

  const loginWithGoogle = useCallback(() => {
    window.location.href = `${API_BASE}/api/auth/google`;
  }, []);

  const value = {
    user,
    isAuthenticated: !!user,
    isLoading,
    isSubmitting,
    initials: initials(user?.name),
    login,
    register,
    logout,
    updateProfile,
    refreshUser,
    loginWithGoogle,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
