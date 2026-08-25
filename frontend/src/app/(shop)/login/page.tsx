"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";

function GoogleIcon({ className = "w-5 h-5" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="none">
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
        fill="#EA4335"
      />
    </svg>
  );
}

export default function LoginPage() {
  const router = useRouter();
  const { loginWithGoogle, loginWithSupabase, isSupabaseEnabled, loginWithMock } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGoogleLogin = async () => {
    setIsGoogleLoading(true);
    setError(null);
    try {
      await loginWithGoogle();
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to authenticate with Google.";
      setError(msg);
      setIsGoogleLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !password) {
      setError("Please enter both email and password.");
      return;
    }
    setIsLoading(true);
    setError(null);
    try {
      if (isSupabaseEnabled) {
        await loginWithSupabase(email.trim(), password);
      } else {
        await loginWithMock(
          email.trim(),
          email.trim().split("@")[0],
          email.includes("admin") ? "ADMIN" : "CUSTOMER",
        );
      }
      router.push("/");
    } catch (err: unknown) {
      const msg =
        err instanceof Error ? err.message : "Failed to sign in. Please verify your credentials.";
      setError(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col items-center justify-center py-12 px-4 sm:px-6 lg:px-8 max-w-7xl mx-auto min-h-[70vh]">
      <div className="w-full max-w-md bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden">
        <div className="p-8">
          <div className="text-center mb-6">
            <h1 className="text-3xl font-black text-slate-900 dark:text-white mb-2">Sign In</h1>
            <p className="text-slate-500 dark:text-slate-400 text-xs sm:text-sm">
              Sign in to your XoXo Shop account to order top-ups and track deliveries
            </p>
          </div>

          {error && (
            <div className="mb-5 p-3.5 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 text-xs font-semibold">
              {error}
            </div>
          )}

          {/* 1. Google OAuth Button */}
          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={isGoogleLoading || isLoading}
            className="w-full bg-white dark:bg-slate-800 hover:bg-slate-50 dark:hover:bg-slate-700/80 text-slate-800 dark:text-white font-bold py-3.5 px-4 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm hover:shadow-md transition-all flex items-center justify-center gap-3 text-xs sm:text-sm mb-6 disabled:opacity-60 cursor-pointer"
          >
            {isGoogleLoading ? (
              <>
                <Loader2 size={18} className="animate-spin text-purple-600" />
                Connecting to Google...
              </>
            ) : (
              <>
                <GoogleIcon className="w-5 h-5" />
                Continue with Google
              </>
            )}
          </button>

          {/* Divider */}
          <div className="relative flex py-2 items-center mb-6">
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
            <span className="flex-shrink mx-4 text-[10px] font-bold tracking-widest text-slate-400 uppercase">
              OR CONTINUE WITH EMAIL
            </span>
            <div className="flex-grow border-t border-slate-200 dark:border-slate-800"></div>
          </div>

          {/* 2. Email & Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Mail size={16} className="text-slate-400" />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 mb-1.5">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3.5 flex items-center pointer-events-none">
                  <Lock size={16} className="text-slate-400" />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-xs focus:outline-none focus:border-purple-500 focus:bg-white dark:focus:bg-slate-900 transition-all text-slate-800 dark:text-white"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={isLoading || isGoogleLoading}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-wider transition-all shadow-lg hover:shadow-xl active:scale-[0.98] flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <Loader2 size={16} className="animate-spin" /> Signing In...
                </>
              ) : (
                <>
                  Sign In <ArrowRight size={15} />
                </>
              )}
            </button>
          </form>
        </div>

        <div className="bg-slate-50 dark:bg-slate-800/50 p-6 text-center border-t border-slate-200 dark:border-slate-800">
          <p className="text-xs font-medium text-slate-600 dark:text-slate-400">
            Don&apos;t have an account?{" "}
            <Link
              href="/register"
              className="text-purple-600 hover:text-purple-700 dark:text-purple-400 font-bold"
            >
              Sign up now
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
