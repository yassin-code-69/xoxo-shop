"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth/AuthContext";
import { LogOut, ShoppingBag, ShieldAlert } from "lucide-react";

export function UserNav() {
  const { profile, isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <Link
        href="/login"
        className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center"
      >
        Login
      </Link>
    );
  }

  return (
    <div className="flex items-center gap-2">
      {isAdmin && (
        <Link
          href="/admin"
          className="bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 shadow-sm transition-all"
        >
          <ShieldAlert size={14} /> Admin
        </Link>
      )}

      <Link
        href="/orders"
        className="bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-200 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 transition-all"
      >
        <ShoppingBag size={14} /> Orders
      </Link>

      <div className="flex items-center gap-2 pl-2 border-l border-slate-200 dark:border-slate-700">
        <span className="text-xs font-bold text-slate-700 dark:text-slate-300 hidden sm:inline max-w-[120px] truncate">
          {profile?.full_name || profile?.email}
        </span>
        <button
          onClick={logout}
          title="Logout"
          className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 transition-colors"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
