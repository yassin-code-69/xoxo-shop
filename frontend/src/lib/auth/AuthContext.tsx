"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Profile, RoleCode } from "../api/types";
import {
  getMyProfile,
  getMockToken,
  syncProfile,
  loginWithBackend,
  registerWithBackend,
  logoutBackend,
} from "../api/endpoints";
import { ApiError } from "../api/client";
import { supabase, isSupabaseConfigured } from "./supabase";

interface AuthContextType {
  token: string | null;
  profile: Profile | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isSupport: boolean;
  isLoading: boolean;
  isSupabaseEnabled: boolean;
  loginWithMock: (email: string, fullName: string, role?: RoleCode) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  loginWithSupabase: (email: string, password: string) => Promise<void>;
  registerWithSupabase: (email: string, password: string, fullName: string) => Promise<void>;
  loginWithBackend: (email: string, password: string) => Promise<void>;
  registerWithBackend: (
    email: string,
    password: string,
    fullName?: string,
    phone?: string,
  ) => Promise<void>;
  logout: () => Promise<void>;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const isLoggingOutRef = React.useRef(false);

  const updateProfile = useCallback((p: Profile | null) => {
    setProfile(p);
    if (typeof window !== "undefined") {
      if (p) {
        localStorage.setItem("xoxo_user_profile", JSON.stringify(p));
      } else {
        localStorage.removeItem("xoxo_user_profile");
      }
    }
  }, []);

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    if (typeof window !== "undefined" && window.location.pathname.includes("/auth/callback")) {
      return; // Never log out while on OAuth callback page
    }
    isLoggingOutRef.current = true;

    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => {});
      }
      // Notify backend to invalidate cached user session
      void logoutBackend().catch(() => {});
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      localStorage.removeItem("xoxo_auth_token");
      localStorage.removeItem("xoxo_user_profile");
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear();
      }
      setToken(null);
      setProfile(null);
      isLoggingOutRef.current = false;

      if (typeof window !== "undefined") {
        const path = window.location.pathname;
        if (
          path.startsWith("/admin") ||
          path.startsWith("/profile") ||
          path.startsWith("/orders") ||
          path.startsWith("/settings")
        ) {
          window.location.replace(window.location.origin + "/login");
        }
      }
    }
  }, []);

  const refreshProfile = useCallback(async () => {
    try {
      const p = await getMyProfile();
      if (p) {
        updateProfile(p);
        return;
      }
    } catch (err: unknown) {
      console.warn("Backend getMyProfile failed, attempting direct Supabase resolution:", err);
    }

    // Direct Supabase Fallback: If FastAPI backend profile fetch fails or Supabase session active
    if (isSupabaseConfigured) {
      try {
        const { data: sessionData } = await supabase.auth.getSession();
        if (sessionData?.session?.access_token) {
          localStorage.setItem("xoxo_auth_token", sessionData.session.access_token);
          setToken(sessionData.session.access_token);
        }

        const { data: userData } = await supabase.auth.getUser();
        if (userData?.user) {
          const u = userData.user;
          const { data: prof } = await supabase
            .from("profiles")
            .select("*")
            .eq("auth_user_id", u.id)
            .maybeSingle();

          if (prof) {
            const { data: rolesData } = await supabase
              .from("user_roles")
              .select("role_code")
              .eq("user_id", prof.id);

            const roles =
              rolesData && rolesData.length > 0
                ? rolesData.map((r: { role_code: string }) => r.role_code)
                : ["CUSTOMER"];

            updateProfile({
              id: prof.id,
              auth_user_id: prof.auth_user_id,
              email: prof.email || u.email || "",
              full_name: prof.full_name || u.user_metadata?.full_name,
              phone: prof.phone,
              avatar_url: prof.avatar_url || u.user_metadata?.avatar_url,
              status: prof.status || "ACTIVE",
              is_active: prof.is_active ?? true,
              balance: Number(prof.balance || 0),
              total_spend: Number(prof.total_spend || 0),
              current_rank: prof.current_rank || "Bronze",
              rank_level: Number(prof.rank_level || 1),
              roles,
              created_at: prof.created_at,
              updated_at: prof.updated_at,
            });
            return;
          }
        }
      } catch (supaErr) {
        console.warn("Direct Supabase fallback fetch failed:", supaErr);
      }
    }

    // If both backend and Supabase checks failed, clear invalid token.
    // BUT: don't clear during OAuth callback flow — the token may be valid
    // but the backend/Supabase haven't fully synced yet.
    if (typeof window !== "undefined") {
      const isCallbackFlow = window.location.pathname.includes("/auth/callback");
      if (!isCallbackFlow) {
        localStorage.removeItem("xoxo_auth_token");
        localStorage.removeItem("xoxo_user_profile");
        setToken(null);
        setProfile(null);
      }
    }
  }, [updateProfile]);

  useEffect(() => {
    // If on callback page with incoming OAuth code or hash, let CallbackHandler handle auth
    if (typeof window !== "undefined" && window.location.pathname.includes("/auth/callback")) {
      const urlParams = new URLSearchParams(window.location.search);
      if (urlParams.get("code") || (window.location.hash && window.location.hash !== "#")) {
        setIsLoading(false);
        return;
      }
    }

    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("xoxo_auth_token") : null;
    const storedProfile =
      typeof window !== "undefined" ? localStorage.getItem("xoxo_user_profile") : null;

    if (storedProfile) {
      try {
        const parsed = JSON.parse(storedProfile);
        setProfile(parsed);
      } catch {
        // ignore parse error
      }
    }

    if (storedToken) {
      setToken(storedToken);
      getMyProfile()
        .then((p) => {
          if (p) updateProfile(p);
        })
        .catch(() => {
          // If stored token failed on backend, try direct Supabase session
          if (isSupabaseConfigured) {
            void refreshProfile();
          } else {
            if (typeof window !== "undefined") {
              localStorage.removeItem("xoxo_auth_token");
              localStorage.removeItem("xoxo_user_profile");
            }
            setToken(null);
            setProfile(null);
          }
        })
        .finally(() => setIsLoading(false));
    } else {
      setIsLoading(false);
    }

    if (isSupabaseConfigured) {
      const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
        if (session?.access_token) {
          localStorage.setItem("xoxo_auth_token", session.access_token);
          setToken(session.access_token);
          try {
            await syncProfile({
              email: session.user?.email,
              full_name:
                session.user?.user_metadata?.full_name ||
                session.user?.user_metadata?.name ||
                session.user?.email?.split("@")[0],
              avatar_url:
                session.user?.user_metadata?.avatar_url || session.user?.user_metadata?.picture,
            });
          } catch (e: unknown) {
            if (!(e instanceof ApiError && e.status === 401)) {
              console.warn("Profile sync skipped:", e);
            }
          }
          await refreshProfile();
        } else if (event === "SIGNED_OUT") {
          // Never log out while on OAuth callback flow
          if (typeof window !== "undefined" && window.location.pathname.includes("/auth/callback")) {
            return;
          }
          // If a backend token is in localStorage, verify before logging out
          const stored = typeof window !== "undefined" ? localStorage.getItem("xoxo_auth_token") : null;
          if (stored) {
            getMyProfile()
              .then((p) => {
                if (p) updateProfile(p);
              })
              .catch(() => {
                if (!isLoggingOutRef.current) {
                  void logout();
                }
              });
          } else if (!isLoggingOutRef.current) {
            void logout();
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [logout, refreshProfile, updateProfile]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase authentication is not configured.");
      }

      // Clear any stale tokens or cached profiles before initiating OAuth flow
      if (typeof window !== "undefined") {
        localStorage.removeItem("xoxo_auth_token");
        localStorage.removeItem("xoxo_user_profile");
      }
      setToken(null);
      setProfile(null);

      const origin = typeof window !== "undefined" ? window.location.origin : "";
      const redirectTo = `${origin}/auth/callback`;

      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo,
          queryParams: {
            access_type: "offline",
            prompt: "consent",
          },
        },
      });

      if (error) {
        throw error;
      }
    } catch (err: unknown) {
      console.error("Google sign-in error:", err);
      throw err;
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithMock = async (email: string, fullName: string, role: RoleCode = "CUSTOMER") => {
    setIsLoading(true);
    try {
      const res = await getMockToken(email, fullName, role);
      localStorage.setItem("xoxo_auth_token", res.access_token);
      setToken(res.access_token);
      await refreshProfile();
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithBackendHandler = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const res = await loginWithBackend({ email, password });
      if (res?.access_token) {
        localStorage.setItem("xoxo_auth_token", res.access_token);
        setToken(res.access_token);
        updateProfile(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithBackendHandler = async (
    email: string,
    password: string,
    fullName?: string,
    phone?: string,
  ) => {
    setIsLoading(true);
    try {
      const res = await registerWithBackend({ email, password, full_name: fullName, phone });
      if (res?.access_token) {
        localStorage.setItem("xoxo_auth_token", res.access_token);
        setToken(res.access_token);
        updateProfile(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSupabase = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const cleanEmail = email.trim().toLowerCase();

      // If logging in with an admin account, go directly to backend authentication
      // to avoid 1-2 seconds of wasted Supabase Cloud round-trip latency
      if (cleanEmail.includes("admin")) {
        const res = await loginWithBackend({ email: cleanEmail, password });
        if (res?.access_token) {
          localStorage.setItem("xoxo_auth_token", res.access_token);
          setToken(res.access_token);
          updateProfile(res.user);
          return;
        }
      }

      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email: cleanEmail, password });
          if (!error && data?.session) {
            localStorage.setItem("xoxo_auth_token", data.session.access_token);
            setToken(data.session.access_token);

            // Sync user details to backend non-blockingly
            void syncProfile({
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name,
            }).catch(() => {});

            await refreshProfile();
            return;
          }
        } catch (supaErr) {
          console.warn("Supabase signIn failed, falling back to backend DB auth:", supaErr);
        }
      }

      // Direct Backend Auth Fallback (Works for direct database users)
      const res = await loginWithBackend({ email: cleanEmail, password });
      if (res?.access_token) {
        localStorage.setItem("xoxo_auth_token", res.access_token);
        setToken(res.access_token);
        updateProfile(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithSupabase = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
              data: { full_name: fullName },
            },
          });
          if (!error && data.session) {
            localStorage.setItem("xoxo_auth_token", data.session.access_token);
            setToken(data.session.access_token);
            await syncProfile({
              email: data.user?.email,
              full_name: fullName,
            });
            await refreshProfile();
            return;
          }
        } catch (supaErr) {
          console.warn("Supabase signUp failed, falling back to backend DB registration:", supaErr);
        }
      }
      // Direct Backend Auth Fallback
      const res = await registerWithBackend({ email, password, full_name: fullName });
      if (res?.access_token) {
        localStorage.setItem("xoxo_auth_token", res.access_token);
        setToken(res.access_token);
        setProfile(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const isAdmin = Boolean(profile?.roles?.some((r) => r === "ADMIN" || r === "SUPER_ADMIN"));
  const isSupport = Boolean(
    profile?.roles?.some((r) => r === "SUPPORT" || r === "ADMIN" || r === "SUPER_ADMIN"),
  );

  return (
    <AuthContext.Provider
      value={{
        token,
        profile,
        isAuthenticated: Boolean(token && profile),
        isAdmin,
        isSupport,
        isLoading,
        isSupabaseEnabled: isSupabaseConfigured,
        loginWithMock,
        loginWithGoogle,
        loginWithSupabase,
        registerWithSupabase,
        loginWithBackend: loginWithBackendHandler,
        registerWithBackend: registerWithBackendHandler,
        logout,
        refreshProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
