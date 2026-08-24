"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Loader2 } from "lucide-react";
import { useAuth } from "../../../lib/auth/AuthContext";

export default function LoginPage() {
  const router = useRouter();
  const { loginWithSupabase, isSupabaseEnabled, loginWithMock } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
      if (email.trim().toLowerCase().includes("admin")) {
        router.push("/admin");
      } else {
        router.push("/");
      }
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
          <div className="text-center mb-8">
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
              disabled={isLoading}
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
