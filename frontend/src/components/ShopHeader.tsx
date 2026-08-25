"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Home, LayoutGrid, Headset, PlaySquare, User, CreditCard } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import { UserNav } from "./UserNav";
import { useAuth } from "../lib/auth/AuthContext";
import { ProfileDrawer } from "./ProfileDrawer";
import { AddMoneyModal } from "./AddMoneyModal";

export function ShopHeader() {
  const pathname = usePathname();
  const { profile, isAuthenticated } = useAuth();
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  const [isAddMoneyOpen, setIsAddMoneyOpen] = useState(false);

  return (
    <>
      <header className="bg-white/95 dark:bg-[#120b22]/95 backdrop-blur-md sticky top-0 z-40 shadow-xs border-b border-slate-100 dark:border-purple-950/60 transition-colors duration-300">
        <div className="container mx-auto px-3 sm:px-4 max-w-6xl h-12 sm:h-16 md:h-20 flex items-center justify-between">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 select-none group">
            <img
              src="/xoxo_logo.png"
              alt="XoXo Shop"
              className="h-8 sm:h-10 md:h-12 w-auto object-contain transition-transform group-hover:scale-105"
            />
          </Link>

          {/* Desktop Navigation Links */}
          <nav className="hidden md:flex items-center gap-8">
            <Link
              href="/"
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${
                pathname === "/"
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
            >
              <Home size={16} /> Home
            </Link>
            <Link
              href="/uid-topup"
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${
                pathname.startsWith("/uid-topup")
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
            >
              <LayoutGrid size={16} /> Topup
            </Link>
            <Link
              href="/tutorial"
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${
                pathname.startsWith("/tutorial")
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
            >
              <PlaySquare size={16} /> Tutorial
            </Link>
            <Link
              href="/contact"
              className={`text-sm font-bold transition-colors flex items-center gap-2 ${
                pathname.startsWith("/contact")
                  ? "text-purple-600 dark:text-purple-400"
                  : "text-slate-700 dark:text-slate-300 hover:text-purple-600 dark:hover:text-purple-400"
              }`}
            >
              <Headset size={16} /> Contact Us
            </Link>
          </nav>

          {/* Desktop Actions */}
          <div className="hidden md:flex items-center gap-3">
            <ThemeToggle />
            <UserNav />
          </div>

          {/* Mobile View: Reduced Navbar with Wallet Pill + Profile Trigger */}
          <div className="flex md:hidden items-center gap-2">
            {/* Mobile Wallet Balance Pill matching Screenshot */}
            {isAuthenticated ? (
              <button
                type="button"
                onClick={() => setIsAddMoneyOpen(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-black px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm transition-all active:scale-95 cursor-pointer"
                title="Wallet Balance / Add Money"
              >
                <CreditCard size={13} />
                <span>{profile?.balance || 0}৳</span>
              </button>
            ) : (
              <Link
                href="/login"
                className="bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold px-3 py-1.5 rounded-full shadow-sm"
              >
                Login
              </Link>
            )}

            {/* Profile Avatar / Drawer Trigger */}
            <button
              type="button"
              onClick={() => setIsDrawerOpen(true)}
              className="flex items-center justify-center p-0.5 rounded-full border border-purple-200 dark:border-purple-800/80 shadow-xs hover:scale-105 active:scale-95 transition-all cursor-pointer"
              aria-label="Open profile sidebar"
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-tr from-purple-700 to-indigo-600 text-white text-xs font-black flex items-center justify-center shadow-inner overflow-hidden">
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.full_name || "Avatar"}
                    className="w-full h-full object-cover"
                  />
                ) : profile?.full_name ? (
                  profile.full_name.charAt(0).toUpperCase()
                ) : (
                  <User size={15} />
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Profile Sidebar Drawer */}
      <ProfileDrawer isOpen={isDrawerOpen} onClose={() => setIsDrawerOpen(false)} />

      {/* Add Money Modal */}
      <AddMoneyModal isOpen={isAddMoneyOpen} onClose={() => setIsAddMoneyOpen(false)} />
    </>
  );
}
