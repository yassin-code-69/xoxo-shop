"use client";

import { useEffect, useState, useRef, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "@/lib/auth/supabase";
import { useAuth } from "@/lib/auth/AuthContext";
import { syncProfile } from "@/lib/api/endpoints";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function CallbackHandler() {
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const processedRef = useRef(false);

  useEffect(() => {
    if (processedRef.current) return;
    processedRef.current = true;

    async function processAuth() {
      try {
        if (!isSupabaseConfigured) {
          window.location.replace("/");
          return;
        }

        const next = searchParams.get("next") || "/";
        const code = searchParams.get("code");
        const hasNewAuth = !!code || (window.location.hash && window.location.hash !== "#");

        // Fast path 0: If already authenticated and NO new auth arriving, redirect
        const existingToken = typeof window !== "undefined" ? localStorage.getItem("xoxo_auth_token") : null;
        if (existingToken && !hasNewAuth) {
          window.location.replace(next);
          return;
        }

        // Clear stale auth state when a fresh OAuth code/hash arrives.
        // Without this, the old token stays in localStorage and the
        // AuthContext's init useEffect races with this callback, sending
        // the STALE token to the backend which returns a cached profile
        // for the wrong session.
        if (hasNewAuth) {
          localStorage.removeItem("xoxo_auth_token");
          localStorage.removeItem("xoxo_user_profile");
        }

        let sessionToken: string | null = null;
        let authUser: any = null;

        // 1. Check Hash Fragment (Implicit OAuth Flow: #access_token=...)
        if (typeof window !== "undefined" && window.location.hash && window.location.hash !== "#") {
          const hash = window.location.hash.startsWith("#")
            ? window.location.hash.substring(1)
            : window.location.hash;
          const hashParams = new URLSearchParams(hash);
          const hashToken = hashParams.get("access_token");
          const refreshToken = hashParams.get("refresh_token");

          if (hashToken) {
            sessionToken = hashToken;
            // MUST await setSession so the refresh token is persisted in
            // Supabase's internal storage before we navigate away.  Without
            // this, the API client's 401-retry path calls refreshSession()
            // but finds no stored refresh token and clears the auth token.
            if (refreshToken) {
              try {
                await supabase.auth.setSession({
                  access_token: hashToken,
                  refresh_token: refreshToken,
                });
              } catch (hashErr) {
                console.warn("Supabase setSession from hash notice:", hashErr);
              }
            }
          }
        }

        // 2. Check PKCE Authorization Code
        if (!sessionToken && code) {
          try {
            const { data, error } = await supabase.auth.exchangeCodeForSession(code);
            if (error) {
              console.error("exchangeCodeForSession error:", error.message, error);
            }
            if (!error && data?.session?.access_token) {
              sessionToken = data.session.access_token;
              authUser = data.session.user;
            } else if (!error && data?.session) {
              // Session exists but no access_token? Try getSession as fallback
              console.warn("Code exchange returned session without access_token, trying getSession");
              const { data: fallback } = await supabase.auth.getSession();
              if (fallback?.session?.access_token) {
                sessionToken = fallback.session.access_token;
                authUser = fallback.session.user;
              }
            }
          } catch (codeErr) {
            console.error("exchangeCodeForSession exception:", codeErr);
          }
        }

        // 3. Check Current Supabase Session
        if (!sessionToken) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData?.session?.access_token) {
            sessionToken = sessionData.session.access_token;
            authUser = sessionData.session.user;
          }
        }

        // If a session token was acquired:
        if (sessionToken) {
          localStorage.setItem("xoxo_auth_token", sessionToken);
          setStatus("success");

          // Fast decode JWT to populate profile in localStorage with 0 latency
          try {
            const parts = sessionToken.split(".");
            if (parts.length === 3) {
              const payload = JSON.parse(atob(parts[1]));
              const userMeta = payload.user_metadata || {};
              const userProfile = {
                id: payload.sub,
                auth_user_id: payload.sub,
                email: payload.email || userMeta.email || "",
                full_name: userMeta.full_name || userMeta.name || payload.email?.split("@")[0] || "User",
                avatar_url: userMeta.avatar_url || userMeta.picture || null,
                roles: ["CUSTOMER"],
                balance: 0,
                total_spend: 0,
                status: "ACTIVE",
                is_active: true,
              };
              localStorage.setItem("xoxo_user_profile", JSON.stringify(userProfile));

              // Await syncProfile so backend creates the record and invalidates stale cache
              try {
                await Promise.race([
                  syncProfile({
                    email: userProfile.email,
                    full_name: userProfile.full_name,
                    avatar_url: userProfile.avatar_url || undefined,
                  }),
                  new Promise((resolve) => setTimeout(resolve, 1500)),
                ]);
              } catch (syncErr) {
                console.warn("Backend profile sync notice:", syncErr);
              }
            }
          } catch {}

          // Refresh profile in AuthContext
          try {
            await refreshProfile();
          } catch {}

          // Brief delay so the user sees success feedback before redirecting
          setTimeout(() => {
            window.location.replace(next);
          }, 400);
          return;
        }

        // 4. Fallback listener if session is still arriving
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.access_token) {
            localStorage.setItem("xoxo_auth_token", session.access_token);
            setStatus("success");
            listener.subscription.unsubscribe();

            if (session.user) {
              try {
                await Promise.race([
                  syncProfile({
                    email: session.user.email,
                    full_name:
                      session.user.user_metadata?.full_name ||
                      session.user.user_metadata?.name ||
                      session.user.email?.split("@")[0],
                    avatar_url:
                      session.user.user_metadata?.avatar_url ||
                      session.user.user_metadata?.picture,
                  }),
                  new Promise((resolve) => setTimeout(resolve, 1500)),
                ]);
              } catch (syncErr) {
                console.warn("Backend profile sync notice:", syncErr);
              }
            }

            try {
              await refreshProfile();
            } catch {}

            setTimeout(() => {
              window.location.replace(next);
            }, 400);
          }
        });

        // 5. Safety timeout: give Supabase enough time to deliver the session.
        setTimeout(() => {
          listener.subscription.unsubscribe();
          const finalCheck = localStorage.getItem("xoxo_auth_token");
          if (finalCheck) {
            window.location.replace(next);
          } else {
            void supabase.auth.getSession().then(({ data }) => {
              if (data?.session?.access_token) {
                localStorage.setItem("xoxo_auth_token", data.session.access_token);
                window.location.replace(next);
              } else {
                console.warn("Auth callback: no session found after timeout, redirecting to login");
                setStatus("error");
                setErrorMessage("Authentication session expired or code already used. Please try signing in again.");
                setTimeout(() => {
                  window.location.replace("/login");
                }, 1500);
              }
            });
          }
        }, 3000);
      } catch (err: any) {
        console.error("OAuth callback processing error:", err);
        setStatus("error");
        setErrorMessage(err.message || "Failed to complete Google authentication.");
        setTimeout(() => {
          window.location.replace("/login");
        }, 1500);
      }
    }

    void processAuth();
  }, [searchParams, refreshProfile]);

  return (
    <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
      <div className="bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 max-w-sm w-full flex flex-col items-center gap-4 animate-in fade-in zoom-in-95 duration-200">
        {status === "error" ? (
          <>
            <div className="w-14 h-14 rounded-full bg-red-100 dark:bg-red-950/40 text-red-600 flex items-center justify-center">
              <AlertCircle size={28} />
            </div>
            <h2 className="font-black text-slate-900 dark:text-white text-base">Authentication Error</h2>
            <p className="text-xs text-red-600 dark:text-red-400">{errorMessage}</p>
            <p className="text-[11px] text-slate-400">Redirecting back to login...</p>
          </>
        ) : status === "success" ? (
          <>
            <div className="w-14 h-14 rounded-full bg-emerald-100 dark:bg-emerald-950/40 text-emerald-600 flex items-center justify-center">
              <CheckCircle2 size={28} />
            </div>
            <h2 className="font-black text-slate-900 dark:text-white text-base">Login Successful!</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">Redirecting to your account...</p>
          </>
        ) : (
          <>
            <div className="w-14 h-14 rounded-full bg-purple-50 dark:bg-purple-950/40 text-purple-600 flex items-center justify-center">
              <Loader2 size={28} className="animate-spin" />
            </div>
            <h2 className="font-black text-slate-900 dark:text-white text-base">Signing in with Google...</h2>
            <p className="text-xs text-slate-500 dark:text-slate-400">
              Please wait a moment while we verify your session.
            </p>
          </>
        )}
      </div>
    </div>
  );
}

export default function AuthCallbackPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center">
          <Loader2 size={32} className="animate-spin text-purple-600" />
        </div>
      }
    >
      <CallbackHandler />
    </Suspense>
  );
}
