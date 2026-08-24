"use client";

import { useAuth } from "../lib/auth/AuthContext";
import { Loader2, ShieldAlert, KeyRound, ArrowRight } from "lucide-react";
import Link from "next/link";

export function AdminAuthGuard({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isAdmin, isSupport, isLoading } = useAuth();

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

  const hasAccess = isAuthenticated && (isAdmin || isSupport);

  if (!hasAccess) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] p-6 max-w-md mx-auto text-center animate-in fade-in zoom-in-95 duration-200">
        <div className="w-16 h-16 rounded-3xl bg-purple-100 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 flex items-center justify-center mb-4 shadow-sm border border-purple-200 dark:border-purple-800/60">
          <ShieldAlert size={32} />
        </div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white mb-1">
          Admin Authorization Required
        </h2>
        <p className="text-xs text-slate-500 dark:text-zinc-400 mb-6 leading-relaxed">
          Access to the XoXo Shop operations console requires Administrator or Support role
          credentials.
        </p>

        <div className="flex flex-col gap-2.5 w-full">
          <Link
            href="/login"
            className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white font-bold py-3 px-4 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2 cursor-pointer text-center"
          >
            <KeyRound size={16} />
            <span>Sign in with Admin Credentials</span>
            <ArrowRight size={14} />
          </Link>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
