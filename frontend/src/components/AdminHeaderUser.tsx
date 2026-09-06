"use client";

import { useAuth } from "../lib/auth/AuthContext";
import { LogOut, UserCircle, LogIn } from "lucide-react";
import Link from "next/link";

export function AdminHeaderUser() {
  const { profile, logout, isAuthenticated } = useAuth();

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    void logout();
  };

  if (!isAuthenticated || !profile) {
    return (
      <Link
        href="/login?redirect=/admin"
        className="flex items-center gap-2 bg-purple-50 dark:bg-purple-950/60 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800 text-xs font-bold px-3 py-1.5 rounded-xl transition-all shadow-xs cursor-pointer"
      >
        <LogIn size={14} />
        <span>Admin Sign In</span>
      </Link>
    );
  }

  const displayName = profile.full_name || profile.email.split("@")[0];
  const displayRole = profile.roles?.length ? profile.roles.join(", ") : "ADMIN";
  const initial = (displayName.charAt(0) || "A").toUpperCase();

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col text-right">
        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200 max-w-[150px] truncate">
          {displayName}
        </span>
        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
          {displayRole}
        </span>
      </div>
      <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-sm shrink-0">
        {initial}
      </div>
      <button
        type="button"
        onClick={handleLogout}
        title="Sign Out"
        className="w-8 h-8 rounded-full bg-slate-100 dark:bg-zinc-800 hover:bg-red-50 dark:hover:bg-red-950/40 hover:text-red-600 dark:hover:text-red-400 text-slate-600 dark:text-zinc-300 flex items-center justify-center transition-colors ml-1 cursor-pointer"
      >
        <LogOut size={15} />
      </button>
    </div>
  );
}
