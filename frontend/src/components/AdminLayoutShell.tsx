"use client";

import { useState } from "react";
import { ShieldCheck, Menu } from "lucide-react";
import { AdminSidebar } from "./AdminSidebar";
import { AdminHeaderUser } from "./AdminHeaderUser";
import { ThemeToggle } from "./ThemeToggle";
import { AdminAuthGuard } from "./AdminAuthGuard";

export function AdminLayoutShell({ children }: { children: React.ReactNode }) {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden bg-[#f8fafc] dark:bg-black">
      {/* Responsive Sidebar (Docked on desktop, Drawer on mobile) */}
      <AdminSidebar isOpen={isMobileMenuOpen} onClose={() => setIsMobileMenuOpen(false)} />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden bg-[#f8fafc] dark:bg-black">
        {/* Top Navigation Header */}
        <header className="h-16 bg-white/95 dark:bg-black/95 backdrop-blur-md border-b border-slate-200/80 dark:border-[#1f1f1f] flex items-center justify-between px-4 sm:px-6 lg:px-8 shrink-0 shadow-xs transition-colors duration-300 z-20">
          <div className="flex items-center gap-3">
            {/* Hamburger Button on Mobile / Tablet (< 1024px) */}
            <button
              type="button"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Admin Menu"
              className="lg:hidden p-2 rounded-xl bg-slate-100 dark:bg-[#171717] hover:bg-slate-200 dark:hover:bg-[#252525] text-slate-700 dark:text-zinc-200 transition-colors cursor-pointer"
            >
              <Menu size={20} />
            </button>

            {/* Badge Indicator */}
            <span className="bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200/80 dark:border-purple-800 text-[11px] sm:text-xs font-black px-2.5 sm:px-3.5 py-1 rounded-full uppercase tracking-wider flex items-center gap-1.5 shadow-xs">
              <ShieldCheck size={14} className="text-purple-600 dark:text-purple-400 shrink-0" />
              <span className="hidden sm:inline">Authorized Console</span>
              <span className="sm:hidden">Admin</span>
            </span>
          </div>

          <div className="flex items-center gap-2.5 sm:gap-4">
            <ThemeToggle />
            <AdminHeaderUser />
          </div>
        </header>

        {/* Scrollable Page Body */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto p-4 sm:p-6 lg:p-8 bg-[#f8fafc] dark:bg-black transition-colors duration-300">
          <AdminAuthGuard>{children}</AdminAuthGuard>
        </main>
      </div>
    </div>
  );
}
