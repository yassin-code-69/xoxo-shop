"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Profile, RoleCode } from "../api/types";
import {
  getMyProfile,
  getMockToken,
  syncProfile,
  loginWithBackend,
  registerWithBackend,
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

  const logout = useCallback(async () => {
    if (isLoggingOutRef.current) return;
    isLoggingOutRef.current = true;

    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.error("Logout error:", e);
    } finally {
      localStorage.removeItem("xoxo_auth_token");
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
      setProfile(p);
    } catch (err: unknown) {
      if (err instanceof ApiError && err.status === 401) {
        localStorage.removeItem("xoxo_auth_token");
        setToken(null);
        setProfile(null);
      } else {
        // Fallback: If FastAPI backend is down, query profile directly from Supabase
        if (isSupabaseConfigured) {
          try {
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

                setProfile({
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
        console.warn("Failed to refresh profile (non-401 error):", err);
      }
    }
  }, []);

  useEffect(() => {
    const storedToken =
      typeof window !== "undefined" ? localStorage.getItem("xoxo_auth_token") : null;
    if (storedToken) {
      setToken(storedToken);
      getMyProfile()
        .then((p) => setProfile(p))
        .catch(() => {
          // If stored token failed on backend, try direct Supabase session
          if (isSupabaseConfigured) {
            void refreshProfile();
          } else {
            if (typeof window !== "undefined") {
              localStorage.removeItem("xoxo_auth_token");
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
          if (!isLoggingOutRef.current) {
            void logout();
          }
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [logout, refreshProfile]);

  const loginWithGoogle = async () => {
    setIsLoading(true);
    try {
      if (!isSupabaseConfigured) {
        throw new Error("Supabase authentication is not configured.");
      }
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
        setProfile(res.user);
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
        setProfile(res.user);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const loginWithSupabase = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      if (isSupabaseConfigured) {
        try {
          const { data, error } = await supabase.auth.signInWithPassword({ email, password });
          if (!error && data.session) {
            localStorage.setItem("xoxo_auth_token", data.session.access_token);
            setToken(data.session.access_token);
            await syncProfile({
              email: data.user.email,
              full_name: data.user.user_metadata?.full_name,
            });
            await refreshProfile();
            return;
          }
        } catch (supaErr) {
          console.warn("Supabase signIn failed, falling back to backend DB auth:", supaErr);
        }
      }
      // Direct Backend Auth Fallback (Works for admin and direct database users)
      const res = await loginWithBackend({ email, password });
      if (res?.access_token) {
        localStorage.setItem("xoxo_auth_token", res.access_token);
        setToken(res.access_token);
        setProfile(res.user);
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
