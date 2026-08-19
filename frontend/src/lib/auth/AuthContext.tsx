"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { Profile, RoleCode } from "../api/types";
import { getMyProfile, getMockToken, syncProfile } from "../api/endpoints";
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
  loginWithSupabase: (email: string, password: string) => Promise<void>;
  registerWithSupabase: (email: string, password: string, fullName: string) => Promise<void>;
  logout: () => void;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [token, setToken] = useState<string | null>(null);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  const logout = useCallback(async () => {
    try {
      if (isSupabaseConfigured) {
        await supabase.auth.signOut().catch(() => {});
      }
    } catch (e) {
      console.error("Logout error", e);
    } finally {
      localStorage.removeItem("xoxo_auth_token");
      if (typeof sessionStorage !== "undefined") {
        sessionStorage.clear();
      }
      setToken(null);
      setProfile(null);
      if (typeof window !== "undefined") {
        if (
          window.location.pathname.startsWith("/admin") ||
          window.location.pathname === "/profile"
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
    } catch {
      localStorage.removeItem("xoxo_auth_token");
      setToken(null);
      setProfile(null);
    }
  }, []);

  useEffect(() => {
    const storedToken = localStorage.getItem("xoxo_auth_token");
    if (storedToken) {
      setToken(storedToken);
      getMyProfile()
        .then((p) => setProfile(p))
        .catch(() => {
          localStorage.removeItem("xoxo_auth_token");
          setToken(null);
          setProfile(null);
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
              email: session.user.email,
              full_name: session.user.user_metadata?.full_name,
              avatar_url: session.user.user_metadata?.avatar_url,
            });
            await refreshProfile();
          } catch (e) {
            console.error("Profile sync error:", e);
          }
        } else if (event === "SIGNED_OUT") {
          logout();
        }
      });

      return () => {
        authListener.subscription.unsubscribe();
      };
    }
  }, [logout, refreshProfile]);

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

  const loginWithSupabase = async (email: string, password: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) throw error;
      if (data.session) {
        localStorage.setItem("xoxo_auth_token", data.session.access_token);
        setToken(data.session.access_token);
        await syncProfile({
          email: data.user.email,
          full_name: data.user.user_metadata?.full_name,
        });
        await refreshProfile();
      }
    } finally {
      setIsLoading(false);
    }
  };

  const registerWithSupabase = async (email: string, password: string, fullName: string) => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: { full_name: fullName },
        },
      });
      if (error) throw error;
      if (data.session) {
        localStorage.setItem("xoxo_auth_token", data.session.access_token);
        setToken(data.session.access_token);
        await syncProfile({
          email: data.user?.email,
          full_name: fullName,
        });
        await refreshProfile();
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
        loginWithSupabase,
        registerWithSupabase,
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
