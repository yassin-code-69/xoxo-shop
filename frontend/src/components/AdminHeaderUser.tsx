"use client";

import { useAuth } from "../lib/auth/AuthContext";
import { LogOut } from "lucide-react";

export function AdminHeaderUser() {
  const { profile, logout } = useAuth();

  const handleLogout = (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
  };

  return (
    <div className="flex items-center gap-3">
      <div className="flex flex-col text-right">
        <span className="text-xs font-bold text-slate-800 dark:text-zinc-200">
          {profile?.full_name || "Admin User"}
        </span>
        <span className="text-[10px] font-semibold text-purple-600 dark:text-purple-400">
          {profile?.roles?.join(", ") || "ADMIN"}
        </span>
      </div>
      <div className="w-9 h-9 rounded-full bg-purple-600 text-white font-black text-sm flex items-center justify-center shadow-sm">
        {profile?.full_name?.charAt(0) || "A"}
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
