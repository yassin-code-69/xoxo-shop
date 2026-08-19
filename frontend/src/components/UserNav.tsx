"use client";

import Link from "next/link";
import { useAuth } from "../lib/auth/AuthContext";
import { LogOut, ShoppingBag, ShieldAlert, User } from "lucide-react";

export function UserNav() {
  const { profile, isAuthenticated, isAdmin, logout } = useAuth();

  if (!isAuthenticated) {
    return (
      <div className="flex items-center gap-2">
        <Link
          href="/login"
          className="bg-purple-600 hover:bg-purple-700 text-white px-5 py-2 rounded-full font-bold text-sm transition-all shadow-md hover:shadow-lg inline-flex items-center justify-center cursor-pointer"
        >
          Login
        </Link>
      </div>
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

      <Link
        href="/profile"
        className="bg-purple-50 dark:bg-purple-950/40 hover:bg-purple-100 dark:hover:bg-purple-900/60 text-purple-700 dark:text-purple-300 text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 border border-purple-200 dark:border-purple-800/60 transition-all"
        title="View Profile"
      >
        <div className="w-5 h-5 rounded-full bg-purple-600 text-white text-[10px] font-black flex items-center justify-center">
          {profile?.full_name
            ? profile.full_name.charAt(0).toUpperCase()
            : profile?.email?.charAt(0).toUpperCase() || <User size={10} />}
        </div>
        <span className="hidden sm:inline max-w-[100px] truncate">
          {profile?.full_name || "Profile"}
        </span>
      </Link>

      <div className="flex items-center pl-1 border-l border-slate-200 dark:border-slate-700">
        <button
          onClick={logout}
          title="Logout"
          className="w-8 h-8 rounded-full bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 flex items-center justify-center hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors cursor-pointer"
        >
          <LogOut size={14} />
        </button>
      </div>
    </div>
  );
}
