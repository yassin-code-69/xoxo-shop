"use client";

import { useAuth } from "../lib/auth/AuthContext";
import { Loader2, ShieldAlert } from "lucide-react";
import Link from "next/link";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isLoading, loginWithMock } = useAuth();

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] gap-3">
        <Loader2 className="animate-spin text-purple-600" size={36} />
        <p className="text-slate-600 dark:text-zinc-400 font-medium text-xs">
          Verifying administrative authorization...
        </p>
      </div>
    );
  }

  if (!isAuthenticated || !isAdmin) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-md mx-auto text-center">
        <div className="w-16 h-16 rounded-3xl bg-red-100 dark:bg-red-950/50 text-red-600 dark:text-red-400 flex items-center justify-center mb-4 shadow-sm">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
          Admin Access Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
          You are currently signed out. Please sign in with an Administrator account to access the
          operations console.
        </p>
        <div className="flex flex-col gap-2.5 w-full">
          <Link
            href="/login"
            className="w-full bg-purple-600 hover:bg-purple-700 text-white font-bold py-2.5 px-4 rounded-xl text-xs transition-all shadow-md text-center cursor-pointer"
          >
            Go to Login Page
          </Link>
          <button
            type="button"
            onClick={() => loginWithMock("admin@xoxoshop.com", "Super Administrator", "ADMIN")}
            className="w-full bg-slate-100 dark:bg-zinc-800 hover:bg-slate-200 dark:hover:bg-zinc-700 text-slate-700 dark:text-zinc-200 font-bold py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer"
          >
            Quick Sign In as Admin
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
