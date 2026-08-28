"use client";

import { useEffect, useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase, isSupabaseConfigured } from "../../../lib/auth/supabase";
import { useAuth } from "../../../lib/auth/AuthContext";
import { syncProfile } from "../../../lib/api/endpoints";
import { Loader2, CheckCircle2, AlertCircle } from "lucide-react";

function CallbackHandler() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refreshProfile } = useAuth();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function processAuth() {
      try {
        if (!isSupabaseConfigured) {
          router.replace("/");
          return;
        }

        const code = searchParams.get("code");
        const next = searchParams.get("next") || "/";

        let sessionToken: string | null = null;

        // 1. If authorization code exists (PKCE flow)
        if (code) {
          const { data, error } = await supabase.auth.exchangeCodeForSession(code);
          if (error) {
            console.error("exchangeCodeForSession error:", error);
            throw error;
          }
          if (data.session?.access_token) {
            sessionToken = data.session.access_token;
            // Sync user details to backend
            try {
              await syncProfile({
                email: data.session.user?.email,
                full_name:
                  data.session.user?.user_metadata?.full_name ||
                  data.session.user?.user_metadata?.name ||
                  data.session.user?.email?.split("@")[0],
                avatar_url:
                  data.session.user?.user_metadata?.avatar_url ||
                  data.session.user?.user_metadata?.picture,
              });
            } catch (syncErr) {
              console.warn("Backend profile sync warning:", syncErr);
            }
          }
        }

        // 2. If session token was not retrieved from code, check current session
        if (!sessionToken) {
          const { data: sessionData } = await supabase.auth.getSession();
          if (sessionData.session?.access_token) {
            sessionToken = sessionData.session.access_token;
          }
        }

        if (sessionToken) {
          localStorage.setItem("xoxo_auth_token", sessionToken);
          await refreshProfile();
          if (isMounted) {
            setStatus("success");
            setTimeout(() => {
              router.replace(next);
            }, 600);
          }
          return;
        }

        // 3. Fallback: wait for onAuthStateChange
        const { data: listener } = supabase.auth.onAuthStateChange(async (event, session) => {
          if (session?.access_token) {
            localStorage.setItem("xoxo_auth_token", session.access_token);
            try {
              await syncProfile({
                email: session.user?.email,
                full_name:
                  session.user?.user_metadata?.full_name ||
                  session.user?.user_metadata?.name ||
                  session.user?.email?.split("@")[0],
                avatar_url:
                  session.user?.user_metadata?.avatar_url ||
                  session.user?.user_metadata?.picture,
              });
            } catch (syncErr) {
              console.warn("Backend profile sync warning:", syncErr);
            }
            await refreshProfile();
            if (isMounted) {
              setStatus("success");
              router.replace(next);
            }
          }
        });

        // 4. Timeout fallback
        setTimeout(() => {
          if (isMounted && status === "loading") {
            router.replace("/");
          }
        }, 3500);

        return () => {
          listener.subscription.unsubscribe();
        };
      } catch (err: any) {
        console.error("OAuth callback processing error:", err);
        if (isMounted) {
          setStatus("error");
          setErrorMessage(err.message || "Failed to complete Google authentication.");
          setTimeout(() => {
            router.replace("/login");
          }, 3000);
        }
      }
    }

    processAuth();

    return () => {
      isMounted = false;
    };
  }, [router, searchParams, refreshProfile]);

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
